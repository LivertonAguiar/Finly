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

// Teste de compras parceladas no cartão com detalhamento em itens analíticos
const cardWithComponents = buildCardInstallmentSeries({
  seriesId: 'series-card-mercado',
  description: 'Supermercado Mensal',
  amount: 300,
  amountInputMode: 'total',
  totalInstallments: 3,
  firstTrackedInstallment: 1,
  purchaseDate: '2026-09-15',
  firstInvoiceMonth: '2026-09',
  cardId: 'card-1',
  cardClosingDay: 5,
  cardDueDay: 10,
  categoryId: 'cat-desp-alimentacao',
  ignored: false,
  isThirdParty: false,
  tags: [],
  createdAt: '2026-09-15T12:00:00.000Z',
  hasComponents: true,
  components: [
    {
      description: 'Alimentos e Carnes',
      amount: 180, // 60%
      categoryId: 'cat-desp-alimentacao',
      type: 'one_time',
    },
    {
      description: 'Produtos de Limpeza',
      amount: 120, // 40%
      categoryId: 'cat-desp-moradia',
      type: 'one_time',
    },
  ],
});

assert.equal(cardWithComponents.transactions.length, 3);
cardWithComponents.transactions.forEach(tx => {
  assert.equal(tx.hasComponents, true);
  assert.equal(tx.components?.length, 2);
  assert.equal(tx.components?.[0].description, 'Alimentos e Carnes');
  assert.equal(tx.components?.[0].amount, 60);
  assert.equal(tx.components?.[1].description, 'Produtos de Limpeza');
  assert.equal(tx.components?.[1].amount, 40);
  // A soma dos componentes da parcela bate 100% com o valor da parcela (100)
  const sumComp = (tx.components || []).reduce((acc, c) => acc + c.amount, 0);
  assert.equal(sumComp, tx.amount);
});

console.log('OK: séries parceladas preservam histórico, fatura, calendário, centavos e detalhamento analítico de componentes.');
