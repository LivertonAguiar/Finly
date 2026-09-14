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

const OLD_DEBT_ID = 'debt-1789003413274-l3jh';
const OFFICIAL_DEBT_ID = 'debt-financiamento-caixa';
const USER_ID = 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b';

const targetFiles = [
  path.join(__dirname, '..', 'server', 'data', 'stores', 'usr-default-liverton.json'),
  path.join(__dirname, '..', 'server', 'data', 'stores', 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b.json'),
];

targetFiles.forEach(f => {
  if (fs.existsSync(f)) {
    const raw = fs.readFileSync(f, 'utf8');
    const store = JSON.parse(raw);
    
    const beforeCount = (store.debts || []).length;
    store.debts = (store.debts || []).filter(d => d.id !== OLD_DEBT_ID);
    const afterCount = (store.debts || []).length;

    store.transactions = (store.transactions || []).filter(t => {
      const debtId = t.debtId || (t.installments && t.installments.debtId);
      return debtId !== OLD_DEBT_ID;
    });

    fs.writeFileSync(f, JSON.stringify(store, null, 2), 'utf8');
    console.log(`[OK] Limpeza em ${path.basename(f)}: dívidas antes=${beforeCount}, depois=${afterCount}`);
  }
});

async function cleanSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.log('[INFO] Supabase Service Role Key não configurada.');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: delTxs } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', USER_ID)
      .eq('debt_id', OLD_DEBT_ID)
      .select('id');
    console.log(`[OK] Transações obsoletas deletadas no Supabase: ${delTxs ? delTxs.length : 0}`);

    const { data: delDebt } = await supabase
      .from('debts')
      .delete()
      .eq('user_id', USER_ID)
      .eq('id', OLD_DEBT_ID)
      .select('id');
    console.log(`[OK] Dívida obsoleta deletada no Supabase: ${delDebt ? JSON.stringify(delDebt) : 'Nenhum'}`);

    const { data: currentDebts } = await supabase
      .from('debts')
      .select('id, title, creditor, contract_number')
      .eq('user_id', USER_ID);
    console.log('[OK] Dívidas ativas restantes no Supabase:', currentDebts);
  } catch (err) {
    console.warn('[WARN] Falha ao limpar Supabase:', err.message);
  }
}

cleanSupabase().then(() => {
  console.log('[FIM] Limpeza de dívida duplicada finalizada.');
});
