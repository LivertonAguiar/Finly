import type { Transaction, TransactionSeries } from '../types';

export type SeriesMutationScope = 'single' | 'current_and_future' | 'entire_series';

export interface SeriesTargetSelection {
  transactionIds: string[];
  statusCounts: Record<'completed' | 'pending' | 'scheduled', number>;
  totalAmount: number;
  historicalPaidCount: number;
  includesHistoricalPaid: boolean;
  includesPaidTransactions: boolean;
  requiresReinforcedConfirmation: boolean;
  wasDowngradedToSingle: boolean;
  removeSeries: boolean;
}

export const selectSeriesTargets = ({
  series,
  transactions,
  selectedTransactionId,
  scope,
}: {
  series?: TransactionSeries;
  transactions: Transaction[];
  selectedTransactionId: string;
  scope: SeriesMutationScope;
}): SeriesTargetSelection => {
  const selected = transactions.find(transaction => transaction.id === selectedTransactionId);
  if (!selected) throw new Error('Transação selecionada não encontrada.');

  const hasSafeSeries = Boolean(series && selected.seriesId === series.id);
  const effectiveScope = hasSafeSeries ? scope : 'single';
  const selectedOrder = selected.seriesSequence ?? 0;
  const targets = transactions
    .filter(transaction => {
      if (effectiveScope === 'single') return transaction.id === selected.id;
      if (transaction.seriesId !== series?.id) return false;
      if (effectiveScope === 'entire_series') return true;
      const order = transaction.seriesSequence;
      return typeof order === 'number'
        ? order >= selectedOrder
        : transaction.date >= selected.date;
    })
    .sort((a, b) => (a.seriesSequence ?? 0) - (b.seriesSequence ?? 0));

  const historicalPaidCount =
    effectiveScope === 'entire_series' && series?.kind === 'card_installment'
      ? Math.max(0, series.firstTrackedInstallment - 1)
      : 0;
  const statusCounts = targets.reduce<SeriesTargetSelection['statusCounts']>(
    (counts, transaction) => {
      counts[transaction.status] += 1;
      return counts;
    },
    { completed: 0, pending: 0, scheduled: 0 },
  );
  const includesPaidTransactions = statusCounts.completed > 0;
  const includesHistoricalPaid = historicalPaidCount > 0;

  return {
    transactionIds: targets.map(transaction => transaction.id),
    statusCounts,
    totalAmount: Math.round(targets.reduce((sum, transaction) => sum + transaction.amount, 0) * 100) / 100,
    historicalPaidCount,
    includesHistoricalPaid,
    includesPaidTransactions,
    requiresReinforcedConfirmation:
      effectiveScope === 'entire_series' && (includesPaidTransactions || includesHistoricalPaid),
    wasDowngradedToSingle: effectiveScope !== scope,
    removeSeries: effectiveScope === 'entire_series',
  };
};
