import assert from 'node:assert/strict';
import {
  buildCardInstallmentSeries,
  buildCardInstallmentTimeline,
} from '../src/utils/cardInstallmentSeries';

const imported = buildCardInstallmentSeries({
  seriesId: 'series-card-iphone',
  description: 'iPhone',
  amount: 1200,
  amountInputMode: 'total',
  totalInstallments: 12,
  firstTrackedInstallment: 5,
  purchaseDate: '2026-05-10',
  firstInvoiceMonth: '2026-09',
  cardId: 'card-1',
  cardClosingDay: 5,
  cardDueDay: 10,
  categoryId: 'cat-desp-compras',
  subcategoryId: 'sub-compras-eletronicos',
  ignored: false,
  isThirdParty: false,
  tags: [],
  createdAt: '2026-09-12T12:00:00.000Z',
});

assert.equal(imported.series.firstTrackedInstallment, 5);
assert.equal(imported.transactions.length, 8);
assert.deepEqual(imported.transactions.map(tx => tx.installments?.current), [5, 6, 7, 8, 9, 10, 11, 12]);
assert.equal(imported.transactions[0].invoiceMonth, '2026-09');
assert.equal(imported.transactions[0].status, 'pending');
assert.equal(imported.transactions[0].seriesId, imported.series.id);
assert.equal(imported.transactions[0].installments?.parentId, imported.series.id);
assert.equal(imported.transactions.reduce((sum, tx) => sum + tx.amount, 0), 800);

const timeline = buildCardInstallmentTimeline(imported);
assert.equal(timeline.length, 12);
assert.deepEqual(timeline.slice(0, 4).map(item => item.status), [
  'historical_paid',
  'historical_paid',
  'historical_paid',
  'historical_paid',
]);
assert.equal(timeline[4].status, 'pending');
assert.equal(timeline.filter(item => item.status === 'historical_paid').length, 4);

const split = buildCardInstallmentSeries({
  seriesId: 'series-card-centavos',
  description: 'Compra teste',
  amount: 100,
  amountInputMode: 'total',
  totalInstallments: 3,
  firstTrackedInstallment: 1,
  purchaseDate: '2026-01-31',
  firstInvoiceMonth: '2026-01',
  cardId: 'card-1',
  cardClosingDay: 5,
  cardDueDay: 10,
  categoryId: 'cat-desp-compras',
  ignored: false,
  isThirdParty: false,
  tags: [],
  createdAt: '2026-01-01T12:00:00.000Z',
});

assert.deepEqual(split.transactions.map(tx => tx.amount), [33.33, 33.33, 33.34]);
assert.deepEqual(split.transactions.map(tx => tx.date), ['2026-01-31', '2026-02-28', '2026-03-31']);
assert.equal(split.transactions.reduce((sum, tx) => sum + tx.amount, 0), 100);

const perInstallment = buildCardInstallmentSeries({
  ...split.series,
  seriesId: 'series-card-por-parcela',
  amount: 25,
  amountInputMode: 'per_installment',
  totalInstallments: 4,
  firstTrackedInstallment: 1,
  cardClosingDay: 5,
  cardDueDay: 10,
  tags: [],
  createdAt: '2026-01-01T12:00:00.000Z',
});

assert.equal(perInstallment.series.totalAmount, 100);
assert.deepEqual(perInstallment.transactions.map(tx => tx.amount), [25, 25, 25, 25]);

console.log('OK: séries parceladas preservam histórico, fatura, calendário e centavos.');
