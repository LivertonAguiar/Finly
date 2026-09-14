const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Carregar .env se existir
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
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

const HISTORICAL_CAIXA_PAYMENTS = [
  { id: 'pay-caixa-p1', installmentNumber: 1, date: '2025-02-20', amount: 710.76, amortizationAmount: 104.25, interestAmount: 594.60, insuranceAmount: 27.67, adminFeeAmount: 0.00, correctionAmount: 276.28, remainingBalanceAfter: 152522.01, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p2', installmentNumber: 2, date: '2025-03-20', amount: 727.48, amortizationAmount: 158.89, interestAmount: 540.88, insuranceAmount: 27.71, adminFeeAmount: 0.00, correctionAmount: 201.89, remainingBalanceAfter: 152565.02, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p3', installmentNumber: 3, date: '2025-04-20', amount: 728.70, amortizationAmount: 159.63, interestAmount: 540.91, insuranceAmount: 28.16, adminFeeAmount: 0.00, correctionAmount: 166.58, remainingBalanceAfter: 152571.97, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p4', installmentNumber: 4, date: '2025-05-20', amount: 729.94, amortizationAmount: 160.46, interestAmount: 541.26, insuranceAmount: 28.19, adminFeeAmount: 0.00, correctionAmount: 257.70, remainingBalanceAfter: 152669.22, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p5', installmentNumber: 5, date: '2025-06-20', amount: 731.18, amortizationAmount: 161.30, interestAmount: 541.62, insuranceAmount: 28.24, adminFeeAmount: 0.00, correctionAmount: 261.32, remainingBalanceAfter: 152769.25, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p6', installmentNumber: 6, date: '2025-07-20', amount: 732.33, amortizationAmount: 162.15, interestAmount: 541.97, insuranceAmount: 28.26, adminFeeAmount: 0.00, correctionAmount: 259.57, remainingBalanceAfter: 152866.67, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p7', installmentNumber: 7, date: '2025-08-20', amount: 733.68, amortizationAmount: 163.01, interestAmount: 542.34, insuranceAmount: 28.31, adminFeeAmount: 0.00, correctionAmount: 268.73, remainingBalanceAfter: 152972.39, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p8', installmentNumber: 8, date: '2025-09-20', amount: 734.93, amortizationAmount: 163.87, interestAmount: 542.70, insuranceAmount: 28.34, adminFeeAmount: 0.00, correctionAmount: 263.39, remainingBalanceAfter: 153071.92, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p9', installmentNumber: 9, date: '2025-10-20', amount: 736.17, amortizationAmount: 164.74, interestAmount: 543.06, insuranceAmount: 28.37, adminFeeAmount: 0.00, correctionAmount: 266.68, remainingBalanceAfter: 153173.87, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p10', installmentNumber: 10, date: '2025-11-20', amount: 737.47, amortizationAmount: 165.61, interestAmount: 543.43, insuranceAmount: 28.40, adminFeeAmount: 0.00, correctionAmount: 269.22, remainingBalanceAfter: 153277.48, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p11', installmentNumber: 11, date: '2025-12-20', amount: 738.56, amortizationAmount: 166.47, interestAmount: 543.73, insuranceAmount: 28.44, adminFeeAmount: 0.00, correctionAmount: 250.45, remainingBalanceAfter: 153361.47, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p12', installmentNumber: 12, date: '2026-01-20', amount: 739.94, amortizationAmount: 167.35, interestAmount: 544.08, insuranceAmount: 28.45, adminFeeAmount: 0.00, correctionAmount: 267.17, remainingBalanceAfter: 153461.29, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p13', installmentNumber: 13, date: '2026-02-20', amount: 741.20, amortizationAmount: 168.22, interestAmount: 544.44, insuranceAmount: 28.53, adminFeeAmount: 0.00, correctionAmount: 263.63, remainingBalanceAfter: 153556.71, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p14', installmentNumber: 14, date: '2026-03-21', amount: 742.07, amortizationAmount: 150.82, interestAmount: 562.70, insuranceAmount: 28.55, adminFeeAmount: 0.00, correctionAmount: 197.87, remainingBalanceAfter: 153603.77, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p15', installmentNumber: 15, date: '2026-04-21', amount: 744.22, amortizationAmount: 169.80, interestAmount: 544.94, insuranceAmount: 28.58, adminFeeAmount: 0.00, correctionAmount: 266.53, remainingBalanceAfter: 153700.50, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p16', installmentNumber: 16, date: '2026-05-21', amount: 744.55, amortizationAmount: 170.69, interestAmount: 545.25, insuranceAmount: 28.61, adminFeeAmount: 0.00, correctionAmount: 258.05, remainingBalanceAfter: 153787.87, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p17', installmentNumber: 17, date: '2026-06-21', amount: 745.78, amortizationAmount: 171.58, interestAmount: 545.57, insuranceAmount: 28.63, adminFeeAmount: 0.00, correctionAmount: 259.41, remainingBalanceAfter: 153875.70, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p18', installmentNumber: 18, date: '2026-07-21', amount: 747.05, amortizationAmount: 172.48, interestAmount: 545.90, insuranceAmount: 28.67, adminFeeAmount: 0.00, correctionAmount: 262.96, remainingBalanceAfter: 153966.19, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p19', installmentNumber: 19, date: '2026-08-21', amount: 748.35, amortizationAmount: 173.39, interestAmount: 546.23, insuranceAmount: 28.71, adminFeeAmount: 0.00, correctionAmount: 266.20, remainingBalanceAfter: 154059.00, isHistorical: true, status: 'historical_paid' },
  { id: 'pay-caixa-p20', installmentNumber: 20, date: '2026-09-21', amount: 749.60, amortizationAmount: 174.55, interestAmount: 546.29, insuranceAmount: 28.76, adminFeeAmount: 0.00, correctionAmount: 186.25, remainingBalanceAfter: 154070.70, isHistorical: true, status: 'historical_paid' },
];

