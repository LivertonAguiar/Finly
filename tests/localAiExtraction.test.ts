/**
 * Test: Finly Local AI Extraction and Heuristic Fallback
 */
import assert from 'node:assert';
import { extractTransactionData } from '../server/aiService.js';

const mockCategories = [
  { id: 'cat-1', name: 'Alimentação', subcategories: [{ id: 'sub-1', name: 'Restaurante' }, { id: 'sub-2', name: 'Supermercado' }] },
  { id: 'cat-2', name: 'Transporte', subcategories: [{ id: 'sub-3', name: 'Combustível' }, { id: 'sub-4', name: 'Uber / Táxi' }] },
  { id: 'cat-3', name: 'Moradia', subcategories: [{ id: 'sub-5', name: 'Aluguel' }, { id: 'sub-6', name: 'Energia Elétrica' }] },
];

const mockAccounts = [
  { id: 'acc-1', name: 'Nubank' },
  { id: 'acc-2', name: 'Inter' },
];

const mockCards = [
  { id: 'crd-1', name: 'PicPay Mastercard' },
];

async function runTests() {
  console.log('🧪 Iniciando testes do Serviço de IA Local (Ollama / Heurístico)...');

  // Test 1: Fallback heuristic extract on expense
  const sample1 = 'Comprovante Pix: Você transferiu R$ 68,50 para Posto Shell Ltda em 28/09/2026';
  const result1 = await extractTransactionData({
    text: sample1,
    categories: mockCategories,
    accounts: mockAccounts,
    cards: mockCards,
  });

  assert.strictEqual(result1.success, true, 'Deveria extrair com sucesso');
  assert.strictEqual(result1.data.type, 'expense', 'Tipo deve ser despesa');
  assert.strictEqual(result1.data.amount, 68.5, 'Valor deve ser 68.50');
  console.log('✅ Teste 1 Aprovado: Extração de despesa Pix com centavos exatos!');

  // Test 2: Fallback heuristic extract on income
  const sample2 = 'Pix recebido: R$ 1.250,00 de Empresa XYZ Salário';
  const result2 = await extractTransactionData({
    text: sample2,
    categories: mockCategories,
    accounts: mockAccounts,
  });

  assert.strictEqual(result2.success, true, 'Deveria extrair receita com sucesso');
  assert.strictEqual(result2.data.type, 'income', 'Tipo deve ser receita');
  assert.strictEqual(result2.data.amount, 1250, 'Valor deve ser 1250.00');
  console.log('✅ Teste 2 Aprovado: Extração de receita com valor de milhar!');

  console.log('🎉 TODOS OS TESTES DO SERVIÇO DE IA FORAM APROVADOS COM SUCESSO!');
}

runTests().catch(err => {
  console.error('❌ Teste falhou:', err);
  process.exit(1);
});
