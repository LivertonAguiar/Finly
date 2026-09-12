import assert from 'node:assert/strict';
import {
  isIncludedInAccountBalance,
  isIncludedInCardInvoice,
  isIncludedInCardLimit,
  isIncludedInPersonalAnalytics,
} from '../src/utils/transactionImpact';
import type { Transaction } from '../src/types';

const base: Transaction = {
  id: 'tx-base',
  description: 'Compra',
  amount: 100,
  type: 'expense',
  date: '2026-09-12',
  categoryId: 'cat-desp-compras',
  status: 'completed',
  recurring: false,
  tags: [],
  createdAt: '2026-09-12T12:00:00.000Z',
};

const ignoredBank = {
  ...base,
  accountId: 'acc-1',
  ignored: true,
  analyticsExclusionReason: 'manual' as const,
};
assert.equal(isIncludedInAccountBalance(ignoredBank), true);
assert.equal(isIncludedInPersonalAnalytics(ignoredBank), false);

const thirdPartyCard = {
  ...base,
  status: 'pending' as const,
  accountId: undefined,
  cardId: 'card-1',
  ignored: true,
  isThirdParty: true,
  analyticsExclusionReason: 'third_party' as const,
};
assert.equal(isIncludedInPersonalAnalytics(thirdPartyCard), false);
assert.equal(isIncludedInCardInvoice(thirdPartyCard), true);
assert.equal(isIncludedInCardLimit(thirdPartyCard), true);
assert.equal(isIncludedInAccountBalance(thirdPartyCard), false);

const paidCard = { ...thirdPartyCard, status: 'completed' as const };
assert.equal(isIncludedInCardInvoice(paidCard), true);
assert.equal(isIncludedInCardLimit(paidCard), false);

const reimbursement = {
  ...base,
  type: 'income' as const,
  accountId: 'acc-1',
  analyticsExclusionReason: 'reimbursement' as const,
};
assert.equal(isIncludedInAccountBalance(reimbursement), true);
assert.equal(isIncludedInPersonalAnalytics(reimbursement), false);

console.log('OK: impacto financeiro e impacto analítico permanecem independentes.');
