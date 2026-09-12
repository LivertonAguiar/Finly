import assert from 'node:assert/strict';
import { migrateLegacyTransactionSeries } from '../src/utils/transactionSeriesMigration';
import type { Transaction } from '../src/types';

const recurring: Transaction = {
  id: 'legacy-energy', description: 'Energia', amount: 200, type: 'expense',
  date: '2026-09-12', dueDate: '2026-09-12', categoryId: 'cat-desp-moradia',
  accountId: 'acc-1', status: 'pending', recurring: true, recurrenceFrequency: 'monthly',
  tags: ['Casa'], ignored: false, createdAt: '2026-09-12T12:00:00.000Z',
};
const daily: Transaction = {
  ...recurring, id: 'legacy-daily', description: 'Diária', recurrenceFrequency: 'daily',
};
const cardFive: Transaction = {
  ...recurring, id: 'legacy-card-5', description: 'Notebook (5/12)', recurring: false,
  accountId: undefined, cardId: 'card-1', purchaseDate: '2026-01-10', invoiceMonth: '2026-05',
  installments: { current: 5, total: 12, parentId: 'parent-card' },
};
const cardSix: Transaction = {
  ...cardFive, id: 'legacy-card-6', description: 'Notebook (6/12)', invoiceMonth: '2026-06',
  installments: { current: 6, total: 12, parentId: 'parent-card' },
};

const migrated = migrateLegacyTransactionSeries({
  transactions: [recurring, daily, cardFive, cardSix], series: [], today: '2026-09-12',
});
assert.equal(migrated.stats.recurringMigrated, 1);
assert.equal(migrated.stats.cardGroupsMigrated, 1);
assert.equal(migrated.stats.needsReview, 1);
assert.equal(migrated.series.length, 2);
assert.equal(migrated.transactions.find(tx => tx.id === daily.id)?.recurringNeedsReview, true);
assert.ok(migrated.transactions.find(tx => tx.id === recurring.id)?.seriesId);
assert.equal(migrated.transactions.filter(tx => tx.seriesId === 'series-recurring-legacy-energy').length, 12);
assert.equal(migrated.transactions.find(tx => tx.id === cardFive.id)?.seriesSequence, 5);

const repeated = migrateLegacyTransactionSeries({
  transactions: migrated.transactions, series: migrated.series, today: '2026-09-12',
});
assert.equal(repeated.series.length, 2);
assert.equal(repeated.transactions.length, migrated.transactions.length);

console.log('OK: migração legada é idempotente e não expande recorrência diária.');
