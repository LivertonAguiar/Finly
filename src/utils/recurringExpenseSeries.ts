import type {
  RecurringExpenseSeries,
  SupportedRecurrenceFrequency,
  Transaction,
  TransactionStatus,
} from '../types';
import { allocateCardTransaction } from './invoiceCalculator';

type ReconcileInput = {
  series: RecurringExpenseSeries;
  transactions: Transaction[];
  today: string;
  horizonMonths?: number;
  initialStatus?: TransactionStatus;
};

type ReconcileResult = {
  transactions: Transaction[];
  toCreate: Transaction[];
  toUpdate: Transaction[];
};

type AmountChangeInput = {
  series: RecurringExpenseSeries;
  transactions: Transaction[];
  selectedTransactionId: string;
  scope: 'single' | 'current_and_future';
  amount: number;
  overwriteExceptions: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const daysInMonth = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const addMonthsClamped = (date: string, months: number) => {
  const source = parseDate(date);
  const targetMonthIndex = source.getUTCMonth() + months;
  const targetYear = source.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const day = Math.min(source.getUTCDate(), daysInMonth(targetYear, normalizedMonth));
  return formatDate(new Date(Date.UTC(targetYear, normalizedMonth, day)));
};

const addYearsClamped = (date: string, years: number) => {
  const source = parseDate(date);
  const year = source.getUTCFullYear() + years;
  const month = source.getUTCMonth();
  const day = Math.min(source.getUTCDate(), daysInMonth(year, month));
  return formatDate(new Date(Date.UTC(year, month, day)));
};

const occurrenceDate = (
  startDate: string,
  frequency: SupportedRecurrenceFrequency,
  index: number,
) => {
  if (frequency === 'weekly') {
    const date = parseDate(startDate);
    date.setTime(date.getTime() + index * 7 * DAY_MS);
    return formatDate(date);
  }

  if (frequency === 'yearly') return addYearsClamped(startDate, index);
  return addMonthsClamped(startDate, index);
};

const dueDateForOccurrence = (
  series: RecurringExpenseSeries,
  index: number,
): string | undefined => {
  if (!series.firstDueDate) return undefined;
  return occurrenceDate(series.firstDueDate, series.frequency, index);
};

const amountForDate = (series: RecurringExpenseSeries, date: string) => {
  const rule = [...series.amountRules]
    .filter(candidate => candidate.effectiveFrom <= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  return rule?.amount ?? series.defaultAmount;
};

const buildOccurrence = (
  series: RecurringExpenseSeries,
  date: string,
  sequence: number,
  status: TransactionStatus,
): Transaction => {
  const isCard = Boolean(series.cardId);
  let invoiceMonth: string | undefined;
  let dueDate: string | undefined;

  if (isCard && series.cardClosingDay && series.cardDueDay) {
    const allocation = allocateCardTransaction(date, series.cardClosingDay, series.cardDueDay);
    invoiceMonth = allocation.invoiceMonth;
    dueDate = allocation.dueDate;
  } else {
    dueDate = dueDateForOccurrence(series, sequence - 1);
  }

  return {
    id: `tx-${series.id}-${date}`,
    description: series.description,
    amount: amountForDate(series, date),
    type: 'expense',
    date,
    dueDate,
    purchaseDate: isCard ? date : undefined,
    invoiceMonth,
    categoryId: series.categoryId,
    subcategoryId: series.subcategoryId,
    accountId: isCard ? undefined : series.accountId,
    cardId: series.cardId,
    status: isCard ? (status === 'completed' ? 'completed' : 'pending') : status,
    recurring: true,
    recurrenceFrequency: series.frequency,
    seriesId: series.id,
    seriesSequence: sequence,
    occurrenceKey: `recurring:${date}`,
    tags: [...series.tags],
    notes: series.notes,
    attachmentUrl: series.attachmentUrl,
    attachmentName: series.attachmentName,
    reminder: series.reminder ? { ...series.reminder } : undefined,
    ignored: series.ignored,
    analyticsExclusionReason: series.analyticsExclusionReason,
    createdAt: `${date}T12:00:00.000Z`,
  };
};

export const reconcileRecurringExpenseSeries = ({
  series,
  transactions,
  today,
  horizonMonths = 12,
  initialStatus,
}: ReconcileInput): ReconcileResult => {
  const horizonEnd = addMonthsClamped(today, horizonMonths);
  const byOccurrence = new Map(
    transactions
      .filter(transaction => transaction.seriesId === series.id)
      .map(transaction => [transaction.occurrenceKey ?? `recurring:${transaction.date}`, transaction]),
  );
  const toCreate: Transaction[] = [];
  const toUpdate: Transaction[] = [];
  let index = 0;

  while (index < 1000) {
    const date = occurrenceDate(series.startDate, series.frequency, index);
    if (date >= horizonEnd || (series.endDate && date > series.endDate)) break;

    const key = `recurring:${date}`;
    const existing = byOccurrence.get(key);
    if (existing) {
      if (existing.status === 'scheduled' && date <= today) {
        const updated = { ...existing, status: 'pending' as const };
        byOccurrence.set(key, updated);
        toUpdate.push(updated);
      }
    } else if (date >= today) {
      const status =
        index === 0 && date === series.startDate && date <= today && initialStatus
          ? initialStatus
          : date <= today
            ? 'pending'
            : 'scheduled';
      const transaction = buildOccurrence(series, date, index + 1, status);
      byOccurrence.set(key, transaction);
      toCreate.push(transaction);
    }
    index += 1;
  }

  const untouched = transactions.filter(transaction => transaction.seriesId !== series.id);
  const reconciled = [...byOccurrence.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { transactions: [...untouched, ...reconciled], toCreate, toUpdate };
};

export const applyRecurringAmountChange = ({
  series,
  transactions,
  selectedTransactionId,
  scope,
  amount,
  overwriteExceptions,
}: AmountChangeInput) => {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('O valor deve ser maior que zero.');
  const selected = transactions.find(transaction => transaction.id === selectedTransactionId);
  if (!selected || selected.seriesId !== series.id) {
    throw new Error('Ocorrência da série não encontrada.');
  }

  if (scope === 'single') {
    return {
      series,
      transactions: transactions.map(transaction =>
        transaction.id === selectedTransactionId
          ? { ...transaction, amount, isSeriesException: true }
          : transaction,
      ),
    };
  }

  const rule = { effectiveFrom: selected.date, amount };
  const updatedSeries: RecurringExpenseSeries = {
    ...series,
    amountRules: [
      ...series.amountRules.filter(item => item.effectiveFrom !== selected.date),
      rule,
    ].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom)),
    updatedAt: new Date().toISOString(),
  };

  return {
    series: updatedSeries,
    transactions: transactions.map(transaction => {
      const isAffected = transaction.seriesId === series.id && transaction.date >= selected.date;
      if (!isAffected || (transaction.isSeriesException && !overwriteExceptions)) return transaction;
      return { ...transaction, amount, isSeriesException: false };
    }),
  };
};
