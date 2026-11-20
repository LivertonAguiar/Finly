import assert from 'node:assert/strict';
import {
  selectFinancialNotificationCandidates,
  computeFutureNotificationSchedule,
  diffSystemNotifications,
  stableNotificationId,
  DEFAULT_NOTIFICATION_PREFS,
} from '../src/utils/notificationEngine';
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

// --- Testes de Agendamento Futuro no Sistema Nativo (AlarmManager / App Fechado) ---

// 1. Validação de IDs Estáveis (31-bit positivo determinístico)
const id1 = stableNotificationId('sys_bill:tx-100:due_day:2026-11-15');
const id2 = stableNotificationId('sys_bill:tx-100:due_day:2026-11-15');
const id3 = stableNotificationId('sys_bill:tx-200:due_day:2026-11-15');
assert.equal(id1, id2, 'O mesmo ID deve ser determinístico');
assert.notEqual(id1, id3, 'Chaves distintas devem gerar IDs distintos');
assert.ok(id1 > 0 && id1 <= 2147483647, 'O ID deve caber em um inteiro de 31 bits do Android');

// 2. Agendamento de conta pendente futura
const futureBill: Transaction = {
  id: 'tx-future-1',
  description: 'Internet Fibra',
  amount: 150,
  type: 'expense',
  date: '2026-11-01',
  dueDate: '2026-11-15',
  status: 'pending',
  recurring: false,
  tags: [],
  reminder: { enabled: true, daysBefore: 2, reminderTime: '08:30' },
  createdAt: '2026-11-01T10:00:00.000Z',
};

const futureCardExpense: Transaction = {
  id: 'tx-card-nov',
  description: 'Combustível',
  amount: 220,
  type: 'expense',
  date: '2026-11-02',
  dueDate: '2026-11-10',
  cardId: 'card-1',
  invoiceMonth: '2026-11',
  status: 'pending',
  recurring: false,
  tags: [],
  createdAt: '2026-11-02T10:00:00.000Z',
};

const simulatedNow = new Date(2026, 10, 1, 7, 0, 0); // 01/Nov/2026 07:00 local

const systemSchedule = computeFutureNotificationSchedule({
  transactions: [futureBill, futureCardExpense],
  cards,
  preferences: { ...DEFAULT_NOTIFICATION_PREFS, notifyTime: '09:00', dueDaysAhead: 3 },
  now: simulatedNow,
});

// Deve conter:
// - futureBill no dia do vencimento (15/11 às 08:30)
// - futureBill antecipado (13/11 às 08:30)
// - Fatura do card-1 no dia do vencimento (10/11 às 09:00)
// - Fatura do card-1 antecipada 3 dias (07/11 às 09:00)
assert.ok(systemSchedule.length >= 4, `Esperado pelo menos 4 alarmes futuros, obtido: ${systemSchedule.length}`);

const billDue = systemSchedule.find(s => s.key === 'sys_bill:tx-future-1:due_day:2026-11-15');
assert.ok(billDue, 'Alarme do dia de vencimento da conta deve existir');
assert.equal(billDue?.scheduledAt.getDate(), 15);
assert.equal(billDue?.scheduledAt.getHours(), 8);
assert.equal(billDue?.scheduledAt.getMinutes(), 30);

const billAhead = systemSchedule.find(s => s.key === 'sys_bill:tx-future-1:ahead_2:2026-11-15');
assert.ok(billAhead, 'Alarme antecipado de 2 dias deve existir');
assert.equal(billAhead?.scheduledAt.getDate(), 13);
assert.equal(billAhead?.scheduledAt.getHours(), 8);
assert.equal(billAhead?.scheduledAt.getMinutes(), 30);

// 3. Contas já pagas (status = 'completed') NÃO devem gerar agendamento
const paidBill: Transaction = {
  ...futureBill,
  id: 'tx-paid-1',
  status: 'completed',
};

