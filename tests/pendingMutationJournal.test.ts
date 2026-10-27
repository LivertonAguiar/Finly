import assert from 'node:assert/strict';
import {
  createEmptyMutationJournal,
  enqueueMutationDelete,
  enqueueMutationUpsert,
  reconcilePendingMutations,
} from '../src/utils/pendingMutationJournal';

interface Item { id: string; value: string }
const equals = (left: Item, right: Item) => left.id === right.id && left.value === right.value;

const newItem = { id: 'new', value: 'local' };
let journal = enqueueMutationUpsert(createEmptyMutationJournal<Item>(), newItem);
let result = reconcilePendingMutations({ remoteItems: [], journal, equals });
assert.deepEqual(result.items, [newItem], 'um GET atrasado não pode apagar um POST ainda não refletido');
assert.deepEqual(result.retryUpserts, [newItem]);
assert.equal(Object.keys(result.journal.upserts).length, 1);

result = reconcilePendingMutations({ remoteItems: [newItem], journal: result.journal, equals });
assert.deepEqual(result.retryUpserts, []);
assert.equal(Object.keys(result.journal.upserts).length, 0, 'o POST confirmado deve sair do diário');

const deletedItem = { id: 'old', value: 'remote' };
journal = enqueueMutationDelete(createEmptyMutationJournal<Item>(), deletedItem.id);
result = reconcilePendingMutations({ remoteItems: [deletedItem], journal, equals });
assert.deepEqual(result.items, [], 'um GET atrasado não pode ressuscitar uma exclusão');
assert.deepEqual(result.retryDeletes, [deletedItem.id]);

result = reconcilePendingMutations({ remoteItems: [], journal: result.journal, equals });
assert.deepEqual(result.retryDeletes, []);
assert.deepEqual(result.journal.deletes, [], 'a exclusão confirmada deve sair do diário');

// Cenário Real: Despesa marcada como paga ('completed') não é revertida por snapshot atrasado
interface TestTx { id: string; status: 'completed' | 'pending'; amount: number; accountId: string }
const txEquals = (a: TestTx, b: TestTx) => a.id === b.id && a.status === b.status && a.amount === b.amount;

const txLocalUpdated: TestTx = { id: 'tx-1', status: 'completed', amount: 150, accountId: 'acc-1' };
const txRemoteStale: TestTx = { id: 'tx-1', status: 'pending', amount: 150, accountId: 'acc-1' };

let txJournal = enqueueMutationUpsert(createEmptyMutationJournal<TestTx>(), txLocalUpdated);
let txReconciled = reconcilePendingMutations({
  remoteItems: [txRemoteStale],
  journal: txJournal,
  equals: txEquals,
});

assert.equal(txReconciled.items[0].status, 'completed', 'Despesa paga não pode voltar para pendente quando o snapshot remoto estiver atrasado');
assert.equal(txReconciled.retryUpserts.length, 1, 'Deve reenviar a transação atualizada');

// Teste de cálculo derivado de saldos de conta
const dummyAccounts = [
  { id: 'acc-1', name: 'Conta Principal', type: 'checking', balance: 0, initialBalance: 1000, institution: 'Banco', color: '#000', includeInTotal: true },
];
const dummyTransactions = [
  { id: 't1', description: 'Salário', amount: 2000, type: 'income' as const, date: '2026-10-01', categoryId: 'c1', accountId: 'acc-1', status: 'completed' as const, createdAt: '' },
  { id: 't2', description: 'Mercado', amount: 500, type: 'expense' as const, date: '2026-10-05', categoryId: 'c2', accountId: 'acc-1', status: 'completed' as const, createdAt: '' },
  { id: 't3', description: 'Pendente', amount: 300, type: 'expense' as const, date: '2026-10-10', categoryId: 'c2', accountId: 'acc-1', status: 'pending' as const, createdAt: '' },
];

const { calculateDerivedAccountBalances } = await import('../src/utils/derivedAccountBalances');
const derived = calculateDerivedAccountBalances(dummyAccounts as any, dummyTransactions as any);
assert.equal(derived[0].balance, 2500, 'Saldo derivado deve ser 1000 + 2000 - 500 = 2500 (despesa pendente não desconta)');

console.log('pendingMutationJournal.test.ts: OK (todos os testes de resiliência e saldos aprovados)');

