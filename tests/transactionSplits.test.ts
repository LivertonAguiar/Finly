import assert from 'node:assert/strict';
import {
  toCents,
  fromCents,
  validateTransactionComponents,
  getAnalyticalEntries,
  expandToAnalyticalEntries,
  hasActiveSplit,
} from '../src/utils/transactionAnalytics';
import type { Transaction } from '../src/types';

console.log('🧪 Iniciando testes de Detalhamento de Transações (Splits & Componentes)...');

// 1. Validação de precisão em centavos
assert.equal(toCents(785.40), 78540);
assert.equal(toCents(85.40), 8540);
assert.equal(toCents(0.1 + 0.2), 30);
assert.equal(fromCents(78540), 785.40);
console.log('✅ 1. Precisão de centavos aprovada sem desvios de ponto flutuante!');

// 2. Validação de soma de componentes
const components = [
  { amount: 450.00 },
  { amount: 85.40 },
  { amount: 150.00 },
  { amount: 100.00 },
];

const validationSuccess = validateTransactionComponents(785.40, components);
assert.equal(validationSuccess.isValid, true);
assert.equal(validationSuccess.difference, 0);
assert.equal(validationSuccess.distributedAmount, 785.40);

const validationUnder = validateTransactionComponents(785.40, components.slice(0, 3));
assert.equal(validationUnder.isValid, false);
assert.equal(validationUnder.difference, 100.00); // Faltam 100

const validationOver = validateTransactionComponents(785.40, [...components, { amount: 50 }]);
assert.equal(validationOver.isValid, false);
assert.equal(validationOver.difference, -50.00); // Excede 50
console.log('✅ 2. Validações de soma (exata, inferior e excedente) aprovadas!');

// 3. Teste Crítico Anti-Dupla Contabilização
const splitTx: Transaction = {
  id: 'tx-condominio-1',
  description: 'Condomínio Residencial',
  amount: 785.40,
  type: 'expense',
  date: '2026-09-10',
  categoryId: 'cat-desp-moradia',
  subcategoryId: 'sub-mor-condominio',
  accountId: 'acc-1',
  status: 'completed',
  recurring: true,
  tags: ['moradia'],
  hasComponents: true,
  components: [
    {
      id: 'comp-1',
      transactionId: 'tx-condominio-1',
      description: 'Taxa condominial ordinária',
      amount: 450.00,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-condominio',
      type: 'fixed',
    },
    {
      id: 'comp-2',
      transactionId: 'tx-condominio-1',
      description: 'Consumo de água',
      amount: 85.40,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-agua',
      type: 'variable',
    },
    {
      id: 'comp-3',
      transactionId: 'tx-condominio-1',
      description: 'Taxa extra pintura 3/10',
      amount: 150.00,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-taxa-extra',
      type: 'temporary',
      recurrenceConfig: { currentInstallment: 3, totalInstallments: 10 },
    },
    {
      id: 'comp-4',
      transactionId: 'tx-condominio-1',
      description: 'Reserva salão de festas / deck',
      amount: 100.00,
      categoryId: 'cat-desp-lazer',
      subcategoryId: 'sub-laz-eventos',
      type: 'one_time',
    },
  ],
  createdAt: '2026-09-10T12:00:00.000Z',
};

const entries = getAnalyticalEntries(splitTx);
assert.equal(entries.length, 4);
const totalAnalytical = entries.reduce((sum, e) => sum + e.amount, 0);
assert.equal(fromCents(toCents(totalAnalytical)), 785.40);
assert.notEqual(totalAnalytical, 785.40 * 2, 'PROIBIDO: Não pode duplicar a despesa pai!');
console.log('✅ 3. Teste crítico anti-dupla contabilização aprovado com sucesso!');

// 4. Teste de compatibilidade com transação sem componentes
const regularTx: Transaction = {
  id: 'tx-mercado-1',
  description: 'Supermercado Mensal',
  amount: 320.00,
  type: 'expense',
  date: '2026-09-11',
  categoryId: 'cat-desp-alimentacao',
  accountId: 'acc-1',
  status: 'completed',
  recurring: false,
  tags: [],
  hasComponents: false,
  createdAt: '2026-09-11T12:00:00.000Z',
};

const regularEntries = getAnalyticalEntries(regularTx);
assert.equal(regularEntries.length, 1);
assert.equal(regularEntries[0].amount, 320.00);
assert.equal(regularEntries[0].isComponent, false);
console.log('✅ 4. Transações convencionais sem componentes preservadas!');

// 5. Agregação analítica combinada (Lista com transações com e sem split)
const combinedList = [splitTx, regularTx];
const allEntries = expandToAnalyticalEntries(combinedList);
assert.equal(allEntries.length, 5); // 4 componentes do condomínio + 1 do mercado

