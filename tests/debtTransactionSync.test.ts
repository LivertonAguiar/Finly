import assert from 'node:assert/strict';
import { reconcileDebtTransactions } from '../src/utils/debtTransactionSync';
import type { Account, Debt, Transaction } from '../src/types';

const accounts: Account[] = [{
  id: 'acc-test',
  name: 'Conta teste',
  type: 'checking',
  balance: 1000,
  initialBalance: 1000,
  color: '#6366f1',
  includeInTotal: true,
}];

const legacyDebt: Debt = {
  id: 'debt-legacy',
  title: 'Financiamento legado',
  creditor: 'Banco teste',
  totalAmount: 24000,
  remainingAmount: 12000,
  installmentAmount: 1000,
  totalInstallments: 24,
  paidInstallments: 12,
  dueDay: 10,
  nextDueDate: '2026-09-10',
  payments: [],
};

const first = reconcileDebtTransactions([legacyDebt], [], accounts, {
  horizonMonths: 12,
  now: new Date('2026-09-01T12:00:00Z'),
});

assert.equal(first.createdCount, 12);
assert.equal(first.debts[0].syncToTransactions, true);
assert.equal(first.transactions.length, 12);
assert.equal(first.transactions[0].debtId, legacyDebt.id);
assert.equal(first.transactions[0].debtInstallmentNumber, 13);
assert.equal(first.transactions[0].installments?.debtId, legacyDebt.id);
assert.equal(first.transactions[0].installments?.debtInstallmentNumber, 13);

const second = reconcileDebtTransactions(first.debts, first.transactions as Transaction[], accounts, {
  horizonMonths: 12,
  now: new Date('2026-09-01T12:00:00Z'),
});

assert.equal(second.createdCount, 0);
assert.equal(second.transactions.length, 12);
console.log('OK: backfill de parcelas legado é persistente e idempotente.');
