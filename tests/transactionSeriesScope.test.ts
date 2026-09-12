import assert from 'node:assert/strict';
import { selectSeriesTargets } from '../src/utils/transactionSeriesScope';
import type { CardInstallmentSeries, Transaction } from '../src/types';

const series: CardInstallmentSeries = {
  id: 'series-card',
  kind: 'card_installment',
  description: 'Notebook',
  categoryId: 'cat-desp-compras',
  startDate: '2026-01-10',
  cardId: 'card-1',
  purchaseDate: '2026-01-10',
  firstInvoiceMonth: '2026-05',
  totalAmount: 1200,
  totalInstallments: 12,
  firstTrackedInstallment: 5,
  amountInputMode: 'total',
  createdAt: '2026-01-10T12:00:00.000Z',
  updatedAt: '2026-01-10T12:00:00.000Z',
};

const transactions: Transaction[] = Array.from({ length: 8 }, (_, index) => {
  const sequence = index + 5;
  return {
    id: `tx-${sequence}`,
    description: `Notebook (${sequence}/12)`,
    amount: 100,
    type: 'expense',
    date: `2026-${String(sequence).padStart(2, '0')}-10`,
    categoryId: series.categoryId,
    cardId: series.cardId,
    status: sequence === 5 ? 'completed' : sequence === 6 ? 'pending' : 'scheduled',
    recurring: false,
    seriesId: series.id,
    seriesSequence: sequence,
    occurrenceKey: `card:${sequence}`,
    installments: { current: sequence, total: 12, parentId: series.id },
    tags: [],
    createdAt: series.createdAt,
  };
});

const one = selectSeriesTargets({
  series,
  transactions,
  selectedTransactionId: 'tx-6',
  scope: 'single',
});
assert.deepEqual(one.transactionIds, ['tx-6']);
assert.equal(one.totalAmount, 100);

const future = selectSeriesTargets({
  series,
  transactions,
  selectedTransactionId: 'tx-6',
  scope: 'current_and_future',
});
assert.equal(future.transactionIds.length, 7);
assert.equal(future.statusCounts.pending, 1);
assert.equal(future.statusCounts.scheduled, 6);
assert.equal(future.includesHistoricalPaid, false);

const entire = selectSeriesTargets({
  series,
  transactions,
  selectedTransactionId: 'tx-6',
  scope: 'entire_series',
});
assert.equal(entire.transactionIds.length, 8);
assert.equal(entire.statusCounts.completed, 1);
assert.equal(entire.historicalPaidCount, 4);
assert.equal(entire.includesHistoricalPaid, true);
assert.equal(entire.requiresReinforcedConfirmation, true);

const legacy = selectSeriesTargets({
  series: undefined,
  transactions,
  selectedTransactionId: 'tx-6',
  scope: 'current_and_future',
});
assert.deepEqual(legacy.transactionIds, ['tx-6']);
assert.equal(legacy.wasDowngradedToSingle, true);

console.log('OK: exclusão por escopo usa a mesma seleção da prévia e protege legado/histórico.');
