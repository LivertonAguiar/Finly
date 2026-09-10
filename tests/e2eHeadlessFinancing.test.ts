import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import {
  generateAmortizationSchedule,
  getMonthlyInterestRate,
} from '../src/utils/financingCalculations';
import { readFileSync, existsSync } from 'node:fs';
import {
  buildDebtInstallmentTransactions,
  reconcileDebtTransactions,
} from '../src/utils/debtTransactionSync';
import { inferContractType } from '../src/utils/debtContractInference';
import type { Account, Debt, Transaction } from '../src/types';

// Carregar variáveis de .env para o teste
if (existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// ==============================================================================
// TEST SUITE 1: Cálculo Automático e Cronograma SAC
// ==============================================================================
console.log('\n--- 1. TESTE DE CÁLCULO AUTOMÁTICO SAC ---');

const debtSAC: Debt = {
  id: 'debt-sac-e2e-001',
  title: 'Financiamento Apto Residencial SAC',
  creditor: 'Caixa Econômica Federal',
  totalAmount: 240000, // R$ 240.000,00
  remainingAmount: 240000,
  installmentAmount: 3995, // valor calculado inicial
  totalInstallments: 120, // 10 anos
  paidInstallments: 0,
  dueDay: 15,
  nextDueDate: '2026-10-15',
  interestRate: 9.6, // 9.6% a.a. nominal
  contractType: 'real_estate',
  amortizationSystem: 'SAC',
  indexer: 'FIXED',
  indexerRate: 0,
  insuranceMonthly: 50,
  adminFeeMonthly: 25,
  syncToTransactions: true,
};

const scheduleSAC = generateAmortizationSchedule({
  principal: debtSAC.totalAmount,
  remainingMonths: debtSAC.totalInstallments,
  nominalAnnualRate: debtSAC.interestRate ?? 0,
  system: 'SAC',
  monthlyTR: 0,
  monthlyInsurance: debtSAC.insuranceMonthly ?? 0,
  adminFee: debtSAC.adminFeeMonthly ?? 0,
});

assert.equal(scheduleSAC.schedule.length, 120, 'Array do cronograma deve conter 120 itens');

const p1 = scheduleSAC.schedule[0];
const p2 = scheduleSAC.schedule[1];
const p60 = scheduleSAC.schedule[59];
const p120 = scheduleSAC.schedule[119];

// Amortização constante no SAC: 240.000 / 120 = 2.000
assert.equal(p1.amortizationAmount, 2000, 'Amortização P1 deve ser constante = 2000');
assert.equal(p2.amortizationAmount, 2000, 'Amortização P2 deve ser constante = 2000');
assert.equal(p120.amortizationAmount, 2000, 'Amortização P120 deve ser constante = 2000');

// Juros devem decrescer
assert.ok(p1.interestAmount > p2.interestAmount, 'Juros P1 > Juros P2');
assert.ok(p2.interestAmount > p60.interestAmount, 'Juros P2 > Juros P60');
assert.ok(p60.interestAmount > p120.interestAmount, 'Juros P60 > Juros P120');

// Parcela total deve ser decrescente mês a mês
assert.ok(p1.totalInstallment > p2.totalInstallment, `P1 (${p1.totalInstallment}) deve ser maior que P2 (${p2.totalInstallment})`);
assert.ok(p2.totalInstallment > p60.totalInstallment, `P2 (${p2.totalInstallment}) deve ser maior que P60 (${p60.totalInstallment})`);
assert.ok(p60.totalInstallment > p120.totalInstallment, `P60 (${p60.totalInstallment}) deve ser maior que P120 (${p120.totalInstallment})`);

// Saldo devedor final deve ser zero
assert.equal(p120.finalBalance, 0, 'Saldo devedor final no SAC puro deve ser 0');

console.log(`✅ SAC Validado: P1 = R$ ${p1.totalInstallment.toFixed(2)} | P60 = R$ ${p60.totalInstallment.toFixed(2)} | P120 = R$ ${p120.totalInstallment.toFixed(2)} (Decréscimo estrito e monotônico)`);

// ==============================================================================
// TEST SUITE 2: Preservação da Aba e Inferência na Edição
// ==============================================================================
console.log('\n--- 2. TESTE DE PRESERVAÇÃO DA ABA DE EDIÇÃO ---');

// Cenário A: Dívida com contractType persistido como 'real_estate'
const tabRealEstate = inferContractType(debtSAC);
assert.equal(tabRealEstate, 'real_estate', 'Ao abrir edição com contractType=real_estate, aba deve ser real_estate');

// Cenário B: Dívida com contractType persistido como 'vehicle'
const debtVehicle: Debt = {
  ...debtSAC,
  id: 'debt-veh-001',
  contractType: 'vehicle',
  title: 'Financiamento Honda Civic',
};
const tabVehicle = inferContractType(debtVehicle);
assert.equal(tabVehicle, 'vehicle', 'Ao abrir edição com contractType=vehicle, aba deve ser vehicle');

// Cenário C: Dívida legada sem contractType, mas com palavras-chave de imóvel
const legacyImob: any = {
  id: 'debt-leg-001',
  title: 'Financiamento Habitacional Caixa Apto 402',
  creditor: 'Caixa Econômica',
};
assert.equal(inferContractType(legacyImob), 'real_estate', 'Dívida legada habitacional deve inferir aba real_estate');

// Cenário D: Dívida legada sem contractType, com palavras-chave de veículo
const legacyAuto: any = {
  id: 'debt-leg-002',
  title: 'Financiamento de Carro Sedan',
  creditor: 'Banco Santander',
};
assert.equal(inferContractType(legacyAuto), 'vehicle', 'Dívida legada automotiva deve inferir aba vehicle');

// Cenário E: Dívida de empréstimo padrão
const loanDebt: any = {
  id: 'debt-leg-003',
  title: 'Empréstimo Pessoal Consignado',
  creditor: 'Banco do Brasil',
  contractType: 'loan',
};
assert.equal(inferContractType(loanDebt), 'loan', 'Empréstimo deve manter aba loan');

console.log('✅ Preservação de aba na edição 100% validada (real_estate, vehicle, loan e legados).');

// ==============================================================================
// TEST SUITE 3: Parcelas Decrescentes SAC no Extrato de Transações
// ==============================================================================
console.log('\n--- 3. TESTE DE TRANSAÇÕES SAC NO EXTRATO ---');

const dummyAccount: Account = {
  id: 'acc-001',
  name: 'Conta Corrente',
  type: 'checking',
  balance: 50000,
  currency: 'BRL',
  color: '#6366f1',
};

const NOW = new Date('2026-10-01T12:00:00Z');
const txs = buildDebtInstallmentTransactions(debtSAC, 12, dummyAccount.id, NOW);

// Verifica que foram geradas as 12 parcelas da janela de projeção
assert.equal(txs.length, 12, `Devem ser geradas exatamente 12 parcelas na janela de 12 meses (geradas: ${txs.length})`);

// Verifica cada parcela: decréscimo estrito entre parcelas consecutivas
for (let i = 0; i < txs.length - 1; i++) {
  const current = txs[i];
  const next = txs[i + 1];
  assert.ok(
    current.amount > next.amount,
    `Parcela ${i + 1} (R$ ${current.amount}) deve ser maior que Parcela ${i + 2} (R$ ${next.amount})`
  );
  assert.equal(current.type, 'expense', 'Tipo deve ser despesa');
  assert.equal(current.debtId, debtSAC.id, 'debtId deve estar vinculado na coluna dedicada');
  assert.equal(current.debtInstallmentNumber, i + 1, `Número da parcela deve ser ${i + 1}`);
  assert.equal(current.installments?.debtId, debtSAC.id, 'installments.debtId deve estar vinculado');
  assert.equal(current.installments?.debtInstallmentNumber, i + 1, `installments.debtInstallmentNumber deve ser ${i + 1}`);
}

// Reconciliação sem duplicatas
const reconciled = reconcileDebtTransactions([debtSAC], txs, [dummyAccount], { horizonMonths: 12, now: NOW });
assert.equal(reconciled.createdCount, 0, 'Reconciliação não deve criar transações novas se já existem');
assert.equal(reconciled.transactions.length, txs.length, 'Reconciliação deve manter a quantidade original');

console.log(`✅ Extrato validado: ${txs.length} parcelas SAC geradas com valores estritamente decrescentes mês a mês.`);

// ==============================================================================
// TEST SUITE 4: Live Roundtrip no Supabase (Postgres em Produção)
// ==============================================================================
console.log('\n--- 4. TESTE LIVE ROUNDTRIP NO SUPABASE POSTGRES ---');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://finly.lpaguiar.com.br';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (SUPABASE_KEY) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Usuário de demonstração com UUID canônico
  const testUserId = '75a44ea2-c56f-474f-aaf1-4688f6e778a2';
  const testDebtId = `test-sac-e2e-${Date.now()}`;

  try {
    // 1. Inserir Financiamento Imobiliário SAC com as novas colunas
    const insertRow = {
      id: testDebtId,
      user_id: testUserId,
      title: 'Apto Teste E2E Headless SAC',
      creditor: 'Caixa Econômica',
      total_amount: 300000.0,
      remaining_amount: 300000.0,
      interest_rate: 9.5,
      installment_amount: 3950.0,
      total_installments: 360,
      paid_installments: 0,
      due_day: 10,
      contract_type: 'real_estate',
      amortization_system: 'SAC',
      indexer: 'TR',
      indexer_rate: 0.1708,
      insurance_monthly: 85.0,
      admin_fee_monthly: 25.0,
      contract_number: '123456789-SAC',
      sync_to_transactions: true,
      payments: [],
    };

    const { error: insertErr } = await supabase.from('debts').upsert([insertRow]);
    assert.ifError(insertErr);
    console.log('  -> Inserção com 9 novas colunas de financiamento no Supabase: OK');

    // 2. Consultar o registro gravado e conferir todos os campos estruturados
    const { data: fetchRows, error: fetchErr } = await supabase
      .from('debts')
      .select('*')
      .eq('id', testDebtId)
      .single();

    assert.ifError(fetchErr);
    assert.ok(fetchRows, 'Registro deve ser retornado pelo Supabase');
    assert.equal(fetchRows.contract_type, 'real_estate', 'contract_type deve ser real_estate');
    assert.equal(fetchRows.amortization_system, 'SAC', 'amortization_system deve ser SAC');
    assert.equal(fetchRows.indexer, 'TR', 'indexer deve ser TR');
    assert.equal(Number(fetchRows.indexer_rate), 0.1708, 'indexer_rate deve ser 0.1708');
    assert.equal(Number(fetchRows.insurance_monthly), 85.0, 'insurance_monthly deve ser 85.00');
    assert.equal(Number(fetchRows.admin_fee_monthly), 25.0, 'admin_fee_monthly deve ser 25.00');
    assert.equal(fetchRows.contract_number, '123456789-SAC', 'contract_number preservado');
    console.log('  -> Leitura e validação de integridade dos 9 campos no Postgres: OK');

    // 3. Validar que o objeto lido ativa a aba Imobiliário via inferContractType
    const mappedDebt: Debt = {
      id: fetchRows.id,
      title: fetchRows.title,
      creditor: fetchRows.creditor,
      totalAmount: Number(fetchRows.total_amount),
      remainingAmount: Number(fetchRows.remaining_amount),
      installmentAmount: Number(fetchRows.installment_amount),
      totalInstallments: fetchRows.total_installments,
      paidInstallments: fetchRows.paid_installments,
      dueDay: fetchRows.due_day,
      contractType: fetchRows.contract_type,
      amortizationSystem: fetchRows.amortization_system,
      indexer: fetchRows.indexer,
      indexerRate: fetchRows.indexer_rate ? Number(fetchRows.indexer_rate) : undefined,
      insuranceMonthly: fetchRows.insurance_monthly ? Number(fetchRows.insurance_monthly) : undefined,
      adminFeeMonthly: fetchRows.admin_fee_monthly ? Number(fetchRows.admin_fee_monthly) : undefined,
      contractNumber: fetchRows.contract_number,
      syncToTransactions: fetchRows.sync_to_transactions,
    };

    const editTab = inferContractType(mappedDebt);
    assert.equal(editTab, 'real_estate', 'Aba selecionada ao editar registro lido do banco deve ser real_estate');
    console.log('  -> Aba "Imobiliário" preservada ao reabrir para edição: OK');

    // 4. Inserir transação com as novas colunas dedicadas debt_id e debt_installment_number
    const testTxId = `test-tx-e2e-${Date.now()}`;
    const txRow = {
      id: testTxId,
      user_id: testUserId,
      description: 'Parcela 01/360 - Apto Teste E2E',
      amount: 3950.0,
      type: 'expense',
      date: '2026-10-10',
      category_id: 'cat-moradia',
      status: 'scheduled',
      debt_id: testDebtId,
      debt_installment_number: 1,
      installments: { debtId: testDebtId, debtInstallmentNumber: 1 },
      tags: [],
    };

    const { error: txInsertErr } = await supabase.from('transactions').upsert([txRow]);
    assert.ifError(txInsertErr);
    console.log('  -> Inserção de transação vinculada com debt_id dedicado: OK');

    // 5. Consultar transação e verificar persistência das novas colunas indexadas
    const { data: txFetch, error: txFetchErr } = await supabase
      .from('transactions')
      .select('id, debt_id, debt_installment_number')
      .eq('id', testTxId)
      .single();

    assert.ifError(txFetchErr);
    assert.equal(txFetch.debt_id, testDebtId, 'debt_id deve persistir na coluna dedicada');
    assert.equal(txFetch.debt_installment_number, 1, 'debt_installment_number deve ser 1');
    console.log('  -> Leitura de transação com vínculo de dívida dedicado: OK');

    // 6. Cleanup: remover registros de teste
    await supabase.from('transactions').delete().eq('id', testTxId);
    await supabase.from('debts').delete().eq('id', testDebtId);
    console.log('  -> Limpeza dos registros de teste no Supabase: OK');

    console.log('✅ Validação Live no Supabase Postgres concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro no teste live Supabase:', err);
    throw err;
  }
} else {
  console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente. Teste live pulado.');
}

console.log('\n=============================================================');
console.log('🎉 TODOS OS TESTES E2E HEADLESS FORAM APROVADOS COM SUCESSO!');
console.log('=============================================================\n');
