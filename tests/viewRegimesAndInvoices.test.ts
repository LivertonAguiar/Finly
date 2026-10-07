import assert from 'node:assert/strict';
import {
  allocateCardTransaction,
  doesTransactionBelongToMonth,
  getEffectiveTransactionDate,
  isInvoicePaymentTransaction,
  isCardInvoicePaid,
  ViewRegime,
} from '../src/utils/invoiceCalculator';
import { Transaction, CreditCard } from '../src/types';

const mockCard: CreditCard = {
  id: 'card-1',
  userId: 'user-1',
  name: 'Nubank Black',
  limit: 10000,
  closingDay: 20,
  dueDay: 28,
  brand: 'mastercard',
  color: '#820ad1',
  lastDigits: '1234',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// 1. Validar significado de invoiceMonth e regimes de visualização
// Compra feita antes do fechamento (dia 15 de Outubro) -> Fatura 2026-10
const allocBeforeClosing = allocateCardTransaction('2026-10-15', mockCard.closingDay, mockCard.dueDay);
assert.equal(allocBeforeClosing.invoiceMonth, '2026-10', 'Compra dia 15 deve pertencer à fatura de Outubro');
assert.equal(allocBeforeClosing.isAfterClosing, false);

// Compra feita após o fechamento (dia 25 de Outubro) -> Fatura 2026-11
const allocAfterClosing = allocateCardTransaction('2026-10-25', mockCard.closingDay, mockCard.dueDay);
assert.equal(allocAfterClosing.invoiceMonth, '2026-11', 'Compra dia 25 deve pertencer à fatura de Novembro');
assert.equal(allocAfterClosing.isAfterClosing, true);

// 2. Validar doesTransactionBelongToMonth nos 3 regimes
const txCardOutubro: Transaction = {
  id: 'tx-card-1',
  userId: 'user-1',
  type: 'expense',
  amount: 250,
  date: '2026-10-05',
  cardId: 'card-1',
  invoiceMonth: '2026-10',
  description: 'Supermercado',
  categoryId: 'cat-alimentacao',
  status: 'pending',
  createdAt: '2026-10-05T10:00:00.000Z',
};

const txCardPosFechamento: Transaction = {
  id: 'tx-card-2',
  userId: 'user-1',
  type: 'expense',
  amount: 400,
  date: '2026-10-25',
  cardId: 'card-1',
  invoiceMonth: '2026-11',
  description: 'Eletrônico',
  categoryId: 'cat-lazer',
  status: 'pending',
  createdAt: '2026-10-25T10:00:00.000Z',
};

// Por Competência/Fatura (invoice_month)
assert.equal(doesTransactionBelongToMonth(txCardOutubro, mockCard, '2026-10', 'invoice_month'), true, 'Compra fatura Outubro deve aparecer em Outubro');
assert.equal(doesTransactionBelongToMonth(txCardPosFechamento, mockCard, '2026-10', 'invoice_month'), false, 'Compra fatura Novembro NÃO deve aparecer em Outubro por competência');
assert.equal(doesTransactionBelongToMonth(txCardPosFechamento, mockCard, '2026-11', 'invoice_month'), true, 'Compra fatura Novembro deve aparecer em Novembro por competência');

// Por Data da Compra (purchase_date)
assert.equal(doesTransactionBelongToMonth(txCardPosFechamento, mockCard, '2026-10', 'purchase_date'), true, 'Por data da compra, compra de 25/10 deve aparecer em Outubro');

// 3. Validar liquidação de fatura (não duplicação como despesa)
const txPagamentoFatura: Transaction = {
  id: 'tx-pay-1',
  userId: 'user-1',
  type: 'expense',
  amount: 650,
  date: '2026-10-28',
  accountId: 'acc-1',
  description: 'Pagamento Fatura Nubank Black',
  categoryId: 'cat-fatura-cartao',
  status: 'completed',
  createdAt: '2026-10-28T12:00:00.000Z',
};

assert.equal(isInvoicePaymentTransaction(txPagamentoFatura), true, 'Pagamento de fatura deve ser identificado como liquidação');

// 4. Validar consolidação contábil do mês de Outubro
const txComumPaga: Transaction = {
  id: 'tx-comum-1',
  userId: 'user-1',
  type: 'expense',
  amount: 800,
  date: '2026-10-10',
  accountId: 'acc-1',
  description: 'Aluguel',
  categoryId: 'cat-moradia',
  status: 'completed',
  createdAt: '2026-10-10T10:00:00.000Z',
};

const txComumPendente: Transaction = {
  id: 'tx-comum-2',
  userId: 'user-1',
  type: 'expense',
  amount: 500,
  date: '2026-10-30',
  accountId: 'acc-1',
  description: 'Condomínio',
  categoryId: 'cat-moradia',
  status: 'pending',
  createdAt: '2026-10-10T10:00:00.000Z',
};

const allTxs = [txComumPaga, txComumPendente, txCardOutubro, txCardPosFechamento, txPagamentoFatura];

// Filtrar despesas econômicas de Outubro
const outEconomicExpenses = allTxs.filter(t => {
  if (t.type !== 'expense' || t.ignored || isInvoicePaymentTransaction(t)) return false;
  if (t.cardId) {
    return (t.invoiceMonth || t.date.slice(0, 7)) === '2026-10';
  }
  return t.date.startsWith('2026-10');
});

// Despesas totais de Outubro: Aluguel (800) + Condomínio (500) + Cartão Outubro (250) = 1550
// Note que txPagamentoFatura NÃO entrou (evitou duplicação)
// e txCardPosFechamento NÃO entrou (pois sua competência é Novembro)
const totalDespesas = outEconomicExpenses.reduce((sum, t) => sum + t.amount, 0);
assert.equal(totalDespesas, 1550, 'Total de despesas econômicas deve ser 1550');

// Categorias originais do cartão preservadas
const supermercado = outEconomicExpenses.find(t => t.id === 'tx-card-1');
assert.equal(supermercado?.categoryId, 'cat-alimentacao', 'Categoria original da compra de cartão deve ser preservada');

// 4. Validação de status de pagamento de fatura (isCardInvoicePaid)
// Cenário A: Compras normais de cartão com status 'completed' SEM transação de pagamento de fatura -> NÃO deve ser considerada paga!
const txCardCompletedSemPagamento: Transaction = {
  id: 'tx-card-completed',
  userId: 'user-1',
  type: 'expense',
  amount: 3402.59,
  date: '2026-10-02',
  cardId: 'card-1',
  invoiceMonth: '2026-10',
  description: 'Compra no Cartão Nubank',
  categoryId: 'cat-alimentacao',
  status: 'completed',
  createdAt: '2026-10-02T10:00:00.000Z',
};

assert.equal(
  isCardInvoicePaid(mockCard, '2026-10', [txCardCompletedSemPagamento]),
  false,
  'Fatura com despesas completed NÃO deve ser marcada como paga sem lançamento de pagamento de fatura'
);

// Cenário B: Fatura com pagamento efetivo de fatura registrado para Outubro/2026 -> DEVE ser considerada paga!
const txPagamentoEfetivoFatura: Transaction = {
  id: 'tx-pay-123456',
  userId: 'user-1',
  type: 'expense',
  amount: 3402.59,
  date: '2026-10-07',
  accountId: 'acc-1',
  description: 'Pagamento Fatura Nubank Black (2026-10)',
  categoryId: 'cat-fatura-cartao',
  tags: ['fatura', 'cartao'],
  status: 'completed',
  notes: 'Pagamento de fatura referente a 2026-10',
  createdAt: '2026-10-07T12:00:00.000Z',
};

assert.equal(
  isCardInvoicePaid(mockCard, '2026-10', [txCardCompletedSemPagamento, txPagamentoEfetivoFatura]),
  true,
  'Fatura com lançamento de pagamento deve ser considerada PAGA'
);

// Cenário C: Pagamento registrado para outro mês (Novembro) não deve marcar Outubro como pago
assert.equal(
  isCardInvoicePaid(mockCard, '2026-11', [txCardCompletedSemPagamento]),
  false,
  'Fatura de Novembro sem pagamento não deve constar como paga'
);

// Cenário D: Pagamento de outro cartão não deve marcar o Nubank como pago
const mockOutroCartao: CreditCard = {
  ...mockCard,
  id: 'card-2',
  name: 'Itaú Personalité',
};
assert.equal(
  isCardInvoicePaid(mockOutroCartao, '2026-10', [txPagamentoEfetivoFatura]),
  false,
  'Pagamento de um cartão não deve pagar outro cartão'
);

console.log('✅ Todos os testes de regimes de competência, vencimento, compras de cartão e faturas passaram com 100% de sucesso!');
