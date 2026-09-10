/**
 * Finly Financing Engine & Amortization Calculations
 * Motor matemático de evolução de dívidas e financiamentos imobiliários (Caixa / SFH / SFI):
 * - Tabela Price (TP) e SAC (Sistema de Amortização Constante)
 * - Correção monetária por TR diária ou IPCA
 * - Composição de encargos: Amortização + Juros + Seguros (MIP/DFI) + Taxas
 * - Simulador de Amortização Extraordinária (Redução de Prazo vs Redução de Parcela)
 */

export interface FinancingInstallmentRow {
  installmentNumber: number;
  dueDate: string;
  initialBalance: number;
  correctedBalance: number;
  trCorrection: number;
  interestAmount: number;
  amortizationAmount: number;
  insuranceAmount: number;
  adminFeeAmount: number;
  totalInstallment: number;
  finalBalance: number;
}

export interface AmortizationScheduleResult {
  schedule: FinancingInstallmentRow[];
  totalPaid: number;
  totalInterest: number;
  totalAmortization: number;
  totalInsurance: number;
  totalCorrection: number;
  estimatedEndDate: string;
}

export interface ExtraAmortizationSimulation {
  // Cenário 1: Redução de Prazo
  reduceTerm: {
    newRemainingMonths: number;
    monthsSaved: number;
    yearsSaved: number;
    originalTotalInterest: number;
    newTotalInterest: number;
    interestSaved: number;
    newEstimatedEndDate: string;
    installmentAmount: number; // permanece a mesma
  };
  // Cenário 2: Redução de Parcela
  reduceInstallment: {
    remainingMonths: number; // permanece o mesmo
    originalInstallment: number;
    newInstallment: number;
    monthlyReduction: number;
    originalTotalInterest: number;
    newTotalInterest: number;
    interestSaved: number;
  };
}

/**
 * Converte taxa de juros nominal anual (%) para taxa mensal decimal
 * Ex: 4.25% a.a. nominal -> 4.25 / 12 = 0.354167% a.m. (0.00354167)
 */
export function getMonthlyInterestRate(nominalAnnualRate: number, isEffective = false): number {
  if (!nominalAnnualRate || nominalAnnualRate <= 0) return 0;
  if (isEffective) {
    // Efetiva: (1 + i_ano)^(1/12) - 1
    return Math.pow(1 + nominalAnnualRate / 100, 1 / 12) - 1;
  }
  // Nominal contratual padrão brasileiro (Caixa SFH): i_ano / 12
  return nominalAnnualRate / 100 / 12;
}

/**
 * Calcula a prestação base da Tabela Price (PMT)
 */