const moradiaTotal = allEntries
  .filter(e => e.categoryId === 'cat-desp-moradia')
  .reduce((sum, e) => sum + e.amount, 0);
assert.equal(fromCents(toCents(moradiaTotal)), 685.40); // 450 + 85.40 + 150 = 685.40

const lazerTotal = allEntries
  .filter(e => e.categoryId === 'cat-desp-lazer')
  .reduce((sum, e) => sum + e.amount, 0);
assert.equal(lazerTotal, 100.00); // 100 do salão de festas

const alimentacaoTotal = allEntries
  .filter(e => e.categoryId === 'cat-desp-alimentacao')
  .reduce((sum, e) => sum + e.amount, 0);
assert.equal(alimentacaoTotal, 320.00);

const grandTotal = allEntries.reduce((sum, e) => sum + e.amount, 0);
assert.equal(fromCents(toCents(grandTotal)), 1105.40); // 785.40 + 320.00 = 1105.40
console.log('✅ 5. Agregação analítica combinada aprovada: Lazer (R$ 100), Moradia (R$ 685,40) e Alimentação (R$ 320)!');

// 6. Teste de Recorrência e Projeção de Componentes (reconcileRecurringExpenseSeries)
import { reconcileRecurringExpenseSeries } from '../src/utils/recurringExpenseSeries';
import type { RecurringExpenseSeries } from '../src/types';

const condoSeries: RecurringExpenseSeries = {
  id: 'series-condo',
  description: 'Condomínio Mensal',
  defaultAmount: 785.40,
  categoryId: 'cat-desp-moradia',
  subcategoryId: 'sub-mor-condominio',
  accountId: 'acc-1',
  frequency: 'monthly',
  startDate: '2026-09-10',
  dueDay: 10,
  amountRules: [],
  tags: ['moradia'],
  hasComponents: true,
  componentTemplates: [
    {
      id: 'tmpl-taxa',
      description: 'Taxa condominial',
      amount: 450.00,
      categoryId: 'cat-desp-moradia',
      type: 'fixed',
    },
    {
      id: 'tmpl-agua',
      description: 'Água',
      amount: 85.40,
      categoryId: 'cat-desp-moradia',
      type: 'variable',
    },
    {
      id: 'tmpl-extra',
      description: 'Taxa extra pintura',
      amount: 150.00,
      categoryId: 'cat-desp-moradia',
      type: 'temporary',
      recurrenceConfig: {
        enabled: true,
        currentInstallment: 3,
        totalInstallments: 4, // Terminará na ocorrência 2 (parcela 4/4)
      },
    },
    {
      id: 'tmpl-salao',
      description: 'Salão de festas',
      amount: 100.00,
      categoryId: 'cat-desp-lazer',
      type: 'one_time',
    },
  ],
  createdAt: '2026-09-10T12:00:00.000Z',
  updatedAt: '2026-09-10T12:00:00.000Z',
};

const reconcileOutput = reconcileRecurringExpenseSeries({
  series: condoSeries,
  transactions: [],
  today: '2026-09-10',
  horizonMonths: 3,
});

assert.ok(reconcileOutput.toCreate.length >= 3);

// Ocorrência 1 (Setembro): Todos os 4 itens presentes
const occ1 = reconcileOutput.toCreate[0];
assert.equal(occ1.hasComponents, true);
assert.equal(occ1.components?.length, 4);
assert.equal(occ1.amount, 785.40);
assert.equal(occ1.components?.find(c => c.type === 'temporary')?.recurrenceConfig?.currentInstallment, 3);

// Ocorrência 2 (Outubro): Salão omitido (one_time); Parcela incrementada para 4/4
const occ2 = reconcileOutput.toCreate[1];
assert.equal(occ2.hasComponents, true);
assert.equal(occ2.components?.length, 3);
assert.equal(occ2.components?.some(c => c.type === 'one_time'), false);
assert.equal(occ2.components?.find(c => c.type === 'temporary')?.recurrenceConfig?.currentInstallment, 4);
assert.equal(occ2.amount, 685.40); // 450 + 85.40 + 150 = 685.40

// Ocorrência 3 (Novembro): Parcela atingiu 5 > 4, expirou e foi omitida! Restam apenas Taxa + Água
const occ3 = reconcileOutput.toCreate[2];
assert.equal(occ3.hasComponents, true);
assert.equal(occ3.components?.length, 2);
assert.equal(occ3.components?.some(c => c.type === 'temporary'), false);
assert.equal(occ3.amount, 535.40); // 450 + 85.40 = 535.40
console.log('✅ 6. Teste de motor de recorrência aprovado: Fixos mantidos, Variáveis preservados, Temporários incrementam até expirar, e Eventuais não se replicam!');

console.log('🎉 TODOS OS TESTES DE DOMÍNIO, ANALYTICS E RECORRÊNCIA FORAM APROVADOS COM 100% DE SUCESSO!');
