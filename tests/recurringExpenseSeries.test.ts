import assert from 'node:assert/strict';
import {
  applyRecurringAmountChange,
  applyRecurringExpenseComponentsChange,
  discoverSeriesComponentTemplates,
  reconcileRecurringExpenseSeries,
} from '../src/utils/recurringExpenseSeries';
import type { RecurringExpenseSeries } from '../src/types';

const series: RecurringExpenseSeries = {
  id: 'series-energy',
  kind: 'recurring_expense',
  description: 'Energia elétrica',
  categoryId: 'cat-desp-moradia',
  subcategoryId: 'sub-mor-energia',
  accountId: 'acc-1',
  startDate: '2026-01-31',
  frequency: 'monthly',
  defaultAmount: 200,
  amountRules: [],
  tags: ['Casa'],
  ignored: false,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

const first = reconcileRecurringExpenseSeries({
  series,
  transactions: [],
  today: '2026-01-31',
  horizonMonths: 12,
  initialStatus: 'completed',
});

assert.equal(first.transactions.length, 12);
assert.equal(first.transactions[0].date, '2026-01-31');
assert.equal(first.transactions[0].status, 'completed');
assert.equal(first.transactions[1].date, '2026-02-28');
assert.equal(first.transactions[1].status, 'scheduled');
assert.equal(first.transactions.at(-1)?.date, '2026-12-31');

const second = reconcileRecurringExpenseSeries({
  series,
  transactions: first.transactions,
  today: '2026-01-31',
  horizonMonths: 12,
});
assert.equal(second.toCreate.length, 0);
assert.equal(second.transactions.length, 12);

const february = first.transactions[1];
const exception = applyRecurringAmountChange({
  series,
  transactions: first.transactions,
  selectedTransactionId: february.id,
  scope: 'single',
  amount: 260,
  overwriteExceptions: false,
});
assert.equal(exception.transactions.find(tx => tx.id === february.id)?.amount, 260);
assert.equal(exception.transactions.find(tx => tx.id === february.id)?.isSeriesException, true);

const futureRule = applyRecurringAmountChange({
  series: exception.series,
  transactions: exception.transactions,
  selectedTransactionId: first.transactions[0].id,
  scope: 'current_and_future',
  amount: 220,
  overwriteExceptions: false,
});
assert.equal(futureRule.transactions[0].amount, 220);
assert.equal(futureRule.transactions[1].amount, 260);
assert.equal(futureRule.transactions[2].amount, 220);

const ended = reconcileRecurringExpenseSeries({
  series: { ...series, endDate: '2026-03-31' },
  transactions: [],
  today: '2026-01-31',
  horizonMonths: 12,
});
assert.deepEqual(ended.transactions.map(tx => tx.date), ['2026-01-31', '2026-02-28', '2026-03-31']);

// Teste do caso do usuário: compra recorrente em cartão no passado recente com fatura de destino governando início
const cardSeries: RecurringExpenseSeries = {
  id: 'series-card-meli',
  kind: 'recurring_expense',
  description: 'Assinatura Meli+',
  categoryId: 'cat-assinaturas',
  cardId: 'card-inter',
  cardClosingDay: 26,
  cardDueDay: 5,
  paymentMethod: 'card',
  startDate: '2026-09-08',
  firstDueDate: '2026-10-05',
  firstInvoiceMonth: '2026-10',
  frequency: 'monthly',
  defaultAmount: 27.9,
  amountRules: [],
  tags: ['Assinaturas'],
  ignored: false,
  createdAt: '2026-09-14T12:00:00.000Z',
  updatedAt: '2026-09-14T12:00:00.000Z',
};

const cardReconciled = reconcileRecurringExpenseSeries({
  series: cardSeries,
  transactions: [],
  today: '2026-09-14',
  horizonMonths: 12,
  initialStatus: 'pending',
});

// A primeira ocorrência NÃO deve ser descartada mesmo startDate sendo anterior a today (08/09 < 14/09)
assert.equal(cardReconciled.transactions[0].date, '2026-09-08');
assert.equal(cardReconciled.transactions[0].invoiceMonth, '2026-10');
assert.equal(cardReconciled.transactions[0].seriesSequence, 1);
assert.equal(cardReconciled.transactions[0].status, 'pending');

// A segunda ocorrência deve ir para a fatura seguinte (Novembro/2026)
assert.equal(cardReconciled.transactions[1].date, '2026-10-08');
assert.equal(cardReconciled.transactions[1].invoiceMonth, '2026-11');
assert.equal(cardReconciled.transactions[1].seriesSequence, 2);

// A terceira ocorrência deve ir para a fatura de Dezembro/2026
assert.equal(cardReconciled.transactions[2].date, '2026-11-08');
assert.equal(cardReconciled.transactions[2].invoiceMonth, '2026-12');
assert.equal(cardReconciled.transactions[2].seriesSequence, 3);

console.log('OK: despesas fixas e compras recorrentes em cartão reconciliam horizonte, faturas de destino e datas passadas.');

// =============================================================================
// CASO DO USUÁRIO: Condomínio com taxa geral, água e taxa extra que expira
// =============================================================================

const userCondoSeries: RecurringExpenseSeries = {
  id: 'series-condominio-user',
  kind: 'recurring_expense',
  description: 'Taxa do Condomínio',
  categoryId: 'cat-desp-moradia',
  subcategoryId: 'sub-mor-condominio',
  accountId: 'acc-carteira',
  startDate: '2026-08-20',
  frequency: 'monthly',
  defaultAmount: 436.61,
  amountRules: [],
  tags: ['casa', 'condominio', 'taxa'],
  ignored: false,
  hasComponents: true,
  componentTemplates: [
    {
      description: 'Taxa Condominial',
      amount: 209.13,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-condominio',
      type: 'fixed',
    },
    {
      description: 'Água',
      amount: 150.00,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-agua',
      type: 'variable',
    },
    {
      description: 'Taxa Extra',
      amount: 77.48,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-extra',
      type: 'temporary',
      recurrenceConfig: {
        enabled: true,
        currentInstallment: 1,
        totalInstallments: 3, // Ocorrências 1 (Ago), 2 (Set), 3 (Out). No mês 4 (Nov) expira!
      },
    },
  ],
  createdAt: '2026-08-20T12:00:00.000Z',
  updatedAt: '2026-08-20T12:00:00.000Z',
};

// 1. Simulação: Ocorrências existentes geradas inicialmente com o valor cheio antigo de R$ 436,61
const existingNovTx = {
  id: 'tx-condo-nov-2026',
  description: 'Taxa do Condomínio',
  amount: 436.61, // Valor antigo antes da reconciliação!
  hasComponents: true,
  components: [
    {
      id: 'comp-nov-1',
      transactionId: 'tx-condo-nov-2026',
      description: 'Taxa Condominial',
      amount: 209.13,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-condominio',
      type: 'fixed' as const,
    },
  ],
  type: 'expense' as const,
  date: '2026-11-20',
  status: 'pending' as const,
  recurring: true,
  seriesId: userCondoSeries.id,
  seriesSequence: 4,
  occurrenceKey: 'recurring:2026-11-20',
  tags: ['casa', 'condominio', 'taxa'],
  createdAt: '2026-08-20T12:00:00.000Z',
};

const reconciledUserCase = reconcileRecurringExpenseSeries({
  series: userCondoSeries,
  transactions: [existingNovTx],
  today: '2026-11-01',
  horizonMonths: 6,
});

const updatedNovTx = reconciledUserCase.transactions.find(t => t.date === '2026-11-20');
assert.ok(updatedNovTx, 'Novembro deve existir');

// A taxa extra expirou (totalInstallments = 3, sequência = 4)!
// Devem estar presentes: Taxa Condominial (209.13) + Água (150.00) = 359.13
assert.equal(updatedNovTx.components?.some(c => c.description === 'Taxa Extra'), false);
assert.equal(updatedNovTx.components?.some(c => c.description === 'Taxa Condominial'), true);
assert.equal(updatedNovTx.components?.some(c => c.description === 'Água'), true);
// O valor NÃO DEVE continuar R$ 436,61, e sim a soma exata dos itens ativos!
assert.equal(updatedNovTx.amount, 359.13);
console.log('OK: Reconciliação atualiza amount para a soma dos componentes ativos quando taxas temporárias expiram!');

// 2. Teste de propagação de composição: applyRecurringExpenseComponentsChange
const updatedFromModal = applyRecurringExpenseComponentsChange({
  series: userCondoSeries,
  transactions: reconciledUserCase.transactions,
  selectedTransactionId: updatedNovTx.id,
  scope: 'current_and_future',
  components: [
    {
      description: 'Taxa Geral Condominial',
      amount: 215.00,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-condominio',
      type: 'fixed',
    },
    {
      description: 'Água e Esgoto',
      amount: 160.00,
      categoryId: 'cat-desp-moradia',
      subcategoryId: 'sub-mor-agua',
      type: 'variable',
    },
  ],
});

// A série deve atualizar os componentTemplates
assert.equal(updatedFromModal.series.componentTemplates?.length, 2);
assert.equal(updatedFromModal.series.componentTemplates?.[0].description, 'Taxa Geral Condominial');
assert.equal(updatedFromModal.series.componentTemplates?.[1].description, 'Água e Esgoto');

// Novembro e os meses seguintes (Dezembro, Janeiro) devem puxar a nova composição fixa/variável
const novAfter = updatedFromModal.transactions.find(t => t.date === '2026-11-20');
const decAfter = updatedFromModal.transactions.find(t => t.date === '2026-12-20');

assert.equal(novAfter?.amount, 375.00); // 215 + 160
assert.equal(novAfter?.components?.length, 2);
assert.equal(decAfter?.amount, 375.00); // 215 + 160
assert.equal(decAfter?.components?.length, 2);
assert.equal(decAfter?.components?.[0].description, 'Taxa Geral Condominial');
assert.equal(decAfter?.components?.[1].description, 'Água e Esgoto');

console.log('OK: applyRecurringExpenseComponentsChange propaga composição fixa e variável (taxa geral e água) para meses futuros!');

// 3. Teste de descoberta de templates a partir de ocorrências
const blankSeries: RecurringExpenseSeries = {
  ...userCondoSeries,
  componentTemplates: undefined,
  hasComponents: false,
};
const discovered = discoverSeriesComponentTemplates(blankSeries, [novAfter!]);
assert.ok(discovered, 'Deve descobrir templates');
assert.equal(discovered.length, 2);
assert.equal(discovered[0].description, 'Taxa Geral Condominial');
assert.equal(discovered[1].description, 'Água e Esgoto');

console.log('OK: discoverSeriesComponentTemplates descobre e consolida componentes de ocorrências passadas!');


