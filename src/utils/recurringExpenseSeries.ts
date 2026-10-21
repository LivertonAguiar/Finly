import type {
  RecurringExpenseSeries,
  SupportedRecurrenceFrequency,
  Transaction,
  TransactionComponent,
  TransactionStatus,
} from '../types';
import { allocateCardTransaction } from './invoiceCalculator';
import { addMonthsToPeriod, getInvoiceDueDate } from './cardInstallmentSeries';

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

const getInvoiceMonthForOccurrence = (
  firstInvoiceMonth: string,
  frequency: SupportedRecurrenceFrequency,
  index: number,
): string => {
  const stepMonths = frequency === 'yearly' ? 12 : 1;
  return addMonthsToPeriod(firstInvoiceMonth, index * stepMonths);
};

const amountForDate = (series: RecurringExpenseSeries, date: string) => {
  const rule = [...series.amountRules]
    .filter(candidate => candidate.effectiveFrom <= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  return rule?.amount ?? series.defaultAmount;
};

export const projectRecurringComponents = (
  series: RecurringExpenseSeries,
  date: string,
  sequence: number,
): TransactionComponent[] => {
  const hasSeriesComponents = Boolean(
    series.hasComponents ||
    (Array.isArray(series.componentTemplates) && series.componentTemplates.length > 0)
  );
  if (!hasSeriesComponents || !Array.isArray(series.componentTemplates) || series.componentTemplates.length === 0) {
    return [];
  }

  const projectedComponents: TransactionComponent[] = [];

  series.componentTemplates.forEach((tmpl, index) => {
    // Regra para one_time: só gera na primeira ocorrência (sequence === 1)
    if (tmpl.type === 'one_time' && sequence > 1) {
      return;
    }

    // Regra para temporário: incrementa a parcela
    let recurrenceConfig = tmpl.recurrenceConfig ? { ...tmpl.recurrenceConfig } : undefined;
    if (tmpl.type === 'temporary' && recurrenceConfig?.enabled) {
      const startInstallment = recurrenceConfig.currentInstallment || 1;
      const projectedInstallment = startInstallment + (sequence - 1);
      const total = recurrenceConfig.totalInstallments || 1;

      // Se já ultrapassou o total de parcelas, não inclui nesta ocorrência
      if (projectedInstallment > total) {
        return;
      }

      recurrenceConfig.currentInstallment = projectedInstallment;
    }

    const compId = (tmpl as any).id || `tmpl-${index}`;
    projectedComponents.push({
      id: `comp-${series.id}-${date}-${compId}`,
      transactionId: `tx-${series.id}-${date}`,
      description: tmpl.description,
      amount: tmpl.amount,
      categoryId: tmpl.categoryId || series.categoryId,
      subcategoryId: tmpl.subcategoryId || series.subcategoryId,
      type: tmpl.type,
      recurrenceConfig,
      includeInReports: tmpl.includeInReports ?? true,
      includeInBudget: tmpl.includeInBudget ?? true,
      notes: tmpl.notes,
      createdAt: `${date}T12:00:00.000Z`,
      updatedAt: `${date}T12:00:00.000Z`,
    });
  });

  return projectedComponents;
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
    if (series.firstInvoiceMonth) {
      invoiceMonth = getInvoiceMonthForOccurrence(series.firstInvoiceMonth, series.frequency, sequence - 1);
      dueDate = getInvoiceDueDate(invoiceMonth, series.cardClosingDay, series.cardDueDay);
    } else {
      const allocation = allocateCardTransaction(date, series.cardClosingDay, series.cardDueDay);
      invoiceMonth = allocation.invoiceMonth;
      dueDate = allocation.dueDate;
    }
  } else {
    dueDate = dueDateForOccurrence(series, sequence - 1);
  }

  let hasComponents = false;
  let components: TransactionComponent[] | undefined = undefined;
  let occurrenceAmount = amountForDate(series, date);

  const projected = projectRecurringComponents(series, date, sequence);
  if (projected.length > 0) {
    hasComponents = true;
    components = projected;
    const totalCents = projected.reduce((sum, c) => sum + Math.round((Number(c.amount) || 0) * 100), 0);
    occurrenceAmount = Math.round(totalCents) / 100;
  }

  return {
    id: `tx-${series.id}-${date}`,
    description: series.description,
    amount: occurrenceAmount,
    hasComponents,
    components,
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
      let changed = false;
      let updated = { ...existing };
      if (existing.status === 'scheduled' && date <= today) {
        updated.status = 'pending';
        changed = true;
      }

      const hasSeriesTemplates = Array.isArray(series.componentTemplates) && series.componentTemplates.length > 0;
      // Reconciliar componentes em ocorrências existentes não concluídas e que não sejam exceções manuais
      if (hasSeriesTemplates && existing.status !== 'completed' && !existing.isSeriesException) {
        const projected = projectRecurringComponents(series, date, index + 1);
        if (projected.length > 0) {
          const totalCents = projected.reduce((sum, c) => sum + Math.round((Number(c.amount) || 0) * 100), 0);
          const newAmount = Math.round(totalCents) / 100;
          if (
            !updated.hasComponents ||
            updated.amount !== newAmount ||
            !updated.components ||
            updated.components.length !== projected.length
          ) {
            updated.hasComponents = true;
            updated.components = projected;
            updated.amount = newAmount;
            changed = true;
          }
        } else if (updated.hasComponents) {
          // Se não há mais componentes projetados (ex: temporários expiraram), limpa componentes e volta para o defaultAmount da série
          updated.hasComponents = false;
          updated.components = undefined;
          const fallbackAmount = amountForDate(series, date);
          if (updated.amount !== fallbackAmount) {
            updated.amount = fallbackAmount;
            changed = true;
          }
        }
      } else if (updated.hasComponents && Array.isArray(updated.components) && updated.components.length > 0) {
        // Garantia de integridade: se a transação tem componentes, o amount deve bater com a soma exata dos componentes
        const totalCents = updated.components.reduce((sum, c) => sum + Math.round((Number(c.amount) || 0) * 100), 0);
        const compAmount = Math.round(totalCents) / 100;
        if (compAmount > 0 && updated.amount !== compAmount) {
          updated.amount = compAmount;
          changed = true;
        }
      }

      if (changed) {
        byOccurrence.set(key, updated);
        toUpdate.push(updated);
      }
    } else if (date >= today || (index === 0 && date === series.startDate)) {
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

export interface ComponentsChangeInput {
  series: RecurringExpenseSeries;
  transactions: Transaction[];
  selectedTransactionId: string;
  scope: 'single' | 'current_and_future';
  components: Array<Omit<TransactionComponent, 'id' | 'transactionId' | 'createdAt' | 'updatedAt'>>;
  totalAmount?: number;
  overwriteExceptions?: boolean;
}

export const applyRecurringExpenseComponentsChange = ({
  series,
  transactions,
  selectedTransactionId,
  scope,
  components,
  totalAmount,
  overwriteExceptions = false,
}: ComponentsChangeInput) => {
  const selected = transactions.find(t => t.id === selectedTransactionId);
  if (!selected || selected.seriesId !== series.id) {
    throw new Error('Ocorrência da série não encontrada.');
  }

  const selectedSeq = selected.seriesSequence || 1;

  if (scope === 'single') {
    return {
      series,
      transactions: transactions.map(t => {
        if (t.id !== selectedTransactionId) return t;
        const totalCents = components.reduce((sum, c) => sum + Math.round((Number(c.amount) || 0) * 100), 0);
        const resolvedAmount = totalAmount ?? (components.length > 0 ? Math.round(totalCents) / 100 : t.amount);
        return {
          ...t,
          hasComponents: components.length > 0,
          components: components.map((c, i) => ({
            ...c,
            id: `comp-${t.id}-${i + 1}`,
            transactionId: t.id,
            createdAt: `${t.date}T12:00:00.000Z`,
            updatedAt: `${t.date}T12:00:00.000Z`,
          })),
          amount: resolvedAmount,
          isSeriesException: true,
        };
      }),
    };
  }

  // Escopo 'current_and_future':
  // 1. Deriva os templates para a série a partir dos componentes fornecidos.
  // Componentes 'fixed' e 'variable' (como taxa geral e água) tornam-se templates recorrentes para todos os meses futuros!
  // Componentes 'temporary' têm a parcela base ajustada com base na sequência atual.
  // Componentes 'one_time' são mantidos somente na ocorrência selecionada e NÃO entram nos templates futuros.
  const componentTemplates: Array<Omit<TransactionComponent, 'id' | 'transactionId'>> = components
    .filter(c => c.type !== 'one_time')
    .map(c => {
      let recurrenceConfig = c.recurrenceConfig ? { ...c.recurrenceConfig } : undefined;
      if (c.type === 'temporary' && recurrenceConfig?.enabled) {
        const cur = recurrenceConfig.currentInstallment || 1;
        // Ajusta a parcela inicial relativa ao início da série (sequence 1)
        const baseStart = Math.max(1, cur - (selectedSeq - 1));
        recurrenceConfig.currentInstallment = baseStart;
      }
      return {
        description: c.description,
        amount: c.amount,
        categoryId: c.categoryId,
        subcategoryId: c.subcategoryId,
        type: c.type || 'fixed',
        recurrenceConfig,
        notes: c.notes,
        financialNature: c.financialNature,
        characteristics: c.characteristics,
        includeInReports: c.includeInReports ?? true,
        includeInBudget: c.includeInBudget ?? true,
      };
    });

  const updatedSeries: RecurringExpenseSeries = {
    ...series,
    hasComponents: componentTemplates.length > 0,
    componentTemplates: componentTemplates.length > 0 ? componentTemplates : undefined,
    updatedAt: new Date().toISOString(),
  };

  const updatedTransactions = transactions.map(t => {
    if (t.seriesId !== series.id) return t;

    // Ocorrências passadas não são alteradas
    if (t.date < selected.date) return t;

    // Ocorrência selecionada: recebe exatamente os componentes informados
    if (t.id === selected.id) {
      const totalCents = components.reduce((sum, c) => sum + Math.round((Number(c.amount) || 0) * 100), 0);
      const resolvedAmount = totalAmount ?? (components.length > 0 ? Math.round(totalCents) / 100 : t.amount);
      return {
        ...t,
        hasComponents: components.length > 0,
        components: components.map((c, i) => ({
          ...c,
          id: `comp-${t.id}-${i + 1}`,
          transactionId: t.id,
          createdAt: `${t.date}T12:00:00.000Z`,
          updatedAt: `${t.date}T12:00:00.000Z`,
        })),
        amount: resolvedAmount,
        isSeriesException: false,
      };
    }

    // Ocorrências futuras (t.date > selected.date)
    if (t.isSeriesException && !overwriteExceptions) return t;

    const seq = t.seriesSequence || selectedSeq + 1;
    const projected = projectRecurringComponents(updatedSeries, t.date, seq);

    if (projected.length > 0) {
      const totalCents = projected.reduce((sum, c) => sum + Math.round((Number(c.amount) || 0) * 100), 0);
      return {
        ...t,
        hasComponents: true,
        components: projected,
        amount: Math.round(totalCents) / 100,
        isSeriesException: false,
      };
    }

    return {
      ...t,
      hasComponents: false,
      components: undefined,
      amount: amountForDate(updatedSeries, t.date),
      isSeriesException: false,
    };
  });

  return {
    series: updatedSeries,
    transactions: updatedTransactions,
  };
};

export const discoverSeriesComponentTemplates = (
  series: RecurringExpenseSeries,
  seriesTransactions: Transaction[],
): Array<Omit<TransactionComponent, 'id' | 'transactionId'>> | undefined => {
  if (Array.isArray(series.componentTemplates) && series.componentTemplates.length > 0) {
    return series.componentTemplates;
  }
  // Se series.componentTemplates estiver vazio, procurar na ocorrência mais recente da série que possui componentes
  const withComps = [...seriesTransactions]
    .filter(t => t.seriesId === series.id && t.hasComponents && Array.isArray(t.components) && t.components.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (withComps.length === 0) return undefined;

  const latestWithComps = withComps[0];
  const templates: Array<Omit<TransactionComponent, 'id' | 'transactionId'>> = [];

  (latestWithComps.components || []).forEach(c => {
    // Apenas componentes recorrentes (fixed, variable ou temporary)
    if (c.type === 'one_time') return;
    templates.push({
      description: c.description,
      amount: c.amount,
      categoryId: c.categoryId,
      subcategoryId: c.subcategoryId,
      type: c.type || 'fixed',
      recurrenceConfig: c.recurrenceConfig,
      notes: c.notes,
      financialNature: c.financialNature,
      characteristics: c.characteristics,
      includeInReports: c.includeInReports ?? true,
      includeInBudget: c.includeInBudget ?? true,
    });
  });

  return templates.length > 0 ? templates : undefined;
};

