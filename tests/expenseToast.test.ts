import assert from 'node:assert/strict';
import {
  formatExpenseConfirmationSummary,
  emitExpenseAddedConfirmation,
  ExpenseAddedToastData,
} from '../src/utils/expenseToastEmitter';

console.log('🧪 Iniciando testes de formatação e emissão do pop-up de despesa adicionada...');

// 1. Teste de despesa simples à vista
{
  const data: ExpenseAddedToastData = {
    description: 'Mercado Semanal',
    amount: 145.5,
    currency: 'BRL',
    categoryIcon: '🛒',
    categoryName: 'Alimentação',
    subcategoryName: 'Mercado / Supermercado',
    paymentMethod: 'card',
    accountOrCardName: 'Nubank',
  };

  const summary = formatExpenseConfirmationSummary(data);
  assert.equal(summary.badgeTitle, 'Despesa Adicionada');
  assert.equal(summary.formattedAmount, '-R$\xa0145,50');
  assert.equal(summary.detailsLine, 'Mercado / Supermercado • Cartão Nubank');

  console.log('✅ 1. Despesa simples à vista formatada com sucesso!');
}

// 2. Teste de compra parcelada
{
  const data: ExpenseAddedToastData = {
    description: 'Notebook Dell',
    amount: 3600,
    currency: 'BRL',
    categoryIcon: '💻',
    categoryName: 'Compras',
    subcategoryName: 'Informática',
    paymentMethod: 'card',
    accountOrCardName: 'XP Visa Infinite',
    installmentCount: 10,
    installmentAmount: 360,
  };

  const summary = formatExpenseConfirmationSummary(data);
  assert.equal(summary.badgeTitle, 'Compra Parcelada (10x)');
  assert.equal(summary.formattedAmount, '10x de R$\xa0360,00');
  assert.equal(summary.detailsLine, 'Informática • Cartão XP Visa Infinite');

  console.log('✅ 2. Compra parcelada formatada com sucesso!');
}

// 3. Teste de despesa fixa recorrente
{
  const data: ExpenseAddedToastData = {
    description: 'Aluguel do Apartamento',
    amount: 2200,
    currency: 'BRL',
    categoryIcon: '🏠',
    categoryName: 'Moradia',
    subcategoryName: 'Aluguel',
    paymentMethod: 'account',
    accountOrCardName: 'Itaú Personalité',
    isRecurring: true,
  };

  const summary = formatExpenseConfirmationSummary(data);
  assert.equal(summary.badgeTitle, 'Despesa Fixa Cadastrada');
  assert.equal(summary.formattedAmount, '-R$\xa02.200,00');
  assert.equal(summary.detailsLine, 'Aluguel • Conta Itaú Personalité');

  console.log('✅ 3. Despesa fixa recorrente formatada com sucesso!');
}

// 4. Teste de emissão e desduplicação com CustomEvent simulado
{
  let receivedEvents = 0;
  let lastDetail: ExpenseAddedToastData | null = null;

  (globalThis as any).window = {
    dispatchEvent: (event: any) => {
      if (event.type === 'finly_expense_added') {
        receivedEvents += 1;
        lastDetail = event.detail;
      }
      return true;
    },
  };
  (globalThis as any).CustomEvent = class {
    type: string;
    detail: any;
    constructor(type: string, params: any) {
      this.type = type;
      this.detail = params?.detail;
    }
  };

  const sample: ExpenseAddedToastData = {
    id: 'tx-teste-toast',
    description: 'Café Expresso',
    amount: 9.5,
    currency: 'BRL',
    categoryIcon: '☕',
    categoryName: 'Alimentação',
  };

  // Primeira emissão
  emitExpenseAddedConfirmation(sample);
  assert.equal(receivedEvents, 1);
  assert.equal(lastDetail?.description, 'Café Expresso');

  // Segunda emissão imediata (mesmo id, valor e descrição) deve ser desduplicada
  emitExpenseAddedConfirmation(sample);
  assert.equal(receivedEvents, 1, 'Deveria desduplicar emissão idêntica em intervalo curto');

  console.log('✅ 4. Emissão e desduplicação de evento validadas com sucesso!');
}

console.log('🎉 TODOS OS TESTES DO POP-UP DE DESPESAS FORAM APROVADOS COM 100% DE SUCESSO!');
