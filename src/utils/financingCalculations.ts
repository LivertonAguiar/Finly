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
  isEstimated?: boolean;
  /** Variação líquida do saldo devedor no mês: trCorrection - amortizationAmount (> 0 indica que a dívida subiu nominalmente) */
  netBalanceVariation: number;
  /** Eficiência da parcela: percentual do total pago que efetivamente reduziu o saldo devedor (0 a 100%) */
  installmentEfficiency: number;
  /** Indica se neste mês a correção monetária (TR/IPCA) foi maior que a amortização, fazendo a dívida crescer */
  isBalanceIncreasing: boolean;
}

export interface AmortizationScheduleResult {
  schedule: FinancingInstallmentRow[];
  totalPaid: number;
  totalInterest: number;
  totalAmortization: number;
  totalInsurance: number;
  totalCorrection: number;
  estimatedEndDate: string;
  hasNegativeAmortization?: boolean;
  /** Eficiência da primeira parcela projetada (% amortização) */
  firstInstallmentEfficiency: number;
  /** Variação líquida do saldo na primeira parcela (R$) */
  firstMonthBalanceVariation: number;
  /** Eficiência média de todas as parcelas no período (% amortização) */
  averageEfficiency: number;
  /** Quantidade de meses em que a dívida aumentou nominalmente por conta do indexador superando a amortização */
  monthsWithBalanceIncrease: number;
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
 * Regra oficial da Caixa Econômica Federal / SFH:
 * 1. Atualização monetária do saldo anterior pelo indexador (TR ou IPCA)
 * 2. Cálculo dos juros contratuais sobre o saldo devedor corrigido
 * 3. Amortização real calculada sobre o saldo corrigido e prazo remanescente
 * 4. Quitação exata no término do prazo (saldo final = 0)
 */
export function generateAmortizationSchedule(options: {
  principal: number; // Saldo devedor atual
  nominalAnnualRate: number; // Ex: 4.25%
  remainingMonths: number; // Ex: 401
  paidInstallments?: number; // Ex: 19
  system?: 'PRICE' | 'SAC';
  indexer?: 'TR' | 'IPCA' | 'FIXED';
  monthlyIndexerRate?: number; // Taxa mensal do indexador (% a.m.)
  monthlyTR?: number; // Compatibilidade retroativa (% a.m.)
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
    indexer,
    monthlyIndexerRate,
    monthlyTR = 0,
    monthlyInsurance = 0,
    adminFee = 0,
    startDate = new Date(),
  } = options;

  const schedule: FinancingInstallmentRow[] = [];
  const iMonthly = getMonthlyInterestRate(nominalAnnualRate);

  // Determinar taxa do indexador conforme tipo de contrato:
  // - FIXED (prefixado): taxa estritamente 0% (nunca aplica TR)
  // - TR ou IPCA: taxa mensal aplicável
  // - Omissão: fallback retroativo para monthlyTR ou monthlyIndexerRate
  let effectiveIndexerRate = 0;
  if (indexer === 'FIXED') {
    effectiveIndexerRate = 0;
  } else if (indexer === 'TR' || indexer === 'IPCA') {
    effectiveIndexerRate = monthlyIndexerRate !== undefined ? monthlyIndexerRate : monthlyTR;
  } else {
    effectiveIndexerRate = monthlyIndexerRate !== undefined ? monthlyIndexerRate : monthlyTR;
  }

  const indexerMonthlyDecimal = Math.max(0, effectiveIndexerRate) / 100;

  let currentBalance = Math.max(0, principal);
  let totalPaid = 0;
  let totalInterest = 0;
  let totalAmortization = 0;
  let totalInsurance = 0;
  let totalCorrection = 0;
  let hasNegativeAmortization = false;

  for (let m = 1; m <= remainingMonths; m++) {
    if (currentBalance <= 0) break;

    const installmentNumber = paidInstallments + m;
    const remainingTerm = remainingMonths - m + 1; // k meses restantes incluindo este

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (m - 1));
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // 1. Atualização monetária do saldo anterior pelo indexador contratado
    const trCorrection = currentBalance * indexerMonthlyDecimal;
    const correctedBalance = currentBalance + trCorrection;
    totalCorrection += trCorrection;

    // 2. Juros contratuais do mês sobre o saldo corrigido
    const interest = correctedBalance * iMonthly;
    totalInterest += interest;

    // 3. Seguro mensal indexado pela TR (conforme apólice Caixa MIP/DFI)
    const currentInsurance = monthlyInsurance > 0 && indexerMonthlyDecimal > 0
      ? monthlyInsurance * Math.pow(1 + indexerMonthlyDecimal, m - 1)
      : monthlyInsurance;

    // 4. Amortização e prestação conforme sistema contratado
    let amortization = 0;
    let installmentTotal = 0;

    if (remainingTerm <= 1) {
      // No último mês, a amortização quita exatamente o saldo devedor corrigido
      amortization = correctedBalance;
      installmentTotal = amortization + interest + currentInsurance + adminFee;
    } else if (system === 'SAC') {
      // SAC: Quota de amortização sobre o saldo corrigido dividido pelo prazo restante
      amortization = correctedBalance / remainingTerm;
      installmentTotal = amortization + interest + currentInsurance + adminFee;
    } else {
      // PRICE: Recálculo da prestação base sobre o saldo corrigido para o prazo restante
      if (iMonthly > 0) {
        const pmtBase = calculatePricePMT(correctedBalance, iMonthly, remainingTerm);
        amortization = pmtBase - interest;
        installmentTotal = amortization + interest + currentInsurance + adminFee;
      } else {
        amortization = correctedBalance / remainingTerm;
        installmentTotal = amortization + interest + currentInsurance + adminFee;
      }
    }

    // Sinalizar e proteger contra amortização negativa
    if (amortization < 0) {
      hasNegativeAmortization = true;
      amortization = 0;
    } else if (amortization > correctedBalance) {
      amortization = correctedBalance;
      installmentTotal = amortization + interest + currentInsurance + adminFee;
    }

    totalAmortization += amortization;

    // 5. Saldo devedor final do mês: saldo corrigido menos amortização
    const finalBalance = Math.max(0, correctedBalance - amortization);

    // Métricas analíticas ("Amigo do Pai Rico" / Auditoria Caixa)
    const netBalanceVariation = Math.round((trCorrection - amortization) * 100) / 100;
    const isBalanceIncreasing = netBalanceVariation > 0;
    const installmentEfficiency = installmentTotal > 0
      ? Math.round((amortization / installmentTotal) * 10000) / 100
      : 0;

    totalPaid += installmentTotal;
    totalInsurance += currentInsurance;

    schedule.push({
      installmentNumber,
      dueDate: dueDateStr,
      initialBalance: Math.round(currentBalance * 100) / 100,
      correctedBalance: Math.round(correctedBalance * 100) / 100,
      trCorrection: Math.round(trCorrection * 100) / 100,
      interestAmount: Math.round(interest * 100) / 100,
      amortizationAmount: Math.round(amortization * 100) / 100,
      insuranceAmount: Math.round(currentInsurance * 100) / 100,
      adminFeeAmount: Math.round(adminFee * 100) / 100,
      totalInstallment: Math.round(installmentTotal * 100) / 100,
      finalBalance: Math.round(finalBalance * 100) / 100,
      isEstimated: true,
      netBalanceVariation,
      installmentEfficiency,
      isBalanceIncreasing,
    });

    currentBalance = finalBalance;
  }

