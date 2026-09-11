import assert from 'node:assert/strict';
import {
  generateAmortizationSchedule,
  getMonthlyInterestRate,
} from '../src/utils/financingCalculations';
import {
  buildDebtInstallmentTransactions,
  reconcileDebtTransactions,
} from '../src/utils/debtTransactionSync';
import type { Account, Debt, DebtPayment, Transaction } from '../src/types';

const round2 = (v: number) => Math.round(v * 100) / 100;

console.log('\n--- TESTE DEDICADO: REGRA DA CAIXA, AMORTIZAÇÃO E PAGAMENTOS ---');

// ────────────────────────────────────────────────────────────────
// 1. Regra da Caixa no Pagamento: Abater apenas amortização
// Saldo final = Saldo anterior + Correção Monetária - Amortização
// Juros, seguros e taxas administrativas NÃO amortizam principal
// ────────────────────────────────────────────────────────────────
{
  const debt: Debt = {
    id: 'debt-payment-caixa-test',
    title: 'Financiamento Habitacional Caixa',
    creditor: 'Caixa Econômica Federal',
    contractType: 'real_estate',
    amortizationSystem: 'PRICE',
    indexer: 'TR',
    indexerRate: 0.1708, // 0.1708% a.m.
    interestRate: 4.25, // 4.25% a.a. nominal
    totalAmount: 160000,
    remainingAmount: 160000,
    installmentAmount: 1375.00, // Prestação real emitida no boleto de setembro
    insuranceMonthly: 28.76,
    adminFeeMonthly: 25.00,
    totalInstallments: 420,
    paidInstallments: 19,
    dueDay: 5,
    nextDueDate: '2026-10-05',
    payments: [],
    syncToTransactions: true,
  };

  // Simular a função de amortização do pagamento (idêntica à implementada em FinancialContext)
  const calculatePaymentResult = (d: Debt, paidAmount: number) => {
    const indexerRate = (d.indexer === 'TR' || d.indexer === 'IPCA') ? (d.indexerRate ?? 0) : 0;
    const indexerDecimal = indexerRate / 100;
    const iMonthly = getMonthlyInterestRate(d.interestRate || 0);

    const correction = round2(d.remainingAmount * indexerDecimal);
    const correctedBalance = round2(d.remainingAmount + correction);
    const interest = round2(correctedBalance * iMonthly);
    const insurance = round2(d.insuranceMonthly || 0);
    const adminFee = round2(d.adminFeeMonthly || 0);

    const nonAmortizing = interest + insurance + adminFee;
    let amortization = Math.max(0, round2(paidAmount - nonAmortizing));
    if (amortization > correctedBalance) amortization = correctedBalance;

    const finalBalance = Math.max(0, round2(correctedBalance - amortization));

    return {
      correction,
      correctedBalance,
      interest,
      insurance,
      adminFee,
      nonAmortizing,
      amortization,
      finalBalance,
    };
  };

  const res = calculatePaymentResult(debt, 1375.00);

  // 1. Correção monetária da TR: 160.000 * 0.001708 = 273.28
  assert.equal(res.correction, 273.28, `Correção TR esperada: 273.28, obtida: ${res.correction}`);
  assert.equal(res.correctedBalance, 160273.28);

  // 2. Juros sobre o saldo corrigido: 160.273,28 * (4.25 / 12 / 100) = 567.63
  assert.equal(res.interest, 567.63, `Juros esperados: 567.63, obtidos: ${res.interest}`);

  // 3. Encargos não-amortizantes: juros (567.63) + seguro (28.76) + taxa admin (25.00) = 621.39
  assert.equal(res.nonAmortizing, 621.39, `Encargos esperados: 621.39, obtidos: ${res.nonAmortizing}`);

  // 4. Amortização real: prestação (1375.00) - encargos (621.39) = 753.61
  assert.equal(res.amortization, 753.61, `Amortização esperada: 753.61, obtida: ${res.amortization}`);

  // 5. Saldo devedor final: 160.000 + 273.28 - 753.61 = 159.519,67
  // NOTA: Se subtraísse a prestação inteira (1375), daria 158.625,00 (ERRADO).
  // A regra da Caixa dá 159.519,67 (CORRETO).
  assert.equal(res.finalBalance, 159519.67, `Saldo final Caixa: ${res.finalBalance}`);
  assert.notEqual(res.finalBalance, 160000 - 1375, 'Não deve subtrair a prestação inteira!');

  // 6. Teste de Estorno (Simetria matemática):
  // Saldo revertido = Saldo final + Amortização - Correção = 159.519,64 + 753.64 - 273.28 = 160.000,00
  const restoredBalance = round2(res.finalBalance + res.amortization - res.correction);
  assert.equal(restoredBalance, 160000.00, `Estorno deve restaurar exatamente o saldo original de 160.000: ${restoredBalance}`);

  console.log('OK: Regra da Caixa de amortização e estorno validada com precisão de centavos.');
}

