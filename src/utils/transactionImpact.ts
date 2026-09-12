import type { Transaction } from '../types';

export const isIncludedInPersonalAnalytics = (transaction: Transaction): boolean => (
  !transaction.ignored &&
  !transaction.isThirdParty &&
  !transaction.analyticsExclusionReason
);

export const isIncludedInAccountBalance = (transaction: Transaction): boolean => (
  transaction.status === 'completed' && !transaction.cardId
);

export const isIncludedInCardInvoice = (transaction: Transaction): boolean => (
  transaction.type === 'expense' && Boolean(transaction.cardId)
);

export const isIncludedInCardLimit = (transaction: Transaction): boolean => (
  isIncludedInCardInvoice(transaction) && transaction.status !== 'completed'
);
