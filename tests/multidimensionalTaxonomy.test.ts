import assert from 'node:assert/strict';
import {
  inferSmartTaxonomy,
  FINANCIAL_NATURE_CONFIG,
  NECESSITY_CONFIG,
  SCOPE_CONFIG,
} from '../src/utils/smartTaxonomy';
import {
  getAnalyticalEntries,
  validateTransactionComponents,
} from '../src/utils/transactionAnalytics';
import { resolveCategory } from '../src/utils/categoryResolver';
import type { Transaction } from '../src/types';

console.log('🧪 Iniciando testes da Taxonomia Multidimensional (6D & Smart Defaults)...');

// 1. Inferência de Natureza Financeira
assert.equal(inferSmartTaxonomy({ description: 'IPTU Apto 402', type: 'expense' }).financialNature, 'tax');
assert.equal(inferSmartTaxonomy({ description: 'IPVA Honda Civic', type: 'expense' }).financialNature, 'tax');
assert.equal(inferSmartTaxonomy({ description: 'DARF Ações', type: 'expense' }).financialNature, 'tax');
assert.equal(inferSmartTaxonomy({ description: 'ITBI Prefeitura', type: 'expense' }).financialNature, 'tax');
assert.equal(inferSmartTaxonomy({ description: 'Seguro Auto Porto Seguro', type: 'expense' }).financialNature, 'insurance');
assert.equal(inferSmartTaxonomy({ description: 'Seguro Habitacional MIP/DFI Caixa', type: 'expense' }).financialNature, 'insurance');
assert.equal(inferSmartTaxonomy({ description: 'Amortização Extraordinária Caixa', type: 'expense' }).financialNature, 'amortization');
assert.equal(inferSmartTaxonomy({ description: 'Juros de Financiamento Habitacional', type: 'expense' }).financialNature, 'interest_paid');
assert.equal(inferSmartTaxonomy({ description: 'Tarifa Manutenção Conta', type: 'expense' }).financialNature, 'financial_fee');
assert.equal(inferSmartTaxonomy({ description: 'Multa por Atraso Boleto', type: 'expense' }).financialNature, 'penalty_fee');
assert.equal(inferSmartTaxonomy({ description: 'Reembolso Almoço Empresa', type: 'income' }).financialNature, 'reimbursement_inflow');
assert.equal(inferSmartTaxonomy({ description: 'Dividendos MXRF11', type: 'income' }).financialNature, 'investment_yield');
console.log('✅ 1. Inferência de Natureza Financeira aprovada!');

// 2. Inferência de Características Estruturadas
const netflix = inferSmartTaxonomy({ description: 'Netflix Premium', type: 'expense' });
assert.equal(netflix.characteristics.recurrence?.isSubscription, true);

const spotify = inferSmartTaxonomy({ description: 'Spotify Family', type: 'expense' });
assert.equal(spotify.characteristics.recurrence?.isSubscription, true);

const smartfit = inferSmartTaxonomy({ description: 'Smart Fit Mensalidade', type: 'expense' });
assert.equal(smartfit.characteristics.recurrence?.isSubscription, true);

const mercado = inferSmartTaxonomy({ description: 'Supermercado Pão de Açúcar', categoryId: 'cat-desp-alimentacao', subcategoryId: 'sub-alim-mercado', type: 'expense' });
assert.equal(mercado.characteristics.necessity, 'essential');

const aluguel = inferSmartTaxonomy({ description: 'Aluguel do Mês', categoryId: 'cat-desp-moradia', subcategoryId: 'sub-mor-aluguel', type: 'expense' });
assert.equal(aluguel.characteristics.necessity, 'essential');

const restaurante = inferSmartTaxonomy({ description: 'Jantar Restaurante Outback', categoryId: 'cat-desp-alimentacao', subcategoryId: 'sub-alim-restaurante', type: 'expense' });
assert.equal(restaurante.characteristics.necessity, 'discretionary');

const curso = inferSmartTaxonomy({ description: 'Curso de Especialização', categoryId: 'cat-desp-educacao', subcategoryId: 'sub-educ-cursos', type: 'expense' });
assert.equal(curso.characteristics.necessity, 'strategic');

