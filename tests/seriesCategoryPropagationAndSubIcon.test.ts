import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES } from '../src/utils/defaultCategories';
import { resolveCategory } from '../src/utils/categoryResolver';
import { propagateCategoryChange } from '../src/utils/seriesCategorySync';
import type { Transaction, CardInstallmentSeries, RecurringExpenseSeries } from '../src/types';

console.log('🧪 Iniciando testes de propagação de categorias e emoji de subcategorias...');

// ============================================================================
// 1. TESTE DE EMOJI DA SUBCATEGORIA NAS DESPESAS
// ============================================================================
{
  // Com subcategoria Limpeza & Utilidades -> Deve exibir o emoji da subcategoria 🧹
  const resolvedWithSub = resolveCategory(DEFAULT_CATEGORIES, 'cat-desp-moradia', 'sub-mor-limpeza-utilidades', 'expense');
  assert.equal(resolvedWithSub.id, 'cat-desp-moradia');
  assert.equal(resolvedWithSub.name, 'Moradia');
  assert.equal(resolvedWithSub.subId, 'sub-mor-limpeza-utilidades');
  assert.equal(resolvedWithSub.subIcon, '🧹');
  assert.equal(resolvedWithSub.icon, '🧹', 'O ícone principal da despesa deve ser o emoji da subcategoria 🧹');

  // Sem subcategoria -> Deve exibir o emoji da categoria Moradia 🏠
  const resolvedWithoutSub = resolveCategory(DEFAULT_CATEGORIES, 'cat-desp-moradia', undefined, 'expense');
  assert.equal(resolvedWithoutSub.icon, '🏠', 'Sem subcategoria, o ícone principal deve ser o emoji da categoria Moradia 🏠');

  // Com subcategoria Mercado em Alimentação -> Deve exibir 🛒
  const resolvedMercado = resolveCategory(DEFAULT_CATEGORIES, 'cat-desp-alimentacao', 'sub-alim-mercado', 'expense');
  assert.equal(resolvedMercado.icon, '🛒', 'Despesa com subcategoria Mercado deve exibir emoji 🛒');

  // Com subcategoria Farmácia em Saúde -> Deve exibir 💊 ou 🩺
  const resolvedFarmacia = resolveCategory(DEFAULT_CATEGORIES, 'cat-desp-saude', 'sub-saude-farmacia', 'expense');
  assert.ok(resolvedFarmacia.icon, 'Deve ter ícone resolvido');
  assert.equal(resolvedFarmacia.subId, 'sub-saude-farmacia');

  // Com subcategoria Óculos & Lentes em Saúde -> Deve exibir 👓
  const resolvedOculos = resolveCategory(DEFAULT_CATEGORIES, 'cat-desp-saude', 'sub-saude-oculos-lentes', 'expense');
  assert.equal(resolvedOculos.icon, '👓', 'Subcategoria Óculos & Lentes deve ter emoji 👓');
  assert.equal(resolvedOculos.subName, 'Óculos & Lentes');
  assert.equal(resolvedOculos.subId, 'sub-saude-oculos-lentes');

  console.log('✅ 1. Resolução prioritária do emoji de subcategoria aprovada com sucesso!');
}

