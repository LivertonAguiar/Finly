import assert from 'node:assert/strict';
import {
  predictCategoryAndSubcategory,
  suggestDynamicTags,
  normalizeTag,
} from '../src/utils/smartCategorizer';
import { DEFAULT_CATEGORIES } from '../src/utils/defaultCategories';
import type { Transaction } from '../src/types';

// 1. Test normalizeTag (remoção de acentos e pontuações mantendo as letras base)
assert.equal(normalizeTag(' #Limpeza Casa '), 'limpeza-casa');
assert.equal(normalizeTag('MERCADO'), 'mercado');
assert.equal(normalizeTag('viagem 2026!'), 'viagem-2026');
assert.equal(normalizeTag('óculos'), 'oculos');
assert.equal(normalizeTag('Saúde!'), 'saude');
assert.equal(normalizeTag('Alimentação'), 'alimentacao');
assert.equal(normalizeTag('Habitação & Reforma'), 'habitacao-reforma');
assert.equal(normalizeTag('Médico e Dentista'), 'medico-e-dentista');
assert.equal(normalizeTag('#farmácia'), 'farmacia');
assert.equal(normalizeTag('👓 Óculos & Lentes'), 'oculos-lentes');

// 2. Test predictCategoryAndSubcategory with Built-in Dictionary
// A. Moradia -> Aluguel
const predAluguel = predictCategoryAndSubcategory('Aluguel Apto 102', 'expense', DEFAULT_CATEGORIES);
assert.ok(predAluguel, 'Deve prever aluguel');
assert.equal(predAluguel.categoryId, 'cat-desp-moradia');
assert.equal(predAluguel.subcategoryId, 'sub-mor-aluguel');
assert.ok(predAluguel.suggestedTags?.includes('aluguel'));

// B. Moradia -> Limpeza & Utilidades e Diarista
const predLimpeza = predictCategoryAndSubcategory('Produtos de limpeza para casa', 'expense', DEFAULT_CATEGORIES);
assert.ok(predLimpeza, 'Deve prever limpeza');
assert.equal(predLimpeza.categoryId, 'cat-desp-moradia');
assert.equal(predLimpeza.subcategoryId, 'sub-mor-limpeza-utilidades');
assert.ok(predLimpeza.suggestedTags?.includes('limpeza'));

const predDiarista = predictCategoryAndSubcategory('Diarista quinzenal', 'expense', DEFAULT_CATEGORIES);
assert.ok(predDiarista, 'Deve prever diarista');
assert.equal(predDiarista.categoryId, 'cat-desp-moradia');
assert.equal(predDiarista.subcategoryId, 'sub-mor-diarista');

// C. Transporte -> Uber
const predUber = predictCategoryAndSubcategory('Uber viagem trabalho', 'expense', DEFAULT_CATEGORIES);
assert.ok(predUber, 'Deve prever uber');
assert.equal(predUber.categoryId, 'cat-desp-transporte');
assert.equal(predUber.subcategoryId, 'sub-trans-uber');
assert.ok(predUber.suggestedTags?.includes('uber'));

// D. Alimentação -> Mercado
const predMercado = predictCategoryAndSubcategory('Supermercado Carrefour compra mês', 'expense', DEFAULT_CATEGORIES);
assert.ok(predMercado, 'Deve prever mercado');
assert.equal(predMercado.categoryId, 'cat-desp-alimentacao');
assert.equal(predMercado.subcategoryId, 'sub-alim-mercado');

// 3. Test predictCategoryAndSubcategory with User History
const mockHistory: Transaction[] = [
  {
    id: 'tx-1',
    description: 'Academia Mensalidade Smartfit',
    amount: 120,
    type: 'expense',
    date: '2026-09-01',
    categoryId: 'cat-desp-academia-esportes',
    subcategoryId: 'sub-acad-academia',
    status: 'completed',
    recurring: true,
    tags: ['saude', 'treino-pesado'],
  },
  {
    id: 'tx-2',
    description: 'Material Construção Reforma Quarto',
    amount: 500,
    type: 'expense',
    date: '2026-09-05',
    categoryId: 'cat-desp-moradia',
    subcategoryId: 'sub-mor-manutencao',
    status: 'completed',
    recurring: false,
    tags: ['obra-quarto', 'casa'],
  },
];

const predHistory = predictCategoryAndSubcategory(
  'Reforma Quarto pintura',
  'expense',
  DEFAULT_CATEGORIES,
  mockHistory
);
assert.ok(predHistory, 'Deve prever a partir do histórico');
assert.equal(predHistory.categoryId, 'cat-desp-moradia');
assert.equal(predHistory.subcategoryId, 'sub-mor-manutencao');
assert.equal(predHistory.source, 'history');
assert.ok(predHistory.suggestedTags?.includes('obra-quarto'));

// 4. Test suggestDynamicTags
// A. Suggests historical tags when description matches
const tagsFromDesc = suggestDynamicTags({
  description: 'Smartfit musculacao',
  categoryId: 'cat-desp-academia-esportes',
  subcategoryId: 'sub-acad-academia',
  historicalTransactions: mockHistory,
  currentTags: [],
});
assert.ok(tagsFromDesc.includes('treino-pesado'), 'Deve sugerir treino-pesado aprendido no histórico');

