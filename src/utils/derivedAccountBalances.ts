import { Account, Transaction } from '../types';
import { round2 } from './formatters';

export const calculateDerivedAccountBalances = (
  accounts: Account[],
  transactions: Transaction[],
): Account[] => {
  const defaultAccId = accounts[0]?.id || 'acc-carteira-padrao';
  return accounts.map(account => {
    let balance = account.initialBalance ?? 0;
    for (const tx of transactions) {
      if (tx.status !== 'completed') continue;
      const isThisAccount = tx.accountId === account.id || (!tx.cardId && !tx.accountId && account.id === defaultAccId);

      if (tx.type === 'income' && isThisAccount) {
        balance += tx.amount;
      } else if (tx.type === 'expense' && isThisAccount) {
        balance -= tx.amount;
      } else if (tx.type === 'transfer') {
        if (tx.accountId === account.id) balance -= tx.amount;
        if (tx.targetAccountId === account.id) balance += tx.amount;
      }
    }
    balance = round2(balance);
    return balance !== account.balance ? { ...account, balance } : account;
  });
};
