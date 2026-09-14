const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Carregar .env
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

const round2 = n => Math.round(n * 100) / 100;

function getMonthlyRate(nominalAnnualRate) {
  return nominalAnnualRate / 100 / 12;
}

function calculatePricePMT(principal, monthlyRate, totalMonths) {
  if (principal <= 0 || totalMonths <= 0) return 0;
  if (monthlyRate <= 0) return principal / totalMonths;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

// Cálculo das 12 parcelas a partir da parcela 21 (Outubro/2026)
function generate12Installments() {
  const principal = 154070.70; // Saldo devedor após a parcela 20 paga em Setembro
  const nominalAnnualRate = 4.25;
  const totalMonths = 400; // 420 - 20 pagas
  const baseSeptAmount = 749.60;
  const monthlyTR = 0.1708 / 100;
  const iMonthly = getMonthlyRate(nominalAnnualRate);
  const baseInsurance = 28.76;
  const baseDueDate = new Date('2026-10-21T12:00:00Z');

  let currentBalance = principal;
  const installments = [];

  for (let offset = 0; offset < 12; offset++) {
    const installmentNumber = 21 + offset;
    const monthIndex = offset + 1; // 1 para outubro, 2 para novembro, etc.
    
    // Data de vencimento
    const d = new Date(baseDueDate);
    d.setUTCMonth(d.getUTCMonth() + offset);
    const dateStr = d.toISOString().split('T')[0];

    // Prestação evoluindo mensalmente pela TR contratual sobre setembro (749.60)
    const totalInstallment = round2(baseSeptAmount * Math.pow(1 + monthlyTR, monthIndex));

    // Atualização monetária pela TR
    const trCorrection = round2(currentBalance * monthlyTR);
    const correctedBalance = currentBalance + trCorrection;

    // Juros contratuais
    const interest = round2(correctedBalance * iMonthly);

    // Seguro mensal com TR
    const insurance = round2(baseInsurance * Math.pow(1 + monthlyTR, monthIndex));

    // Amortização líquida
    const amortization = round2(Math.max(0, totalInstallment - interest - insurance));

    // Saldo após pagamento
    const remainingAfter = round2(correctedBalance - amortization);

    installments.push({
      installmentNumber,
      date: dateStr,
      amount: totalInstallment,
      amortizationAmount: amortization,
      interestAmount: interest,
      insuranceAmount: insurance,
      correctionAmount: trCorrection,
      remainingBalanceAfter: remainingAfter,
    });

    currentBalance = remainingAfter;
  }

  return installments;
}

const recalculated = generate12Installments();
console.log('--- RECALCULO DAS PARCELAS 21 A 32 ---');
recalculated.forEach(p => {
  console.log(`Parcela ${p.installmentNumber} (${p.date}): Total = R$ ${p.amount.toFixed(2)} | Amort = R$ ${p.amortizationAmount.toFixed(2)} | Juros = R$ ${p.interestAmount.toFixed(2)} | Seg = R$ ${p.insuranceAmount.toFixed(2)}`);
});

// 2. Atualizar arquivos JSON de store locais
const targetFiles = [
  path.join(__dirname, '..', 'server', 'data', 'stores', 'usr-default-liverton.json'),
  path.join(__dirname, '..', 'server', 'data', 'stores', 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b.json'),
];

targetFiles.forEach(f => {
  if (fs.existsSync(f)) {
    const raw = fs.readFileSync(f, 'utf8');
    const store = JSON.parse(raw);

    // Atualizar dívida
    store.debts = (store.debts || []).map(d => {
      if (d.id === 'debt-financiamento-caixa') {
        return {
          ...d,
          installmentAmount: recalculated[0].amount, // R$ 750.88
          paidInstallments: 20,
          nextDueDate: '2026-10-21',
        };
      }
      return d;
    });

    // Atualizar transações da dívida Caixa
    const txMap = new Map(recalculated.map(p => [p.installmentNumber, p]));
    store.transactions = (store.transactions || []).map(t => {
      if (t.debtId === 'debt-financiamento-caixa' || (t.installments && t.installments.debtId === 'debt-financiamento-caixa')) {
        const instNum = t.debtInstallmentNumber || (t.installments && t.installments.debtInstallmentNumber) || (t.installments && t.installments.current);
        const calc = txMap.get(instNum);
        if (calc) {
          return {
            ...t,
            amount: calc.amount,
            date: calc.date,
            dueDate: calc.date,
            debtBreakdown: {
              amortizationAmount: calc.amortizationAmount,
              interestAmount: calc.interestAmount,
              correctionAmount: calc.correctionAmount,
              insuranceAmount: calc.insuranceAmount,
              adminFeeAmount: 0.00,
            },
          };
        }
      }
      return t;
    });

    fs.writeFileSync(f, JSON.stringify(store, null, 2), 'utf8');
    console.log(`[OK] Arquivo local atualizado: ${path.basename(f)}`);
  }
});

// 3. Atualizar Supabase Postgres
async function updateSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.log('[INFO] Supabase Service Role Key não configurada.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const userId = 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b';

  // Atualizar debts
  const { error: debtErr } = await supabase
    .from('debts')
    .update({
      installment_amount: recalculated[0].amount, // 750.88
      next_due_date: '2026-10-21',
    })
    .eq('id', 'debt-financiamento-caixa')
    .eq('user_id', userId);

  if (debtErr) {
    console.error('[ERRO] Ao atualizar debts no Supabase:', debtErr.message);
  } else {
    console.log(`[OK] debts atualizado no Supabase: installment_amount = ${recalculated[0].amount}`);
  }

  // Atualizar transactions
  for (const p of recalculated) {
    const txId = `tx-debt-debt-financiamento-caixa-${p.installmentNumber}`;
    const { error: txErr } = await supabase
      .from('transactions')
      .update({
        amount: p.amount,
        date: p.date,
        due_date: p.date,
      })
      .eq('id', txId)
      .eq('user_id', userId);

    if (txErr) {
      console.warn(`[WARN] Erro ao atualizar transação ${txId}:`, txErr.message);
    }
  }

  console.log('[OK] 12 transações da Caixa atualizadas no Supabase com sucesso!');
}

updateSupabase().then(() => {
  console.log('[FIM] Recálculo concluído.');
});