export function calculatePricePMT(principal: number, monthlyRate: number, totalMonths: number): number {
  if (principal <= 0 || totalMonths <= 0) return 0;
  if (monthlyRate <= 0) return principal / totalMonths;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

/**
 * Gera a tabela completa de evolução da dívida (Tabela Price ou SAC)
 */
export function generateAmortizationSchedule(options: {
  principal: number; // Saldo devedor atual
  nominalAnnualRate: number; // Ex: 4.25%
  remainingMonths: number; // Ex: 401
  paidInstallments?: number; // Ex: 19
  system?: 'PRICE' | 'SAC';
  monthlyTR?: number; // Ex: 0.1708 (% a.m.)
  monthlyInsurance?: number; // Ex: 28.76
  adminFee?: number; // Ex: 0.00
  startDate?: Date; // Data da próxima parcela
}): AmortizationScheduleResult {
  const {
    principal,
    nominalAnnualRate,
    remainingMonths,
    paidInstallments = 0,
    system = 'PRICE',
    monthlyTR = 0,
    monthlyInsurance = 0,
    adminFee = 0,
    startDate = new Date(),
  } = options;

  const schedule: FinancingInstallmentRow[] = [];
  const iMonthly = getMonthlyInterestRate(nominalAnnualRate);
  const trMonthlyDecimal = Math.max(0, monthlyTR) / 100;

  let currentBalance = Math.max(0, principal);
  let totalPaid = 0;
  let totalInterest = 0;
  let totalAmortization = 0;
  let totalInsurance = 0;
  let totalCorrection = 0;

  // No Price, a prestação base de amortização + juros
  const basePMT = system === 'PRICE' ? calculatePricePMT(currentBalance, iMonthly, remainingMonths) : 0;
  // No SAC, a amortização base é constante
  const baseAmortization = system === 'SAC' ? currentBalance / remainingMonths : 0;

  for (let m = 1; m <= remainingMonths; m++) {
    if (currentBalance <= 0) break;

    const installmentNumber = paidInstallments + m;
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (m - 1));
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // 1. Correção monetária pela TR do mês
    const trCorrection = currentBalance * trMonthlyDecimal;
    const correctedBalance = currentBalance + trCorrection;
    totalCorrection += trCorrection;

    // 2. Juros do mês sobre o saldo corrigido
    const interest = correctedBalance * iMonthly;
    totalInterest += interest;

    // 3. Amortização real
    let amortization = 0;
    if (system === 'PRICE') {
      amortization = Math.max(0, basePMT - interest);
    } else {
      amortization = Math.min(correctedBalance, baseAmortization);
    }

    // Se a amortização superar o saldo, quita
    if (amortization > correctedBalance) {
      amortization = correctedBalance;
    }
    totalAmortization += amortization;

    // 4. Saldo final do mês
    const finalBalance = Math.max(0, correctedBalance - amortization);

    // 5. Total da parcela a pagar
    const installmentTotal = amortization + interest + monthlyInsurance + adminFee;
    totalPaid += installmentTotal;
    totalInsurance += monthlyInsurance;

    schedule.push({
      installmentNumber,
      dueDate: dueDateStr,
      initialBalance: Math.round(currentBalance * 100) / 100,
      correctedBalance: Math.round(correctedBalance * 100) / 100,
      trCorrection: Math.round(trCorrection * 100) / 100,
      interestAmount: Math.round(interest * 100) / 100,
      amortizationAmount: Math.round(amortization * 100) / 100,
      insuranceAmount: Math.round(monthlyInsurance * 100) / 100,
      adminFeeAmount: Math.round(adminFee * 100) / 100,
      totalInstallment: Math.round(installmentTotal * 100) / 100,
      finalBalance: Math.round(finalBalance * 100) / 100,
    });

    currentBalance = finalBalance;
  }

  const lastDate = schedule.length > 0 ? schedule[schedule.length - 1].dueDate : startDate.toISOString().split('T')[0];

  return {
    schedule,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmortization: Math.round(totalAmortization * 100) / 100,
    totalInsurance: Math.round(totalInsurance * 100) / 100,
    totalCorrection: Math.round(totalCorrection * 100) / 100,
    estimatedEndDate: lastDate,
  };
}

/**
 * Simula os dois cenários da Caixa de Amortização Extraordinária:
 * 1. Reduzir Prazo (diminui quantidade de parcelas no final)
 * 2. Reduzir Parcela (diminui prestação mensal mantendo os meses restantes)
 */