  const lastDate = schedule.length > 0 ? schedule[schedule.length - 1].dueDate : startDate.toISOString().split('T')[0];
  const firstRow = schedule[0];
  const monthsWithBalanceIncrease = schedule.filter(r => r.isBalanceIncreasing).length;
  const totalEfficiencySum = schedule.reduce((acc, r) => acc + r.installmentEfficiency, 0);
  const averageEfficiency = schedule.length > 0
    ? Math.round((totalEfficiencySum / schedule.length) * 100) / 100
    : 0;

  return {
    schedule,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmortization: Math.round(totalAmortization * 100) / 100,
    totalInsurance: Math.round(totalInsurance * 100) / 100,
    totalCorrection: Math.round(totalCorrection * 100) / 100,
    estimatedEndDate: lastDate,
    hasNegativeAmortization,
    firstInstallmentEfficiency: firstRow ? firstRow.installmentEfficiency : 0,
    firstMonthBalanceVariation: firstRow ? firstRow.netBalanceVariation : 0,
    averageEfficiency,
    monthsWithBalanceIncrease,
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
  indexer?: 'TR' | 'IPCA' | 'FIXED';
  monthlyIndexerRate?: number;
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
    indexer,
    monthlyIndexerRate,
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
    indexer,
    monthlyIndexerRate,
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
  let effectiveIndexerRate = 0;
  if (indexer === 'FIXED') {
    effectiveIndexerRate = 0;
  } else if (indexer === 'TR' || indexer === 'IPCA') {
    effectiveIndexerRate = monthlyIndexerRate !== undefined ? monthlyIndexerRate : monthlyTR;
  } else {
    effectiveIndexerRate = monthlyIndexerRate !== undefined ? monthlyIndexerRate : monthlyTR;
  }
  const indexerMonthlyDecimal = Math.max(0, effectiveIndexerRate) / 100;
  const baseOriginalPMT = original.schedule.length > 0
    ? original.schedule[0].amortizationAmount + original.schedule[0].interestAmount
    : 0;
  const recurringExtra = Math.max(0, extraMonthlyPayment);

  let simBalance = balanceAfterLumpSum;
  let newMonthsCount = 0;
  let newTotalInterestTerm = 0;

  while (simBalance > 0.01 && newMonthsCount < remainingMonths) {
    newMonthsCount++;
    const trCorrection = simBalance * indexerMonthlyDecimal;
    const corrected = simBalance + trCorrection;
    const interest = corrected * iMonthly;
    newTotalInterestTerm += interest;

    let amort = 0;
    if (system === 'PRICE') {
      amort = Math.max(0, baseOriginalPMT - interest) + recurringExtra;
    } else {
      const remainingTerm = Math.max(1, remainingMonths - newMonthsCount + 1);
      amort = (corrected / remainingTerm) + recurringExtra;
    }

    if (amort >= corrected) {
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
    indexer,
    monthlyIndexerRate,
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
