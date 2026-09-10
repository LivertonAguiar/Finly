import assert from 'node:assert/strict';
import {
  buildDebtInstallmentTransactions,
  reconcileDebtTransactions,
} from '../src/utils/debtTransactionSync';
import type { Account, Debt, Transaction } from '../src/types';

const accounts: Account[] = [{
  id: 'acc-test',
  name: 'Conta teste',
  type: 'checking',
  balance: 1000,
  initialBalance: 1000,
  color: '#6366f1',
  includeInTotal: true,
}];

const NOW = new Date('2026-09-01T12:00:00Z');

// ────────────────────────────────────────────────────────────────
// 1. Empréstimo simples — valor fixo (regressão)
// ────────────────────────────────────────────────────────────────
{
  const simpleLoan: Debt = {
    id: 'debt-simple',
    title: 'Empréstimo pessoal',
    creditor: 'Banco X',
    totalAmount: 12000,
    remainingAmount: 6000,
    installmentAmount: 1000,
    totalInstallments: 12,
    paidInstallments: 6,
    dueDay: 15,
    nextDueDate: '2026-09-15',
    payments: [],
    contractType: 'loan',
  };

  const txs = buildDebtInstallmentTransactions(simpleLoan, 6, 'acc-test', NOW);
  assert.equal(txs.length, 6, 'Empréstimo simples: 6 parcelas restantes');

  // Todas as parcelas devem ter o mesmo valor
  for (const tx of txs) {
    assert.equal(tx.amount, 1000, `Parcela fixa: ${tx.amount}`);
  }

  // Primeira parcela = 7 (6 pagas)
  assert.equal(txs[0].debtInstallmentNumber, 7);
  assert.equal(txs[5].debtInstallmentNumber, 12);

  console.log('OK: empréstimo simples — valor fixo para todas as parcelas');
}

// ────────────────────────────────────────────────────────────────
// 2. Financiamento imobiliário Price — valores calculados
// ────────────────────────────────────────────────────────────────
{
  const realEstate: Debt = {
    id: 'debt-imob',
    title: 'Financiamento Apartamento',
    creditor: 'Caixa Econômica',
    contractType: 'real_estate',
    amortizationSystem: 'PRICE',
    totalAmount: 200000,
    remainingAmount: 160000,
    installmentAmount: 0, // Será calculado
    interestRate: 4.25,
    indexer: 'TR',
    indexerRate: 0.1708,
    insuranceMonthly: 28.76,
    adminFeeMonthly: 25,
    totalInstallments: 420,
    paidInstallments: 19,
    dueDay: 5,
    nextDueDate: '2026-10-05',
    payments: [],
    syncToTransactions: true,
  };

  const txs = buildDebtInstallmentTransactions(realEstate, 12, 'acc-test', NOW);
  assert.equal(txs.length, 12, 'Price: gera 12 parcelas no horizonte');

  // Parcelas Price devem ter valor > 0 e incluir juros/seguro/taxa
  for (const tx of txs) {
    assert.ok(tx.amount > 0, `Parcela Price > 0: ${tx.amount}`);
    // Deve ser maior que só o seguro + taxa (pois inclui amortização + juros)
    assert.ok(tx.amount > 28.76 + 25, `Inclui componentes: ${tx.amount}`);
  }

  // Price: parcelas devem ser ~iguais (variação pela TR é mínima mês a mês)
  const first = txs[0].amount;
  const last = txs[11].amount;
  const variation = Math.abs(first - last) / first;
  assert.ok(variation < 0.05, `Price variação < 5%: ${(variation * 100).toFixed(2)}%`);

  // Categorias corretas para imobiliário
  assert.equal(txs[0].categoryId, 'cat-desp-moradia');
  assert.ok(txs[0].tags.includes('financiamento'));

  console.log('OK: financiamento imobiliário Price — parcelas calculadas com juros/TR/seguro');
}

// ────────────────────────────────────────────────────────────────
// 3. Financiamento veicular SAC — parcelas decrescentes
// ────────────────────────────────────────────────────────────────
{
  const vehicle: Debt = {
    id: 'debt-veic',
    title: 'Financiamento Carro',
    creditor: 'Banco do Brasil',
    contractType: 'vehicle',
    amortizationSystem: 'SAC',
    totalAmount: 60000,
    remainingAmount: 45000,
    installmentAmount: 0,
    interestRate: 8.5,
    indexer: 'FIXED',
    totalInstallments: 60,
    paidInstallments: 10,
    dueDay: 20,
    nextDueDate: '2026-10-20',
    payments: [],
    syncToTransactions: true,
  };

  const txs = buildDebtInstallmentTransactions(vehicle, 12, 'acc-test', NOW);
  assert.equal(txs.length, 12, 'SAC veículo: 12 parcelas no horizonte');

  // SAC: parcelas devem ser decrescentes
  for (let i = 1; i < txs.length; i++) {
    assert.ok(
      txs[i].amount <= txs[i - 1].amount + 0.01,
      `SAC decrescente: parcela ${i} (${txs[i].amount}) <= parcela ${i - 1} (${txs[i - 1].amount})`
    );
  }

  // Valores devem ser diferentes entre si
  const uniqueAmounts = new Set(txs.map(t => t.amount));
  assert.ok(uniqueAmounts.size > 1, 'SAC: parcelas devem ter valores diferentes');

  // Categoria veicular
  assert.equal(txs[0].categoryId, 'cat-desp-transporte');

  console.log('OK: financiamento veicular SAC — parcelas decrescentes');
}

