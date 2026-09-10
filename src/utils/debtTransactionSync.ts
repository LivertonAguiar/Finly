import type { Account, Debt, Transaction } from '../types';
import { getTodayString, round2 } from './formatters';
import { generateAmortizationSchedule } from './financingCalculations';

export interface DebtTransactionSyncOptions {
  horizonMonths?: number;
  now?: Date;
}

export const calculateInstallmentDueDate = (
  baseDueDateStr: string,
  defaultDueDay: number,
  offsetMonths: number
): string => {
  const base = new Date(`${baseDueDateStr.substring(0, 10)}T12:00:00`);
  if (Number.isNaN(base.getTime())) {
    return getTodayString();
  }

  const firstOfMonth = new Date(base.getFullYear(), base.getMonth() + offsetMonths, 1, 12);
  const daysInMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
  const targetDay = Math.min(defaultDueDay || base.getDate() || 10, daysInMonth);
  const finalDate = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), targetDay, 12);
  return finalDate.toISOString().substring(0, 10);
};

export const getDebtTransactionCategory = (debt: Debt) => {
  if (debt.contractType === 'real_estate') {
    return { categoryId: 'cat-desp-moradia', subcategoryId: 'sub-mor-financiamento-apto' };
  }
  if (debt.contractType === 'vehicle') {
    return { categoryId: 'cat-desp-transporte', subcategoryId: 'sub-trans-financiamento' };
  }
  return { categoryId: 'cat-desp-financeiro', subcategoryId: 'sub-fin-pagamento-dividas' };
};

/**
 * Determines if a debt is a structured financing (real_estate / vehicle with
 * interest rate) that should use the amortization schedule engine, or a simple
 * loan that uses the flat installmentAmount.
 */
const isStructuredFinancing = (debt: Debt): boolean => {
  if (!debt.interestRate || debt.interestRate <= 0) return false;
  if (debt.contractType && debt.contractType !== 'loan') return true;
  // Also treat as structured if amortization system is explicitly set and there are interest
  if (debt.amortizationSystem && debt.interestRate > 0) return true;
  return false;
};

export const buildDebtInstallmentTransactions = (
  debt: Debt,
  horizonMonths: number,
  accountId?: string,
  now = new Date()
): Transaction[] => {
  const { categoryId, subcategoryId } = getDebtTransactionCategory(debt);
  const startInstallment = (debt.paidInstallments || 0) + 1;
  const remainingCount = Math.max(0, debt.totalInstallments - (debt.paidInstallments || 0));
  const count = Math.min(horizonMonths, remainingCount);
  if (count <= 0) return [];

  const baseDueDateStr = debt.nextDueDate || getTodayString();
  const createdAt = now.toISOString();

  const baseTags = [
    debt.contractType === 'loan' || !debt.contractType ? 'divida' : 'financiamento',
    'parcela',
    ...(debt.creditor ? [debt.creditor.toLowerCase().replace(/\s+/g, '-')] : []),
  ];
  const baseNotes = debt.contractNumber ? `Contrato nº ${debt.contractNumber}` : undefined;

  // ── Structured Financing: use amortization schedule for real values ──
  if (isStructuredFinancing(debt)) {
    const schedule = generateAmortizationSchedule({
      principal: debt.remainingAmount,
      nominalAnnualRate: debt.interestRate!,
      remainingMonths: remainingCount,
      paidInstallments: debt.paidInstallments || 0,
      system: debt.amortizationSystem || 'PRICE',
      monthlyTR: debt.indexer === 'TR' ? (debt.indexerRate || 0) : 0,
      monthlyInsurance: debt.insuranceMonthly || 0,
      adminFee: debt.adminFeeMonthly || 0,
      startDate: new Date(`${baseDueDateStr.substring(0, 10)}T12:00:00`),
    });

    return schedule.schedule.slice(0, count).map((row, offset) => {
      const installmentNumber = startInstallment + offset;
      const dateStr = calculateInstallmentDueDate(baseDueDateStr, debt.dueDay, offset);

      return {
        id: `tx-debt-${debt.id}-${installmentNumber}-${now.getTime()}-${offset}`,
        description: `${debt.title} (${installmentNumber}/${debt.totalInstallments})`,
        amount: round2(row.totalInstallment),
        type: 'expense' as const,
        date: dateStr,
        dueDate: dateStr,
        categoryId,
        subcategoryId,
        accountId,
        status: 'pending' as const,
        recurring: false,
        installments: {
          current: installmentNumber,
          total: debt.totalInstallments,
          debtId: debt.id,
          debtInstallmentNumber: installmentNumber,
        },
        debtId: debt.id,
        debtInstallmentNumber: installmentNumber,
        tags: [...baseTags],
        notes: baseNotes,
        createdAt,
      };
    });
  }

  // ── Simple Loan: flat installmentAmount for all installments ──
  return Array.from({ length: count }, (_, offset) => {
    const installmentNumber = startInstallment + offset;
    const dateStr = calculateInstallmentDueDate(baseDueDateStr, debt.dueDay, offset);

    return {
      id: `tx-debt-${debt.id}-${installmentNumber}-${now.getTime()}-${offset}`,
      description: `${debt.title} (${installmentNumber}/${debt.totalInstallments})`,
      amount: round2(debt.installmentAmount),
      type: 'expense' as const,
      date: dateStr,
      dueDate: dateStr,
      categoryId,
      subcategoryId,
      accountId,
      status: 'pending' as const,
      recurring: false,
      installments: {
        current: installmentNumber,
        total: debt.totalInstallments,
        debtId: debt.id,
        debtInstallmentNumber: installmentNumber,
      },
      debtId: debt.id,
      debtInstallmentNumber: installmentNumber,
      tags: [...baseTags],
      notes: baseNotes,
      createdAt,
    };
  });
};

export const reconcileDebtTransactions = (
  debts: Debt[],
  transactions: Transaction[],
  accounts: Account[],
  options: DebtTransactionSyncOptions = {}
) => {
  const horizonMonths = Math.max(1, options.horizonMonths || 12);
  const now = options.now || new Date();
  const normalizedTransactions = transactions.map(transaction => ({
    ...transaction,
    debtId: transaction.debtId || transaction.installments?.debtId,
    debtInstallmentNumber:
      transaction.debtInstallmentNumber || transaction.installments?.debtInstallmentNumber,
  }));
  const existingKeys = new Set(
    normalizedTransactions
      .filter(transaction => transaction.debtId && transaction.debtInstallmentNumber)
      .map(transaction => `${transaction.debtId}:${transaction.debtInstallmentNumber}`)
  );
  const additions: Transaction[] = [];

  const normalizedDebts = debts.map(debt => {
    if (debt.syncToTransactions === false) return debt;

    const normalizedDebt = debt.syncToTransactions === true
      ? debt
      : { ...debt, syncToTransactions: true };
    const remainingCount = Math.max(0, debt.totalInstallments - (debt.paidInstallments || 0));
    if (remainingCount === 0) return normalizedDebt;

    const candidates = buildDebtInstallmentTransactions(
      normalizedDebt,
      Math.min(horizonMonths, remainingCount),
      normalizedDebt.defaultAccountId || accounts[0]?.id,
      now
    );

    candidates.forEach(transaction => {
      const key = `${transaction.debtId}:${transaction.debtInstallmentNumber}`;
      if (existingKeys.has(key)) return;
      existingKeys.add(key);
      additions.push(transaction);
    });
    return normalizedDebt;
  });

  return {
    debts: normalizedDebts,
    transactions: additions.length > 0 ? [...additions, ...normalizedTransactions] : normalizedTransactions,
    createdCount: additions.length,
  };
};
