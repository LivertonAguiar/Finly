import assert from 'node:assert/strict';
import { buildTransferTransaction, getTransferBalanceDeltas } from '../src/utils/transferRules';

const scheduled = buildTransferTransaction({
  id: 'transfer-1', amount: 500, sourceAccountId: 'acc-a', targetAccountId: 'acc-b',
  date: '2026-09-13', today: '2026-09-12', description: '', tags: [],
  createdAt: '2026-09-12T12:00:00.000Z', sourceBalance: 200,
});
assert.equal(scheduled.transaction.status, 'scheduled');
assert.equal(scheduled.insufficientBalanceWarning, true);
assert.deepEqual(getTransferBalanceDeltas(scheduled.transaction), {});

const completed = buildTransferTransaction({
  id: 'transfer-2', amount: 100, sourceAccountId: 'acc-a', targetAccountId: 'acc-b',
  date: '2026-09-12', today: '2026-09-12', description: 'Reserva', tags: ['Casa'],
  createdAt: '2026-09-12T12:00:00.000Z', sourceBalance: 200,
});
assert.equal(completed.transaction.status, 'completed');
assert.deepEqual(getTransferBalanceDeltas(completed.transaction), { 'acc-a': -100, 'acc-b': 100 });

assert.throws(() => buildTransferTransaction({
  id: 'bad', amount: 1, sourceAccountId: 'acc-a', targetAccountId: 'acc-a',
  date: '2026-09-12', today: '2026-09-12', tags: [], createdAt: '2026-09-12T12:00:00.000Z',
}), /diferentes/);

console.log('OK: transferência única agenda futuro, movimenta dois lados e apenas alerta saldo insuficiente.');
