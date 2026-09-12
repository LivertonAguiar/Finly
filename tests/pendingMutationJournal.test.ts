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

console.log('pendingMutationJournal.test.ts: OK');
