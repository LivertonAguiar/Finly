import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES } from '../src/utils/defaultCategories';
import { predictCategoryAndSubcategory } from '../src/utils/smartCategorizer';
import {
  createAssistantTransactionDraft,
  DraftConfirmationRegistry,
} from '../src/utils/assistantTransactionDraft';

const barbershopPrediction = predictCategoryAndSubcategory(
  'Corte na barbearia',
  'expense',
  DEFAULT_CATEGORIES,
);

assert.equal(barbershopPrediction?.categoryId, 'cat-desp-compras-pessoal');
assert.equal(barbershopPrediction?.subcategoryId, 'sub-comp-salao');

const barbershopWithBarHistory = predictCategoryAndSubcategory(
  'Corte na barbearia',
  'expense',
  DEFAULT_CATEGORIES,
  [{
    id: 'tx-bar',
    description: 'Bar',
    amount: 30,
    type: 'expense',
    date: '2026-09-01',
    categoryId: 'cat-desp-alimentacao',
    subcategoryId: 'sub-alim-restaurante',
    status: 'completed',
    recurring: false,
    tags: ['lazer'],
    createdAt: '2026-09-01T12:00:00.000Z',
  }],
);

assert.equal(barbershopWithBarHistory?.categoryId, 'cat-desp-compras-pessoal');
assert.equal(barbershopWithBarHistory?.subcategoryId, 'sub-comp-salao');

const supermarketDraft = createAssistantTransactionDraft({
  text: 'Gastei R$ 85 no supermercado',
  categories: DEFAULT_CATEGORIES,
  accountId: 'acc-main',
  today: '2026-09-30',
});

assert.ok(supermarketDraft);
assert.equal(supermarketDraft.transaction.amount, 85);
assert.equal(supermarketDraft.transaction.type, 'expense');
assert.equal(supermarketDraft.transaction.categoryId, 'cat-desp-alimentacao');
assert.equal(supermarketDraft.transaction.subcategoryId, 'sub-alim-mercado');
assert.equal(supermarketDraft.transaction.accountId, 'acc-main');
assert.equal(supermarketDraft.transaction.date, '2026-09-30');
assert.equal(supermarketDraft.requiresConfirmation, true);

const draftWithQuantity = createAssistantTransactionDraft({
  text: 'Comprei 2 itens no supermercado por R$ 85,90',
  categories: DEFAULT_CATEGORIES,
  accountId: 'acc-main',
  today: '2026-09-30',
});

assert.equal(draftWithQuantity?.transaction.amount, 85.9);

assert.equal(createAssistantTransactionDraft({
  text: 'Gastei R$ 85 no supermercado',
  categories: DEFAULT_CATEGORIES,
  today: '2026-09-30',
}), null);

let persistedTransactions = 0;
const confirmations = new DraftConfirmationRegistry();
assert.equal(persistedTransactions, 0);
assert.equal(confirmations.confirm(supermarketDraft, () => { persistedTransactions += 1; }), 'created');
assert.equal(confirmations.confirm(supermarketDraft, () => { persistedTransactions += 1; }), 'already-confirmed');
assert.equal(persistedTransactions, 1);
assert.equal(confirmations.isConfirmed(supermarketDraft.id), true);

console.log('OK: sugestões do assistente respeitam palavras completas e exigem confirmação.');