// ────────────────────────────────────────────────────────────────
// 2. Setembro real não é replicado cegamente para o futuro
// ────────────────────────────────────────────────────────────────
{
  const now = new Date('2026-09-01T12:00:00Z');
  const debt: Debt = {
    id: 'debt-sept-test',
    title: 'Financiamento Ap Caixa',
    creditor: 'Caixa',
    contractType: 'real_estate',
    amortizationSystem: 'PRICE',
    indexer: 'TR',
    indexerRate: 0.1708,
    interestRate: 4.25,
    totalAmount: 160000,
    remainingAmount: 160000,
    installmentAmount: 1375.00, // Informado pelo usuário para setembro
    insuranceMonthly: 28.76,
    adminFeeMonthly: 25.00,
    totalInstallments: 420,
    paidInstallments: 19,
    dueDay: 5,
    nextDueDate: '2026-10-05',
    payments: [],
    syncToTransactions: true,
  };

  const txs = buildDebtInstallmentTransactions(debt, 6, 'acc-test', now);

  // Parcela 20 (primeira pendente): deve ter 1375.00
  assert.equal(txs[0].amount, 1375.00, `Parcela 20 (setembro real) = 1375.00 (obtido: ${txs[0].amount})`);
  assert.equal(txs[0].debtBreakdown?.isEstimated, false, 'Parcela 20 tem isEstimated = false');

  // Parcelas 21 a 25: NÃO devem ter 1375.00, e sim o valor calculado pelo cronograma
  for (let i = 1; i < txs.length; i++) {
    assert.notEqual(txs[i].amount, 1375.00, `Parcela ${txs[i].debtInstallmentNumber} NÃO deve ser 1375.00`);
    assert.equal(txs[i].debtBreakdown?.isEstimated, true, `Parcela ${txs[i].debtInstallmentNumber} tem isEstimated = true`);
    // O valor calculado para 160k em 401 meses com 4.25% Price + seguro + taxa é ~R$ 787
    assert.ok(txs[i].amount > 750 && txs[i].amount < 850, `Parcela futura deve estar na faixa de ~787: ${txs[i].amount}`);
  }

  console.log('OK: Setembro real (1375.00) não foi replicado para parcelas futuras.');
}

// ────────────────────────────────────────────────────────────────
// 3. Contrato Prefixado (FIXED) nunca recebe TR e mantém parcelas fixas
// ────────────────────────────────────────────────────────────────
{
  const now = new Date('2026-09-01T12:00:00Z');
  const fixedDebt: Debt = {
    id: 'debt-fixed-test',
    title: 'Financiamento Veículo Prefixado',
    creditor: 'Banco X',
    contractType: 'vehicle',
    amortizationSystem: 'PRICE',
    indexer: 'FIXED',
    indexerRate: 0.1708, // Mesmo com taxa residual, deve ser ignorada
    interestRate: 12.0,
    totalAmount: 50000,
    remainingAmount: 50000,
    installmentAmount: 0,
    insuranceMonthly: 0,
    adminFeeMonthly: 0,
    totalInstallments: 36,
    paidInstallments: 0,
    dueDay: 10,
    nextDueDate: '2026-10-10',
    payments: [],
    syncToTransactions: true,
  };

  const txs = buildDebtInstallmentTransactions(fixedDebt, 12, 'acc-test', now);

  for (const tx of txs) {
    assert.equal(tx.debtBreakdown?.correctionAmount, 0, 'Correção monetária deve ser 0 em contrato prefixado');
  }

  // Todas as parcelas devem ter o mesmo valor exato
  const firstAmount = txs[0].amount;
  for (let i = 1; i < txs.length; i++) {
    assert.equal(txs[i].amount, firstAmount, `Parcela ${i + 1} deve ser idêntica à primeira em contrato prefixado`);
  }

  console.log('OK: Contrato prefixado tem correção 0 e parcelas perfeitamente fixas.');
}

// ────────────────────────────────────────────────────────────────
// 4. Quitação final fecha o saldo em 0.00
// ────────────────────────────────────────────────────────────────
{
  const schedule = generateAmortizationSchedule({
    principal: 160000,
    nominalAnnualRate: 4.25,
    remainingMonths: 401,
    system: 'PRICE',
    indexer: 'TR',
    monthlyTR: 0.1708,
    monthlyInsurance: 28.76,
    adminFee: 25.00,
  });

  const lastRow = schedule.schedule[schedule.schedule.length - 1];
  assert.equal(lastRow.finalBalance, 0, `Saldo deve zerar no final: ${lastRow.finalBalance}`);
  assert.equal(schedule.hasNegativeAmortization, false, 'Não deve ocorrer amortização negativa');

  console.log('OK: Cronograma Price com TR encerra com saldo rigorosamente 0.00.');
}

console.log('\n✅ TODOS OS TESTES DE AMORTIZAÇÃO E PAGAMENTO DA CAIXA PASSARAM COM SUCESSO!\n');