const planoSaude = inferSmartTaxonomy({ description: 'Unimed Saúde Familiar', categoryId: 'cat-desp-saude', subcategoryId: 'sub-saude-plano', type: 'expense' });
assert.equal(planoSaude.characteristics.taxStatus, 'deductible');

const consulta = inferSmartTaxonomy({ description: 'Consulta Médica Pediatra', categoryId: 'cat-desp-saude', subcategoryId: 'sub-saude-consultas', type: 'expense' });
assert.equal(consulta.characteristics.taxStatus, 'deductible');
console.log('✅ 2. Características (Assinaturas, 50-30-20 e IR) aprovadas!');

// 3. Motor Analítico Ortogonal (Sem Dupla Contagem)
const splitTransaction: Transaction = {
  id: 'tx-condominio-1',
  description: 'Condomínio Residencial Vista Alegre',
  amount: 785.40,
  type: 'expense',
  date: '2026-09-14',
  categoryId: 'cat-desp-moradia',
  subcategoryId: 'sub-mor-condominio',
  financialNature: 'expense',
  characteristics: {
    necessity: 'essential',
    recurrence: { enabled: true, variability: 'fixed' },
  },
  hasComponents: true,
  status: 'completed',
  recurring: true,
  components: [
    {
      id: 'c1',
      transactionId: 'tx-condominio-1',
      description: 'Taxa Ordinária',
      amount: 450.00,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-condominio',
      financialNature: 'expense',
      characteristics: { necessity: 'essential' },
    },
    {
      id: 'c2',
      transactionId: 'tx-condominio-1',
      description: 'Consumo de Água',
      amount: 85.40,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-agua',
      financialNature: 'expense',
      characteristics: { necessity: 'essential' },
    },
    {
      id: 'c3',
      transactionId: 'tx-condominio-1',
      description: 'Taxa Extra Pintura',
      amount: 150.00,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-condominio',
      financialNature: 'expense',
      characteristics: { necessity: 'essential' },
    },
    {
      id: 'c4',
      transactionId: 'tx-condominio-1',
      description: 'Reserva Salão de Festas',
      amount: 100.00,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-condominio',
      financialNature: 'expense',
      characteristics: { necessity: 'discretionary' },
    },
  ],
};

const validation = validateTransactionComponents(splitTransaction.amount, splitTransaction.components!);
assert.equal(validation.isValid, true);
assert.equal(validation.distributedAmount, 785.40);

const entries = getAnalyticalEntries(splitTransaction);
assert.equal(entries.length, 4);
assert.equal(entries.every(e => e.isComponent), true);

const totalAnalitico = entries.reduce((s, e) => s + e.amount, 0);
assert.equal(Math.round(totalAnalitico * 100), 78540);

const salaoEntry = entries.find(e => e.description === 'Reserva Salão de Festas');
assert.equal(salaoEntry?.characteristics?.necessity, 'discretionary');

const taxaEntry = entries.find(e => e.description === 'Taxa Ordinária');
assert.equal(taxaEntry?.characteristics?.necessity, 'essential');
console.log('✅ 3. Motor Analítico Ortogonal (Componentes 6D) aprovado!');

// 4. Retrocompatibilidade de Categorias Descontaminadas
assert.equal(resolveCategory([], 'cat-desp-assinaturas').id, 'cat-desp-lazer');
assert.equal(resolveCategory([], 'cat-desp-seguros').id, 'cat-desp-transporte');
assert.equal(resolveCategory([], 'cat-desp-tarifas').id, 'cat-desp-financeiro');
assert.equal(resolveCategory([], 'cat-rec-reembolsos', undefined, 'income').id, 'cat-rec-beneficios-outras');
console.log('✅ 4. Retrocompatibilidade e Aliases aprovados!');

console.log('🎉 TODOS OS TESTES DA TAXONOMIA MULTIDIMENSIONAL 6D FORAM APROVADOS COM SUCESSO!');