// B. Suggests contextual tags for Limpeza & Utilidades
const tagsLimpeza = suggestDynamicTags({
  description: 'Faxina geral',
  categoryId: 'cat-desp-moradia',
  subcategoryId: 'sub-mor-limpeza-utilidades',
  currentTags: [],
});
assert.ok(tagsLimpeza.includes('limpeza'), 'Deve sugerir limpeza');
assert.ok(tagsLimpeza.includes('casa'), 'Deve sugerir casa');

// C. Does NOT suggest tags that are already in currentTags
const tagsWithoutDup = suggestDynamicTags({
  description: 'Faxina geral',
  categoryId: 'cat-desp-moradia',
  subcategoryId: 'sub-mor-limpeza-utilidades',
  currentTags: ['limpeza'],
});
assert.ok(!tagsWithoutDup.includes('limpeza'), 'Não deve sugerir tag já adicionada');

// D. Third party tag when isThirdParty is true
const tagsThirdParty = suggestDynamicTags({
  description: 'Almoço amigo',
  isThirdParty: true,
  currentTags: [],
});
assert.ok(tagsThirdParty.includes('terceiros'), 'Deve sugerir terceiros');

// E. Farmácia e Streaming predictions
const predFarmacia = predictCategoryAndSubcategory('Droga Raia dipirona', 'expense', DEFAULT_CATEGORIES);
assert.ok(predFarmacia);
assert.equal(predFarmacia.categoryId, 'cat-desp-saude');
assert.equal(predFarmacia.subcategoryId, 'sub-saude-farmacia');

const predNetflix = predictCategoryAndSubcategory('Netflix assinatura mensal', 'expense', DEFAULT_CATEGORIES);
assert.ok(predNetflix);
assert.equal(predNetflix.categoryId, 'cat-desp-lazer');
assert.ok(predNetflix.suggestedTags?.includes('streaming'));

const predSalario = predictCategoryAndSubcategory('Salário Empresa XYZ', 'income', DEFAULT_CATEGORIES);
assert.ok(predSalario);
assert.equal(predSalario.categoryId, 'cat-rec-trabalho');
assert.equal(predSalario.subcategoryId, 'sub-rec-salario');

// G. Test category-specific tag suggestions
const tagsTransporte = suggestDynamicTags({
  categoryId: 'cat-desp-transporte',
  categories: DEFAULT_CATEGORIES,
  currentTags: [],
});
assert.ok(tagsTransporte.includes('combustivel') || tagsTransporte.includes('uber'), 'Deve sugerir tags de transporte');

const tagsSaude = suggestDynamicTags({
  categoryId: 'cat-desp-saude',
  categories: DEFAULT_CATEGORIES,
  currentTags: [],
});
assert.ok(tagsSaude.includes('farmacia') || tagsSaude.includes('medicamentos'), 'Deve sugerir tags de saúde');

// H. Test dynamic token extraction from free-form typed description
const tagsDescLivre = suggestDynamicTags({
  description: 'Comemoração de aniversário da Ana',
  currentTags: [],
});
assert.ok(tagsDescLivre.includes('aniversario'), 'Deve sugerir aniversário extraído diretamente da descrição');

// I. Test custom tags registered in Cadastros
const tagsCustom = suggestDynamicTags({
  description: 'Passeio na praia',
  customTags: ['praia-ferias', 'reforma-quarto'],
  currentTags: [],
});
assert.ok(tagsCustom.includes('praia-ferias'), 'Deve priorizar tags customizadas correspondentes');

// J. Test Gás de Cozinha prediction
const predGas = predictCategoryAndSubcategory('Botijão de gás Ultragaz 13kg', 'expense', DEFAULT_CATEGORIES);
assert.ok(predGas, 'Deve prever gás');
assert.equal(predGas.categoryId, 'cat-desp-moradia');
assert.equal(predGas.subcategoryId, 'sub-mor-gas');
assert.ok(predGas.suggestedTags?.includes('gas'), 'Deve sugerir tag gas');

const predGasEncanado = predictCategoryAndSubcategory('Comgás conta mensal gás encanado', 'expense', DEFAULT_CATEGORIES);
assert.ok(predGasEncanado, 'Deve prever Comgás');
assert.equal(predGasEncanado.categoryId, 'cat-desp-moradia');
assert.equal(predGasEncanado.subcategoryId, 'sub-mor-gas');

// K. Test tag suggestions derived from Split Items (Composição do Lançamento)
const tagsFromSplit = suggestDynamicTags({
  description: 'Boleto Condomínio Edifício Solar',
  categoryId: 'cat-desp-moradia',
  subcategoryId: 'sub-mor-condominio',
  categories: DEFAULT_CATEGORIES,
  splitItems: [
    { description: 'Taxa Condominial Ordinária', categoryId: 'cat-desp-moradia', subcategoryId: 'sub-mor-condominio' },
    { description: 'Consumo de Água / Esgoto', categoryId: 'cat-desp-moradia', subcategoryId: 'sub-mor-agua' },
    { description: 'Recarga Gás de Cozinha Botijão', categoryId: 'cat-desp-moradia', subcategoryId: 'sub-mor-gas' },
  ],
  currentTags: [],
});
assert.ok(tagsFromSplit.includes('gas'), 'Deve sugerir tag gas a partir dos itens da composição');
assert.ok(tagsFromSplit.includes('agua'), 'Deve sugerir tag agua a partir dos itens da composição');
assert.ok(tagsFromSplit.includes('condominio'), 'Deve sugerir tag condominio');

console.log('✅ smartTagAndSubcategoryPrediction.test.ts: Todos os testes passaram com 100% de sucesso!');

