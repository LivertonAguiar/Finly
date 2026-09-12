import type {
  CardInstallmentSeries,
  RecurringExpenseSeries,
  SupportedRecurrenceFrequency,
  Transaction,
  TransactionSeries,
} from '../types';
import { addMonthsClamped } from './cardInstallmentSeries';
import { reconcileRecurringExpenseSeries } from './recurringExpenseSeries';

export interface TransactionSeriesMigrationResult {
  transactions: Transaction[];
  series: TransactionSeries[];
  stats: {
    recurringMigrated: number;
    cardGroupsMigrated: number;
    needsReview: number;
  };
}

const withAnalyticsReason = (transaction: Transaction): Transaction => ({
  ...transaction,
  analyticsExclusionReason: transaction.analyticsExclusionReason ?? (
    transaction.isThirdParty ? 'third_party' : transaction.ignored ? 'manual' : undefined
  ),
});

export const migrateLegacyTransactionSeries = ({
  transactions,
  series,
  today,
}: {
  transactions: Transaction[];
  series: TransactionSeries[];
  today: string;
}): TransactionSeriesMigrationResult => {
  let migratedTransactions = transactions.map(withAnalyticsReason);
  const migratedSeries = [...series];
  const knownSeriesIds = new Set(series.map(item => item.id));
  const stats = { recurringMigrated: 0, cardGroupsMigrated: 0, needsReview: 0 };

  for (const legacy of [...migratedTransactions]) {
    if (!legacy.recurring || legacy.type !== 'expense' || legacy.cardId || legacy.seriesId) continue;
    if (legacy.recurrenceFrequency === 'daily') {
      migratedTransactions = migratedTransactions.map(transaction =>
        transaction.id === legacy.id ? { ...transaction, recurringNeedsReview: true } : transaction,
      );
      stats.needsReview += 1;
      continue;
    }

    const frequency: SupportedRecurrenceFrequency = legacy.recurrenceFrequency === 'weekly'
      ? 'weekly'
      : legacy.recurrenceFrequency === 'yearly' ? 'yearly' : 'monthly';
    const seriesId = `series-recurring-${legacy.id}`;
    if (knownSeriesIds.has(seriesId)) continue;
    const recurringSeries: RecurringExpenseSeries = {
      id: seriesId,
      kind: 'recurring_expense',
      description: legacy.description,
      categoryId: legacy.categoryId,
      subcategoryId: legacy.subcategoryId,
      accountId: legacy.accountId || '',
      startDate: legacy.date,
      firstDueDate: legacy.dueDate,
      frequency,
      defaultAmount: legacy.amount,
      amountRules: [],
      tags: [...legacy.tags],
      notes: legacy.notes,
      attachmentUrl: legacy.attachmentUrl,
      attachmentName: legacy.attachmentName,
      ignored: Boolean(legacy.ignored),
      analyticsExclusionReason: legacy.analyticsExclusionReason,
      reminder: legacy.reminder ? { ...legacy.reminder } : undefined,
      createdAt: legacy.createdAt,
      updatedAt: legacy.createdAt,
    };
    const linked = migratedTransactions.map(transaction =>
      transaction.id === legacy.id
        ? {
            ...transaction,
            seriesId,
            seriesSequence: 1,
            occurrenceKey: `recurring:${legacy.date}`,
            isSeriesException: false,
          }
        : transaction,
    );
    migratedTransactions = reconcileRecurringExpenseSeries({
      series: recurringSeries,
      transactions: linked,
      today,
      horizonMonths: 12,
    }).transactions;
    migratedSeries.push(recurringSeries);
    knownSeriesIds.add(seriesId);
    stats.recurringMigrated += 1;
  }

  const cardGroups = new Map<string, Transaction[]>();
  migratedTransactions.forEach(transaction => {
    const parentId = transaction.installments?.parentId;
    if (!transaction.cardId || transaction.seriesId || !parentId) return;
    const group = cardGroups.get(parentId) || [];
    group.push(transaction);
    cardGroups.set(parentId, group);
  });

  cardGroups.forEach((group, parentId) => {
    const ordered = [...group].sort(
      (a, b) => (a.installments?.current ?? 1) - (b.installments?.current ?? 1),
    );
    const first = ordered[0];
    const totalInstallments = first.installments?.total;
    const firstTrackedInstallment = first.installments?.current;
    if (!first.cardId || !totalInstallments || !firstTrackedInstallment) return;
    const seriesId = `series-card-${parentId}`;
    if (knownSeriesIds.has(seriesId)) return;
    const purchaseDate = first.purchaseDate || addMonthsClamped(first.date, -(firstTrackedInstallment - 1));
    const cardSeries: CardInstallmentSeries = {
      id: seriesId,
      kind: 'card_installment',
      description: first.description.replace(/\s*\(\d+\/\d+\)\s*$/, ''),
      categoryId: first.categoryId,
      subcategoryId: first.subcategoryId,
      startDate: purchaseDate,
      cardId: first.cardId,
      purchaseDate,
      firstInvoiceMonth: first.invoiceMonth || first.date.slice(0, 7),
      totalAmount: Math.round(first.amount * totalInstallments * 100) / 100,
      totalInstallments,
      firstTrackedInstallment,
      amountInputMode: 'per_installment',
      createdAt: first.createdAt,
      updatedAt: first.createdAt,
    };
    const ids = new Set(group.map(transaction => transaction.id));
    migratedTransactions = migratedTransactions.map(transaction =>
      ids.has(transaction.id)
        ? {
            ...transaction,
            seriesId,
            seriesSequence: transaction.installments?.current,
            occurrenceKey: `card:${transaction.installments?.current}`,
            installments: {
              ...transaction.installments,
              current: transaction.installments!.current,
              total: transaction.installments!.total,
              parentId: seriesId,
            },
          }
        : transaction,
    );
    migratedSeries.push(cardSeries);
    knownSeriesIds.add(seriesId);
    stats.cardGroupsMigrated += 1;
  });

  for (const recurringSeries of migratedSeries) {
    if (recurringSeries.kind !== 'recurring_expense' || recurringSeries.needsReview) continue;
    migratedTransactions = reconcileRecurringExpenseSeries({
      series: recurringSeries,
      transactions: migratedTransactions,
      today,
      horizonMonths: 12,
    }).transactions;
  }

  return { transactions: migratedTransactions, series: migratedSeries, stats };
};