export function simulateExtraordinaryAmortization(options: {
  currentBalance: number; // Saldo devedor atual (ex: 154.207,98)
  nominalAnnualRate: number; // 4.25%
  remainingMonths: number; // 401 meses
  system?: 'PRICE' | 'SAC';
  monthlyTR?: number;
  monthlyInsurance?: number;
  adminFee?: number;
  extraLumpSum: number; // Aporte único imediato (ex: 10.000)
  extraMonthlyPayment?: number; // Aporte mensal extra recorrente (ex: 500/mês)
}): ExtraAmortizationSimulation {
  const {
    currentBalance,
    nominalAnnualRate,
    remainingMonths,
    system = 'PRICE',
    monthlyTR = 0,
    monthlyInsurance = 0,
    adminFee = 0,
    extraLumpSum,
    extraMonthlyPayment = 0,
  } = options;

  // 1. Cronograma Original sem amortizações extras
  const original = generateAmortizationSchedule({
    principal: currentBalance,
    nominalAnnualRate,
    remainingMonths,
    system,
    monthlyTR,
    monthlyInsurance,
    adminFee,
  });

  const originalTotalInterest = original.totalInterest;
  const originalInstallment = original.schedule.length > 0 ? original.schedule[0].totalInstallment : 0;

  // Saldo após aporte único imediato
  const balanceAfterLumpSum = Math.max(0, currentBalance - Math.max(0, extraLumpSum));

  // -------------------------------------------------------------
  // CENÁRIO A: REDUZIR PRAZO (mantém prestação base, quita mais rápido)
  // -------------------------------------------------------------
  const iMonthly = getMonthlyInterestRate(nominalAnnualRate);
  const trMonthlyDecimal = Math.max(0, monthlyTR) / 100;
  const basePMT = system === 'PRICE' ? calculatePricePMT(currentBalance, iMonthly, remainingMonths) : 0;
  const standardSACAmort = system === 'SAC' ? currentBalance / remainingMonths : 0;

  let simBalance = balanceAfterLumpSum;
  let newMonthsCount = 0;
  let newTotalInterestTerm = 0;
  const recurringExtra = Math.max(0, extraMonthlyPayment);

  while (simBalance > 0 && newMonthsCount < remainingMonths) {
    newMonthsCount++;
    const trCorrection = simBalance * trMonthlyDecimal;
    const corrected = simBalance + trCorrection;
    const interest = corrected * iMonthly;
    newTotalInterestTerm += interest;

    let amort = 0;
    if (system === 'PRICE') {
      amort = Math.max(0, basePMT - interest) + recurringExtra;
    } else {
      amort = standardSACAmort + recurringExtra;
    }

    if (amort > corrected) {
      amort = corrected;
    }

    simBalance = Math.max(0, corrected - amort);
  }

  const monthsSaved = Math.max(0, remainingMonths - newMonthsCount);
  const yearsSaved = Math.round((monthsSaved / 12) * 10) / 10;
  const interestSavedTerm = Math.max(0, originalTotalInterest - newTotalInterestTerm);

  const termEndDate = new Date();
  termEndDate.setMonth(termEndDate.getMonth() + newMonthsCount);

  // -------------------------------------------------------------
  // CENÁRIO B: REDUZIR PARCELA (novo PMT sobre o saldo menor)
  // -------------------------------------------------------------
  const newScheduleParcel = generateAmortizationSchedule({
    principal: balanceAfterLumpSum,
    nominalAnnualRate,
    remainingMonths,
    system,
    monthlyTR,
    monthlyInsurance,
    adminFee,
  });

  const newInstallment = newScheduleParcel.schedule.length > 0 ? newScheduleParcel.schedule[0].totalInstallment : 0;
  const monthlyReduction = Math.max(0, originalInstallment - newInstallment);
  const interestSavedInstallment = Math.max(0, originalTotalInterest - newScheduleParcel.totalInterest);

  return {
    reduceTerm: {
      newRemainingMonths: newMonthsCount,
      monthsSaved,
      yearsSaved,
      originalTotalInterest: Math.round(originalTotalInterest * 100) / 100,
      newTotalInterest: Math.round(newTotalInterestTerm * 100) / 100,
      interestSaved: Math.round(interestSavedTerm * 100) / 100,
      newEstimatedEndDate: termEndDate.toISOString().split('T')[0],
      installmentAmount: Math.round(originalInstallment * 100) / 100,
    },
    reduceInstallment: {
      remainingMonths,
      originalInstallment: Math.round(originalInstallment * 100) / 100,
      newInstallment: Math.round(newInstallment * 100) / 100,
      monthlyReduction: Math.round(monthlyReduction * 100) / 100,
      originalTotalInterest: Math.round(originalTotalInterest * 100) / 100,
      newTotalInterest: Math.round(newScheduleParcel.totalInterest * 100) / 100,
      interestSaved: Math.round(interestSavedInstallment * 100) / 100,
    },
  };
}