const paidSchedule = computeFutureNotificationSchedule({
  transactions: [paidBill],
  cards: [],
  preferences: DEFAULT_NOTIFICATION_PREFS,
  now: simulatedNow,
});
assert.equal(paidSchedule.length, 0, 'Conta paga não deve gerar alarme futuro');

// 4. Contas com data no passado NÃO devem gerar agendamento
const pastBill: Transaction = {
  ...futureBill,
  id: 'tx-past-1',
  dueDate: '2026-10-20',
};

const pastSchedule = computeFutureNotificationSchedule({
  transactions: [pastBill],
  cards: [],
  preferences: DEFAULT_NOTIFICATION_PREFS,
  now: simulatedNow,
});
assert.equal(pastSchedule.length, 0, 'Conta no passado não deve gerar alarme futuro');

// 5. Teste de Deteccao de Alteracao de Valor / Conteudo em Notificacoes Pendentes
const testNotifId = stableNotificationId('sys_bill:tx-series-1:due_day:2026-11-20');
const targetDueAt = new Date(2026, 10, 20, 9, 0, 0);

// Cenário A: Alarme no Android com valor antigo (R$ 277,41) e o usuário editou para R$ 332,41
const pendingWithOldAmount = [
  {
    id: testNotifId,
    title: '⏰ Conta a Pagar Vence Hoje',
    body: 'A conta "Taxa do Condomínio" (R$ 277,41) vence hoje!',
    schedule: { at: targetDueAt },
  },
];

const targetWithNewAmount = [
  {
    id: testNotifId,
    key: 'sys_bill:tx-series-1:due_day:2026-11-20',
    title: '⏰ Conta a Pagar Vence Hoje',
    body: 'A conta "Taxa do Condomínio" (R$ 332,41) vence hoje!',
    scheduledAt: targetDueAt,
    kind: 'pending_bill' as const,
    entityId: 'tx-series-1',
    amount: 332.41,
    dueDate: '2026-11-20',
  },
];

const diffModified = diffSystemNotifications(pendingWithOldAmount, targetWithNewAmount);
assert.equal(diffModified.toCancelIds.length, 1, 'Deve cancelar o alarme antigo com valor defasado');
assert.equal(diffModified.toCancelIds[0], testNotifId, 'ID cancelado deve coincidir');
assert.equal(diffModified.toSchedule.length, 1, 'Deve reagendar o alarme com o novo valor');
assert.equal(diffModified.toSchedule[0].body, 'A conta "Taxa do Condomínio" (R$ 332,41) vence hoje!');

// Cenário B: Alarme no Android idêntico ao planejado (não deve reagendar nem cancelar nada)
const diffUnchanged = diffSystemNotifications(
  [
    {
      id: testNotifId,
      title: '⏰ Conta a Pagar Vence Hoje',
      body: 'A conta "Taxa do Condomínio" (R$ 332,41) vence hoje!',
      schedule: { at: targetDueAt },
    },
  ],
  targetWithNewAmount
);
assert.equal(diffUnchanged.toCancelIds.length, 0, 'Alarme idêntico não deve ser cancelado');
assert.equal(diffUnchanged.toSchedule.length, 0, 'Alarme idêntico não deve ser reagendado');

// Cenário C: Alarme obsoleto (conta paga ou excluída)
const diffStale = diffSystemNotifications(pendingWithOldAmount, []);
assert.equal(diffStale.toCancelIds.length, 1, 'Conta excluída/paga deve ter alarme cancelado');
assert.equal(diffStale.toSchedule.length, 0, 'Nenhum novo agendamento necessário');

console.log('OK: notificações respeitam opt-in, vencimento, horário, fatura consolidada e origem do ciclo.');
console.log('OK: agendamentos futuros para app fechado (AlarmManager) validados com sucesso.');
console.log('OK: diff de notificações nativas detecta alteração de valor e atualiza alarmes.');