const DEFAULT_CAIXA_DEBT = {
  id: 'debt-financiamento-caixa',
  title: 'Financiamento Imobiliário Caixa',
  creditor: 'Caixa Econômica Federal',
  contractType: 'real_estate',
  contractNumber: 'SFH-17012025-001',
  totalAmount: 152350.00,
  remainingAmount: 154070.70,
  interestRate: 4.25,
  effectiveInterestRate: 4.3338,
  installmentAmount: 750.88,
  totalInstallments: 420,
  paidInstallments: 20,
  historicalPaidCount: 20,
  dueDay: 21,
  nextDueDate: '2026-10-21',
  amortizationSystem: 'PRICE',
  indexer: 'TR',
  indexerRate: 0.1708,
  insuranceMonthly: 28.76,
  adminFeeMonthly: 0.00,
  defaultAccountId: 'acc-carteira-padrao',
  syncToTransactions: true,
  notes: 'Contrato Caixa SFH assinado em 17/01/2025 • Avaliação R$ 213.450,00 • FGTS R$ 2.899,00 • Parcelas 1 a 20 registradas como pagas antes do início do Finly.',
  payments: HISTORICAL_CAIXA_PAYMENTS,
};

const targetFiles = [
  path.join(__dirname, '..', 'server', 'data', 'stores', 'usr-default-liverton.json'),
  path.join(__dirname, '..', 'server', 'data', 'stores', 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b.json'),
];

targetFiles.forEach(f => {
  if (fs.existsSync(f)) {
    const raw = fs.readFileSync(f, 'utf8');
    const store = JSON.parse(raw);
    
    // Atualizar ou inserir a dívida
    let found = false;
    store.debts = (store.debts || []).map(d => {
      if (d.id === 'debt-financiamento-caixa' || (d.contractType === 'real_estate' && d.creditor && d.creditor.includes('Caixa'))) {
        found = true;
        return { ...d, ...DEFAULT_CAIXA_DEBT };
      }
      return d;
    });
    if (!found) {
      store.debts.push(DEFAULT_CAIXA_DEBT);
    }

    // Garantir que nenhuma transação pendente <= 20 exista
    store.transactions = (store.transactions || []).filter(t => {
      if (t.debtId === 'debt-financiamento-caixa' || (t.installments && t.installments.debtId === 'debt-financiamento-caixa')) {
        const instNum = t.debtInstallmentNumber || (t.installments && t.installments.debtInstallmentNumber) || (t.installments && t.installments.current);
        if (instNum <= 20 || (t.date && t.date < '2026-10-01')) {
          return false;
        }
      }
      return true;
    });

    fs.writeFileSync(f, JSON.stringify(store, null, 2), 'utf8');
    console.log(`[OK] Financiamento Caixa injetado com sucesso em ${path.basename(f)}`);
  }
});

// Upsert no Supabase se disponível
async function syncSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.log('[INFO] Supabase Service Role Key não configurada. Sincronização direta no Postgres pulada.');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const userId = 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b';
    
    const debtRow = {
      id: DEFAULT_CAIXA_DEBT.id,
      user_id: userId,
      title: DEFAULT_CAIXA_DEBT.title,
      creditor: DEFAULT_CAIXA_DEBT.creditor,
      total_amount: DEFAULT_CAIXA_DEBT.totalAmount,
      remaining_amount: DEFAULT_CAIXA_DEBT.remainingAmount,
      installment_amount: DEFAULT_CAIXA_DEBT.installmentAmount,
      total_installments: DEFAULT_CAIXA_DEBT.totalInstallments,
      paid_installments: DEFAULT_CAIXA_DEBT.paidInstallments,
      due_day: DEFAULT_CAIXA_DEBT.dueDay,
      next_due_date: DEFAULT_CAIXA_DEBT.nextDueDate,
      interest_rate: DEFAULT_CAIXA_DEBT.interestRate,
      contract_type: DEFAULT_CAIXA_DEBT.contractType,
      amortization_system: DEFAULT_CAIXA_DEBT.amortizationSystem,
      indexer: DEFAULT_CAIXA_DEBT.indexer,
      indexer_rate: DEFAULT_CAIXA_DEBT.indexerRate,
      insurance_monthly: DEFAULT_CAIXA_DEBT.insuranceMonthly,
      admin_fee_monthly: DEFAULT_CAIXA_DEBT.adminFeeMonthly,
      contract_number: DEFAULT_CAIXA_DEBT.contractNumber,
      sync_to_transactions: DEFAULT_CAIXA_DEBT.syncToTransactions,
      notes: DEFAULT_CAIXA_DEBT.notes,
      payments: DEFAULT_CAIXA_DEBT.payments,
    };

    const { error } = await supabase.from('debts').upsert([debtRow]);
    if (error) {
      console.warn('[WARN] Erro ao sincronizar debts no Supabase:', error.message);
    } else {
      console.log('[OK] Dívida Caixa sincronizada com sucesso no Supabase para o usuário Liverton!');
    }
  } catch (err) {
    console.warn('[WARN] Falha ao conectar ao Supabase:', err.message);
  }
}

syncSupabase().then(() => {
  console.log('[FIM] Script de injeção concluído.');
});