// ============================================================================
// 2. TESTE DE PROPAGAÇÃO EM COMPRA PARCELADA DE CARTÃO (card_installment)
// ============================================================================
{
  const seriesId = 'series-card-geladeira';
  const series: CardInstallmentSeries = {
    id: seriesId,
    kind: 'card_installment',
    description: 'Geladeira Frost Free',
    categoryId: 'cat-desp-outros',
    cardId: 'card-nubank',
    purchaseDate: '2026-09-01',
    firstInvoiceMonth: '2026-09',
    totalAmount: 2400,
    totalInstallments: 3,
    firstTrackedInstallment: 1,
    amountInputMode: 'total',
    startDate: '2026-09-01',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };

  const tx1: Transaction = {
    id: 'tx-geladeira-1',
    description: 'Geladeira Frost Free (1/3)',
    amount: 800,
    type: 'expense',
    date: '2026-09-01',
    categoryId: 'cat-desp-outros',
    cardId: 'card-nubank',
    status: 'completed',
    recurring: false,
    seriesId,
    seriesSequence: 1,
    installments: { current: 1, total: 3, parentId: seriesId },
    tags: ['eletrodomésticos'],
    createdAt: '2026-09-01T10:00:00.000Z',
  };

  const tx2: Transaction = {
    id: 'tx-geladeira-2',
    description: 'Geladeira Frost Free (2/3)',
    amount: 800,
    type: 'expense',
    date: '2026-10-01',
    categoryId: 'cat-desp-outros',
    cardId: 'card-nubank',
    status: 'pending',
    recurring: false,
    seriesId,
    seriesSequence: 2,
    installments: { current: 2, total: 3, parentId: seriesId },
    tags: ['eletrodomésticos'],
    createdAt: '2026-09-01T10:00:00.000Z',
  };

  const tx3: Transaction = {
    id: 'tx-geladeira-3',
    description: 'Geladeira Frost Free (3/3)',
    amount: 800,
    type: 'expense',
    date: '2026-11-01',
    categoryId: 'cat-desp-outros',
    cardId: 'card-nubank',
    status: 'pending',
    recurring: false,
    seriesId,
    seriesSequence: 3,
    installments: { current: 3, total: 3, parentId: seriesId },
    tags: ['eletrodomésticos'],
    createdAt: '2026-09-01T10:00:00.000Z',
  };

  const independentTx: Transaction = {
    id: 'tx-almoco-avulso',
    description: 'Almoço Restaurante',
    amount: 45,
    type: 'expense',
    date: '2026-09-02',
    categoryId: 'cat-desp-alimentacao',
    status: 'completed',
    recurring: false,
    tags: [],
    createdAt: '2026-09-02T12:00:00.000Z',
  };

  const transactions = [tx1, tx2, tx3, independentTx];
  const transactionSeries = [series];

  // Simula o usuário editando a parcela 2 para Moradia -> Limpeza & Utilidades
  const result = propagateCategoryChange({
    transactions,
    transactionSeries,
    targetTransactionId: 'tx-geladeira-2',
    newCategoryId: 'cat-desp-moradia',
    newSubcategoryId: 'sub-mor-limpeza-utilidades',
  });

  // Todas as 3 parcelas devem ter a nova categoria e subcategoria
  const updatedTx1 = result.transactions.find(t => t.id === 'tx-geladeira-1');
  const updatedTx2 = result.transactions.find(t => t.id === 'tx-geladeira-2');
  const updatedTx3 = result.transactions.find(t => t.id === 'tx-geladeira-3');
  const updatedIndependent = result.transactions.find(t => t.id === 'tx-almoco-avulso');

  assert.equal(updatedTx1?.categoryId, 'cat-desp-moradia');
  assert.equal(updatedTx1?.subcategoryId, 'sub-mor-limpeza-utilidades');
  assert.equal(updatedTx2?.categoryId, 'cat-desp-moradia');
  assert.equal(updatedTx2?.subcategoryId, 'sub-mor-limpeza-utilidades');
  assert.equal(updatedTx3?.categoryId, 'cat-desp-moradia');
  assert.equal(updatedTx3?.subcategoryId, 'sub-mor-limpeza-utilidades');

  // A transação independente não pode ter sido alterada
  assert.equal(updatedIndependent?.categoryId, 'cat-desp-alimentacao');
  assert.equal(updatedIndependent?.subcategoryId, undefined);

  // A série em transactionSeries também deve ser atualizada
  const updatedSeries = result.transactionSeries.find(s => s.id === seriesId);
  assert.equal(updatedSeries?.categoryId, 'cat-desp-moradia');
  assert.equal(updatedSeries?.subcategoryId, 'sub-mor-limpeza-utilidades');

  // Identificação de afetados
  assert.deepEqual(result.affectedTransactionIds.sort(), ['tx-geladeira-1', 'tx-geladeira-3'].sort());
  assert.deepEqual(result.affectedSeriesIds, [seriesId]);

  console.log('✅ 2. Propagação em compra parcelada de cartão aprovada com sucesso!');
}

