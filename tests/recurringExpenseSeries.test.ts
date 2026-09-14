import assert from 'node:assert/strict';
import {
  applyRecurringAmountChange,
  reconcileRecurringExpenseSeries,
} from '../src/utils/recurringExpenseSeries';
import type { RecurringExpenseSeries } from '../src/types';

const series: RecurringExpenseSeries = {
  id: 'series-energy',
  kind: 'recurring_expense',
  description: 'Energia elétrica',
  categoryId: 'cat-desp-moradia',
  subcategoryId: 'sub-mor-energia',
  accountId: 'acc-1',
  startDate: '2026-01-31',
  frequency: 'monthly',
  defaultAmount: 200,
  amountRules: [],
  tags: ['Casa'],
  ignored: false,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

const first = reconcileRecurringExpenseSeries({
  series,
  transactions: [],
  today: '2026-01-31',
  horizonMonths: 12,
  initialStatus: 'completed',
});

assert.equal(first.transactions.length, 12);
assert.equal(first.transactions[0].date, '2026-01-31');
assert.equal(first.transactions[0].status, 'completed');
assert.equal(first.transactions[1].date, '2026-02-28');
assert.equal(first.transactions[1].status, 'scheduled');
assert.equal(first.transactions.at(-1)?.date, '2026-12-31');

const second = reconcileRecurringExpenseSeries({
  series,
  transactions: first.transactions,
  today: '2026-01-31',
  horizonMonths: 12,
});
assert.equal(second.toCreate.length, 0);
assert.equal(second.transactions.length, 12);

const february = first.transactions[1];
const exception = applyRecurringAmountChange({
  series,
  transactions: first.transactions,
  selectedTransactionId: february.id,
  scope: 'single',
  amount: 260,
  overwriteExceptions: false,
});
assert.equal(exception.transactions.find(tx => tx.id === february.id)?.amount, 260);
assert.equal(exception.transactions.find(tx => tx.id === february.id)?.isSeriesException, true);

const futureRule = applyRecurringAmountChange({
  series: exception.series,
  transactions: exception.transactions,
  selectedTransactionId: first.transactions[0].id,
  scope: 'current_and_future',
  amount: 220,
  overwriteExceptions: false,
});
assert.equal(futureRule.transactions[0].amount, 220);
assert.equal(futureRule.transactions[1].amount, 260);
assert.equal(futureRule.transactions[2].amount, 220);

const ended = reconcileRecurringExpenseSeries({
  series: { ...series, endDate: '2026-03-31' },
  transactions: [],
  today: '2026-01-31',
  horizonMonths: 12,
});
assert.deepEqual(ended.transactions.map(tx => tx.date), ['2026-01-31', '2026-02-28', '2026-03-31']);

// Teste do caso do usuário: compra recorrente em cartão no passado recente com fatura de destino governando início
const cardSeries: RecurringExpenseSeries = {
  id: 'series-card-meli',
  kind: 'recurring_expense',
  description: 'Assinatura Meli+',
  categoryId: 'cat-assinaturas',
  cardId: 'card-inter',
  cardClosingDay: 26,
  cardDueDay: 5,
  paymentMethod: 'card',
  startDate: '2026-09-08',
  firstDueDate: '2026-10-05',
  firstInvoiceMonth: '2026-10',
  frequency: 'monthly',
  defaultAmount: 27.9,
  amountRules: [],
  tags: ['Assinaturas'],
  ignored: false,
  createdAt: '2026-09-14T12:00:00.000Z',
  updatedAt: '2026-09-14T12:00:00.000Z',
};

const cardReconciled = reconcileRecurringExpenseSeries({
  series: cardSeries,
  transactions: [],
  today: '2026-09-14',
  horizonMonths: 12,
  initialStatus: 'pending',
});

// A primeira ocorrência NÃO deve ser descartada mesmo startDate sendo anterior a today (08/09 < 14/09)
assert.equal(cardReconciled.transactions[0].date, '2026-09-08');
assert.equal(cardReconciled.transactions[0].invoiceMonth, '2026-10');
assert.equal(cardReconciled.transactions[0].seriesSequence, 1);
assert.equal(cardReconciled.transactions[0].status, 'pending');

// A segunda ocorrência deve ir para a fatura seguinte (Novembro/2026)
assert.equal(cardReconciled.transactions[1].date, '2026-10-08');
assert.equal(cardReconciled.transactions[1].invoiceMonth, '2026-11');
assert.equal(cardReconciled.transactions[1].seriesSequence, 2);

// A terceira ocorrência deve ir para a fatura de Dezembro/2026
assert.equal(cardReconciled.transactions[2].date, '2026-11-08');
assert.equal(cardReconciled.transactions[2].invoiceMonth, '2026-12');
assert.equal(cardReconciled.transactions[2].seriesSequence, 3);

console.log('OK: despesas fixas e compras recorrentes em cartão reconciliam horizonte, faturas de destino e datas passadas.');

