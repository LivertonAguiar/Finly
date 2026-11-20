import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CAIXA_FINANCING_DEBT,
  HISTORICAL_CAIXA_PAYMENTS,
  normalizeUserDebts,
} from '../src/data/caixaFinancingContract';
import {
  buildDebtInstallmentTransactions,
  reconcileDebtTransactions,
} from '../src/utils/debtTransactionSync';
import { Debt, Transaction } from '../src/types';

describe('Financiamento Imobiliário Caixa (SFH) - Dados Oficiais e Parcelas antes do Finly', () => {
  it('deve possuir exatamente 21 parcelas históricas registradas e auditadas', () => {
    expect(HISTORICAL_CAIXA_PAYMENTS).toHaveLength(21);

    // Verificar primeira parcela (Fevereiro/2025)
    const p1 = HISTORICAL_CAIXA_PAYMENTS[0];
    expect(p1.installmentNumber).toBe(1);
    expect(p1.date).toBe('2025-02-20');
    expect(p1.amount).toBe(710.76);
    expect(p1.amortizationAmount).toBe(104.25);
    expect(p1.interestAmount).toBe(594.60);
    expect(p1.insuranceAmount).toBe(27.67);
    expect(p1.correctionAmount).toBe(276.28);
    expect(p1.remainingBalanceAfter).toBe(152522.01);
    expect(p1.isHistorical).toBe(true);
    expect(p1.status).toBe('historical_paid');

    // Verificar parcela 19 (Agosto/2026)
    const p19 = HISTORICAL_CAIXA_PAYMENTS[18];
    expect(p19.installmentNumber).toBe(19);
    expect(p19.date).toBe('2026-08-21');
    expect(p19.amount).toBe(748.35);
    expect(p19.amortizationAmount).toBe(173.39);
    expect(p19.interestAmount).toBe(546.23);
    expect(p19.insuranceAmount).toBe(28.71);
    expect(p19.correctionAmount).toBe(266.20);
    expect(p19.remainingBalanceAfter).toBe(154059.00);

    // Verificar parcela 20 (Setembro/2026)
    const p20 = HISTORICAL_CAIXA_PAYMENTS[19];
    expect(p20.installmentNumber).toBe(20);
    expect(p20.date).toBe('2026-09-21');
    expect(p20.amount).toBe(749.60);
    expect(p20.insuranceAmount).toBe(28.76);
    expect(p20.isHistorical).toBe(true);
    expect(p20.status).toBe('historical_paid');

    // Verificar parcela 21 (Outubro/2026)
    const p21 = HISTORICAL_CAIXA_PAYMENTS[20];
    expect(p21.installmentNumber).toBe(21);
    expect(p21.date).toBe('2026-10-21');
    expect(p21.amount).toBe(750.88);
    expect(p21.remainingBalanceAfter).toBe(154480.01);
    expect(p21.isHistorical).toBe(true);
    expect(p21.status).toBe('historical_paid');
  });

  it('deve configurar o contrato Caixa com parâmetros oficiais corretos', () => {
    expect(DEFAULT_CAIXA_FINANCING_DEBT.totalAmount).toBe(152350.00);
    expect(DEFAULT_CAIXA_FINANCING_DEBT.totalInstallments).toBe(420);
    expect(DEFAULT_CAIXA_FINANCING_DEBT.paidInstallments).toBe(21);
    expect(DEFAULT_CAIXA_FINANCING_DEBT.historicalPaidCount).toBe(21);
    expect(DEFAULT_CAIXA_FINANCING_DEBT.interestRate).toBe(4.25);
    expect(DEFAULT_CAIXA_FINANCING_DEBT.amortizationSystem).toBe('PRICE');
    expect(DEFAULT_CAIXA_FINANCING_DEBT.indexer).toBe('TR');
    expect(DEFAULT_CAIXA_FINANCING_DEBT.dueDay).toBe(21);
    expect(DEFAULT_CAIXA_FINANCING_DEBT.nextDueDate).toBe('2026-11-21');
    expect(DEFAULT_CAIXA_FINANCING_DEBT.installmentAmount).toBe(752.04);
    expect(DEFAULT_CAIXA_FINANCING_DEBT.remainingAmount).toBe(154480.01);
    expect(DEFAULT_CAIXA_FINANCING_DEBT.payments).toHaveLength(21);
  });

  it('normalizeUserDebts deve atualizar dados legados do financiamento Caixa automaticamente', () => {
    const legacyDebts: Debt[] = [
      {
        id: 'debt-financiamento-caixa',
        title: 'Financiamento Imobiliário Caixa',
        creditor: 'Caixa Econômica Federal',
        totalAmount: 200000,
        remainingAmount: 180000,
        installmentAmount: 1500,
        totalInstallments: 360,
        paidInstallments: 10,
        dueDay: 15,
        nextDueDate: '2026-05-15',
        payments: [],
      },
    ];

    const normalized = normalizeUserDebts(legacyDebts);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].totalAmount).toBe(152350.00);
    expect(normalized[0].totalInstallments).toBe(420);
    expect(normalized[0].paidInstallments).toBe(21);
    expect(normalized[0].nextDueDate).toBe('2026-11-21');
    expect(normalized[0].installmentAmount).toBe(752.04);
    expect(normalized[0].remainingAmount).toBe(154480.01);
    expect(normalized[0].payments).toHaveLength(21);
  });

  it('buildDebtInstallmentTransactions deve iniciar a geração na Parcela 22 em Novembro/2026, sem parcelas passadas', () => {
    const txs = buildDebtInstallmentTransactions(
      DEFAULT_CAIXA_FINANCING_DEBT,
      12,
      'acc-demo-itau',
      new Date('2026-10-25T12:00:00Z')
    );

    expect(txs.length).toBeGreaterThan(0);
    // Primeira transação deve ser estritamente a Parcela 22
    const firstTx = txs[0];
    expect(firstTx.installments?.current).toBe(22);
    expect(firstTx.debtInstallmentNumber).toBe(22);
    expect(firstTx.date).toBe('2026-11-21');
    expect(firstTx.dueDate).toBe('2026-11-21');
    expect(firstTx.amount).toBe(752.04);
    expect(firstTx.description).toContain('22/420');

    // Nenhuma transação pode ter parcela <= 21
    const hasPast = txs.some(t => (t.debtInstallmentNumber ?? 0) <= 21);
    expect(hasPast).toBe(false);

    // Nenhuma transação pode ter data anterior a novembro/2026
    const hasDateBeforeNov = txs.some(t => t.date < '2026-11-01');
    expect(hasDateBeforeNov).toBe(false);
  });

  it('reconcileDebtTransactions deve descartar transações pendentes legadas com parcela <= 21', () => {
    const mockLegacyTxs: Transaction[] = [
      {
        id: 'tx-old-p20',
        description: 'Financiamento Imobiliário Caixa (20/360)',
        amount: 749.60,
        type: 'expense',
        date: '2026-09-21',
        status: 'pending',
        debtId: 'debt-financiamento-caixa',
        debtInstallmentNumber: 20,
        createdAt: '2026-09-21T00:00:00Z',
      },
      {
        id: 'tx-old-p21',
        description: 'Financiamento Imobiliário Caixa (21/360)',
        amount: 750.88,
        type: 'expense',
        date: '2026-10-21',
        status: 'pending',
        debtId: 'debt-financiamento-caixa',
        debtInstallmentNumber: 21,
        createdAt: '2026-10-21T00:00:00Z',
      },
    ];

    const reconciled = reconcileDebtTransactions(
      [DEFAULT_CAIXA_FINANCING_DEBT],
      mockLegacyTxs,
      [{ id: 'acc-demo-itau', name: 'Itaú', type: 'checking', balance: 5000, color: '#000', institution: 'itau' }]
    );

    // As transações pendentes de parcelas 20 e 21 devem ter sido removidas do extrato
    const p20Exists = reconciled.transactions.some(t => t.debtInstallmentNumber === 20);
    const p21Exists = reconciled.transactions.some(t => t.debtInstallmentNumber === 21);
    expect(p20Exists).toBe(false);
    expect(p21Exists).toBe(false);

    // E a primeira transação de dívida deve ser a parcela 22
    const p22 = reconciled.transactions.find(t => t.debtInstallmentNumber === 22);
    expect(p22).toBeDefined();
    expect(p22?.date).toBe('2026-11-21');
    expect(p22?.amount).toBe(752.04);
  });
});