// ============================================================================
// 3. TESTE DE PROPAGAÇÃO EM DESPESA FIXA / RECORRENTE (recurring_expense)
// ============================================================================
{
  const seriesId = 'series-rec-internet';
  const series: RecurringExpenseSeries = {
    id: seriesId,
    kind: 'recurring_expense',
    description: 'Internet Fibra Óptica',
    categoryId: 'cat-desp-outros',
    frequency: 'monthly',
    defaultAmount: 120,
    tags: ['contas'],
    ignored: false,
    amountRules: [],
    startDate: '2026-01-10',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  };

  const rec1: Transaction = {
    id: 'tx-rec-1',
    description: 'Internet Fibra Óptica',
    amount: 120,
    type: 'expense',
    date: '2026-08-10',
    categoryId: 'cat-desp-outros',
    status: 'completed',
    recurring: true,
    seriesId,
    tags: ['contas'],
    createdAt: '2026-08-10T10:00:00.000Z',
  };

  const rec2: Transaction = {
    id: 'tx-rec-2',
    description: 'Internet Fibra Óptica',
    amount: 120,
    type: 'expense',
    date: '2026-09-10',
    categoryId: 'cat-desp-outros',
    status: 'pending',
    recurring: true,
    seriesId,
    tags: ['contas'],
    createdAt: '2026-09-10T10:00:00.000Z',
  };

  const rec3: Transaction = {
    id: 'tx-rec-3',
    description: 'Internet Fibra Óptica',
    amount: 120,
    type: 'expense',
    date: '2026-10-10',
    categoryId: 'cat-desp-outros',
    status: 'pending',
    recurring: true,
    seriesId,
    tags: ['contas'],
    createdAt: '2026-10-10T10:00:00.000Z',
  };

  const transactions = [rec1, rec2, rec3];
  const transactionSeries = [series];

  // Usuário altera a categoria da recorrência em setembro para Moradia
  const result = propagateCategoryChange({
    transactions,
    transactionSeries,
    targetTransactionId: 'tx-rec-2',
    newCategoryId: 'cat-desp-moradia',
    newSubcategoryId: 'sub-mor-limpeza-utilidades',
  });

  for (const tx of result.transactions) {
    assert.equal(tx.categoryId, 'cat-desp-moradia');
    assert.equal(tx.subcategoryId, 'sub-mor-limpeza-utilidades');
  }

  const updatedSeries = result.transactionSeries.find(s => s.id === seriesId);
  assert.equal(updatedSeries?.categoryId, 'cat-desp-moradia');
  assert.equal(updatedSeries?.subcategoryId, 'sub-mor-limpeza-utilidades');

  console.log('✅ 3. Propagação em despesas fixas aprovada com sucesso!');
}

// ============================================================================
// 4. TESTE DE PROPAGAÇÃO EM PARCELAS DE DÍVIDAS / FINANCIAMENTOS (debtId)
// ============================================================================
{
  const debtId = 'debt-financiamento-veiculo';

  const debtTx1: Transaction = {
    id: 'tx-debt-1',
    description: 'Parcela Veículo 1/2',
    amount: 950,
    type: 'expense',
    date: '2026-09-15',
    categoryId: 'cat-desp-outros',
    status: 'completed',
    recurring: false,
    debtId,
    debtInstallmentNumber: 1,
    tags: ['carro'],
    createdAt: '2026-09-01T10:00:00.000Z',
  };

  const debtTx2: Transaction = {
    id: 'tx-debt-2',
    description: 'Parcela Veículo 2/2',
    amount: 950,
    type: 'expense',
    date: '2026-10-15',
    categoryId: 'cat-desp-outros',
    status: 'pending',
    recurring: false,
    debtId,
    debtInstallmentNumber: 2,
    tags: ['carro'],
    createdAt: '2026-09-01T10:00:00.000Z',
  };

  const result = propagateCategoryChange({
    transactions: [debtTx1, debtTx2],
    transactionSeries: [],
    targetTransactionId: 'tx-debt-1',
    newCategoryId: 'cat-desp-transporte',
    newSubcategoryId: 'sub-trans-veiculo',
  });

  const updated1 = result.transactions.find(t => t.id === 'tx-debt-1');
  const updated2 = result.transactions.find(t => t.id === 'tx-debt-2');

  assert.equal(updated1?.categoryId, 'cat-desp-transporte');
  assert.equal(updated1?.subcategoryId, 'sub-trans-veiculo');
  assert.equal(updated2?.categoryId, 'cat-desp-transporte');
  assert.equal(updated2?.subcategoryId, 'sub-trans-veiculo');

  console.log('✅ 4. Propagação em parcelas de dívida/financiamento aprovada com sucesso!');
}

console.log('🎉 TODOS OS TESTES DE PROPAGAÇÃO E EMOJIS FORAM APROVADOS COM 100% DE SUCESSO!');
