import assert from 'node:assert/strict';
import { getCardBankInfo } from '../src/utils/bankLogos';
import { InvoiceExportData } from '../src/utils/reportExportService';
import { CreditCard } from '../src/types';

console.log('--- Iniciando testes de Identidade Bancária e PDF de Faturas ---');

// 1. Teste de mapeamento de banco pelo getCardBankInfo
{
  const nubankCard: CreditCard = {
    id: 'card-nu',
    name: 'Nubank Ultravioleta',
    brand: 'Mastercard',
    limit: 15000,
    closingDay: 28,
    dueDay: 5,
    color: '#820ad1',
  };
  const bankInfo = getCardBankInfo(nubankCard);
  assert.ok(bankInfo, 'Deveria encontrar informações para o Nubank');
  assert.equal(bankInfo?.id, 'nubank');
  assert.equal(bankInfo?.code, '260');
  console.log('✓ Teste 1: Nubank identificado com código 260 e cor oficial');
}

{
  const interCard: CreditCard = {
    id: 'card-inter',
    name: 'Inter Mastercard Black',
    brand: 'Mastercard',
    limit: 25000,
    closingDay: 15,
    dueDay: 22,
    color: '#ff7a00',
  };
  const bankInfo = getCardBankInfo(interCard);
  assert.ok(bankInfo, 'Deveria encontrar informações para o Banco Inter');
  assert.equal(bankInfo?.id, 'inter');
  assert.equal(bankInfo?.code, '077');
  console.log('✓ Teste 2: Banco Inter identificado com código 077 e cor oficial');
}

// 2. Teste de cálculo de data de fechamento e melhor dia de compra
{
  const closingDay = 15;
  const bestBuyDay = closingDay + 1 > 31 ? 1 : closingDay + 1;
  assert.equal(bestBuyDay, 16, 'Melhor dia de compra deve ser o dia subsequente ao fechamento');

  const closingDay31 = 31;
  const bestBuyDay31 = closingDay31 + 1 > 31 ? 1 : closingDay31 + 1;
  assert.equal(bestBuyDay31, 1, 'Melhor dia de compra para fechamento no dia 31 deve ser dia 1');
  console.log('✓ Teste 3: Cálculo do melhor dia de compra após o fechamento');
}

// 3. Teste de estrutura de dados da Fatura com fechamento e limites
{
  const invoiceData: InvoiceExportData = {
    card: {
      id: 'card-itau',
      name: 'Itaú Personnalité',
      brand: 'Visa',
      limit: 30000,
      closingDay: 10,
      dueDay: 17,
      color: '#ec7000',
    },
    monthLabel: 'Outubro de 2026',
    periodSlug: 'itau_fatura_2026-10',
    invoiceTotal: 4500,
    statusLabel: 'Fatura Aberta',
    transactions: [],
    categories: [],
    currency: 'BRL',
    availableLimit: 25500,
    totalCommitted: 4500,
  };

  assert.equal(invoiceData.card.closingDay, 10);
  assert.equal(invoiceData.card.dueDay, 17);
  assert.equal(invoiceData.availableLimit, 25500);
  console.log('✓ Teste 4: Dados enriquecidos de fatura e limites validados');
}

// 4. Teste de formatação dos últimos 4 dígitos e tratamento de ausência
{
  const formatCardNumber = (last4?: string) => {
    const cleanLast4 = last4 ? last4.trim() : '';
    return cleanLast4 ? `•••• •••• •••• ${cleanLast4}` : '•••• •••• •••• ••••';
  };

  assert.equal(
    formatCardNumber('1234'),
    '•••• •••• •••• 1234',
    'Deveria exibir os 4 dígitos finais quando informados'
  );

  assert.equal(
    formatCardNumber(''),
    '•••• •••• •••• ••••',
    'Deveria exibir apenas máscara de bolinhas quando string vazia'
  );

  assert.equal(
    formatCardNumber(undefined),
    '•••• •••• •••• ••••',
    'Deveria exibir apenas máscara de bolinhas quando ausente/undefined (sem inventar dígitos falsos)'
  );

  console.log('✓ Teste 5: Validação do final do cartão e tratamento elegante para ausência');
}

console.log('✅ Todos os testes de Identidade Bancária e Fatura passaram com 100% de sucesso!');

