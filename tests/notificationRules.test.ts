import assert from 'node:assert/strict';
import { selectFinancialNotificationCandidates } from '../src/utils/notificationEngine';
import type { CreditCard, Transaction } from '../src/types';

const cards: CreditCard[] = [{
  id: 'card-1', name: 'Finly Black', brand: 'Visa', limit: 5000,
  closingDay: 2, dueDay: 10, color: '#000000',
}];

const base: Transaction = {
  id: 'tx-bill', description: 'Energia', amount: 180, type: 'expense',
  date: '2026-09-01', dueDate: '2026-09-12', categoryId: 'cat-desp-moradia',
  accountId: 'acc-1', status: 'pending', recurring: false, tags: [],
  reminder: { enabled: true, daysBefore: 0, reminderTime: '09:00' },
  createdAt: '2026-09-01T12:00:00.000Z',
};

const cardExpense: Transaction = {
  ...base, id: 'tx-card-1', description: 'Mercado', amount: 100,
  accountId: undefined, cardId: 'card-1', invoiceMonth: '2026-09',
  reminder: { enabled: true, daysBefore: 0, reminderTime: '09:00' },
  ignored: true, isThirdParty: true,
};
const secondCardExpense: Transaction = {
  ...cardExpense, id: 'tx-card-2', amount: 75, description: 'Farmácia', ignored: false,
};

const mutation = selectFinancialNotificationCandidates({
  transactions: [base, cardExpense, secondCardExpense], cards,
  now: '2026-09-12T09:30:00', source: 'mutation',
  preferences: { pendingBills: true, cardInvoices: true, dueDaysAhead: 3, notifyTime: '09:00' },
});
assert.deepEqual(mutation, []);

const scheduled = selectFinancialNotificationCandidates({
  transactions: [base, cardExpense, secondCardExpense], cards,
  now: '2026-09-12T09:30:00', source: 'scheduler',
  preferences: { pendingBills: true, cardInvoices: true, dueDaysAhead: 3, notifyTime: '09:00' },
});
assert.equal(scheduled.filter(item => item.kind === 'pending_bill').length, 1);
assert.equal(scheduled.filter(item => item.kind === 'card_invoice').length, 1);
assert.equal(scheduled.find(item => item.kind === 'card_invoice')?.amount, 175);
assert.equal(scheduled.find(item => item.kind === 'pending_bill')?.key, 'pending_bill:tx-bill:2026-09-12:0');

const beforeTime = selectFinancialNotificationCandidates({
  transactions: [base], cards, now: '2026-09-12T08:59:00', source: 'scheduler',
  preferences: { pendingBills: true, cardInvoices: true, dueDaysAhead: 3, notifyTime: '09:00' },
});
assert.deepEqual(beforeTime, []);

const noOptIn = selectFinancialNotificationCandidates({
  transactions: [{ ...base, reminder: undefined }], cards,
  now: '2026-09-12T09:30:00', source: 'scheduler',
  preferences: { pendingBills: true, cardInvoices: false, dueDaysAhead: 3, notifyTime: '09:00' },
});
assert.deepEqual(noOptIn, []);

console.log('OK: notificações respeitam opt-in, vencimento, horário, fatura consolidada e origem do ciclo.');
