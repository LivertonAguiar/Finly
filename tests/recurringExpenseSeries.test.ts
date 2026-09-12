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

console.log('OK: despesas fixas reconciliam horizonte, datas, exceções e regras futuras.');