// ────────────────────────────────────────────────────────────────
// 4. Parcelas pagas não são recriadas (reconciliação)
// ────────────────────────────────────────────────────────────────
{
  const debt: Debt = {
    id: 'debt-recon',
    title: 'Empréstimo recon',
    creditor: 'Banco Y',
    totalAmount: 12000,
    remainingAmount: 8000,
    installmentAmount: 1000,
    totalInstallments: 12,
    paidInstallments: 4,
    dueDay: 10,
    nextDueDate: '2026-10-10',
    payments: [],
    contractType: 'loan',
    syncToTransactions: true,
  };

  // Simular 2 transações já existentes (parcelas 5 e 6 — uma paga, uma pendente)
  const existingTxs: Transaction[] = [
    {
      id: 'tx-paid-5',
      description: 'Empréstimo recon (5/12)',
      amount: 1000,
      type: 'expense',
      date: '2026-10-10',
      categoryId: 'cat-desp-financeiro',
      status: 'completed', // Paga!
      recurring: false,
      debtId: 'debt-recon',
      debtInstallmentNumber: 5,
      tags: ['divida'],
      createdAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'tx-pending-6',
      description: 'Empréstimo recon (6/12)',
      amount: 1000,
      type: 'expense',
      date: '2026-11-10',
      categoryId: 'cat-desp-financeiro',
      status: 'pending',
      recurring: false,
      debtId: 'debt-recon',
      debtInstallmentNumber: 6,
      tags: ['divida'],
      createdAt: '2026-09-01T00:00:00Z',
    },
  ];

  const result = reconcileDebtTransactions([debt], existingTxs, accounts, {
    horizonMonths: 8,
    now: NOW,
  });

  // Deve criar apenas parcelas 7..12 (6 novas), não duplicar 5 e 6
  assert.equal(result.createdCount, 6, `Criadas: ${result.createdCount} (esperado 6)`);

  // Total deve ser 2 existentes + 6 novas = 8
  assert.equal(result.transactions.length, 8, `Total: ${result.transactions.length}`);

  // A parcela paga (5) deve continuar intacta
  const paid = result.transactions.find(t => t.debtInstallmentNumber === 5);
  assert.ok(paid, 'Parcela 5 existe');
  assert.equal(paid!.status, 'completed', 'Parcela 5 continua paga');
  assert.equal(paid!.id, 'tx-paid-5', 'ID da parcela paga preservado');

  console.log('OK: reconciliação não duplica nem altera parcelas existentes');
}

// ────────────────────────────────────────────────────────────────
// 5. Empréstimo simples mantém backward compat (regressão do teste original)
// ────────────────────────────────────────────────────────────────
{
  const legacyDebt: Debt = {
    id: 'debt-legacy',
    title: 'Financiamento legado',
    creditor: 'Banco teste',
    totalAmount: 24000,
    remainingAmount: 12000,
    installmentAmount: 1000,
    totalInstallments: 24,
    paidInstallments: 12,
    dueDay: 10,
    nextDueDate: '2026-09-10',
    payments: [],
  };

  const first = reconcileDebtTransactions([legacyDebt], [], accounts, {
    horizonMonths: 12,
    now: NOW,
  });

  assert.equal(first.createdCount, 12);
  assert.equal(first.debts[0].syncToTransactions, true);
  assert.equal(first.transactions.length, 12);
  assert.equal(first.transactions[0].debtId, legacyDebt.id);
  assert.equal(first.transactions[0].debtInstallmentNumber, 13);

  const second = reconcileDebtTransactions(first.debts, first.transactions as Transaction[], accounts, {
    horizonMonths: 12,
    now: NOW,
  });

  assert.equal(second.createdCount, 0);
  assert.equal(second.transactions.length, 12);

  console.log('OK: backward compat — empréstimo legado idempotente');
}

console.log('\n✅ Todos os testes de debtTransactionSync passaram!');
