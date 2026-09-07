/**
 * FINLY - MIGRATION SCRIPT: LOCAL JSON STORES -> SUPABASE POSTGRESQL
 *
 * Usage:
 *   node scripts/migrate-stores-to-supabase.js
 *
 * Requirements:
 *   Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)
 *   are configured in your .env file or passed in the environment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Load .env file
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('seu-projeto')) {
  console.error('❌ Erro: Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY) no arquivo .env antes de executar.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runMigration() {
  console.log('🚀 Iniciando migração das bases JSON locais para o Supabase PostgreSQL...');
  console.log(`🔗 Conectando a: ${supabaseUrl}`);

  const storesDir = path.join(ROOT_DIR, 'server/data/stores');
  const usersFile = path.join(ROOT_DIR, 'server/data/users.json');

  if (!fs.existsSync(storesDir)) {
    console.log('⚠️ Nenhum diretório de stores encontrado em server/data/stores.');
    return;
  }

  const storeFiles = fs.readdirSync(storesDir).filter(f => f.endsWith('.json'));
  console.log(`📁 Encontrados ${storeFiles.length} arquivos de dados de usuários.`);

  let usersList = [];
  if (fs.existsSync(usersFile)) {
    try {
      usersList = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch (_) {}
  }

  for (const file of storeFiles) {
    const storePath = path.join(storesDir, file);
    const raw = fs.readFileSync(storePath, 'utf8');
    const store = JSON.parse(raw);

    const safeUserId = file.replace('.json', '');
    const userMeta = usersList.find(u => u.id === safeUserId) || {
      email: `${safeUserId}@finly.local`,
      name: store.userProfile?.name || safeUserId,
    };

    console.log(`\n📦 Processando: ${safeUserId} (${userMeta.email})`);

    // Ensure user in Supabase Auth & public.profiles
    let targetUserId = null;
    try {
      const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers();
      const existing = usersData?.users?.find(u => u.email?.toLowerCase() === userMeta.email.toLowerCase());
      if (existing) {
        targetUserId = existing.id;
        console.log(`  👤 Usuário já existente no Supabase Auth: ${targetUserId}`);
      } else {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: userMeta.email,
          password: userMeta.plainPassword || 'Finly2026!',
          email_confirm: true,
          user_metadata: {
            name: userMeta.name || store.userProfile?.name || 'Usuário',
            phone: userMeta.phone,
            role: userMeta.role || 'admin',
          },
        });
        if (newUser?.user) {
          targetUserId = newUser.user.id;
          console.log(`  👤 Usuário criado com sucesso no Supabase Auth: ${targetUserId}`);
        } else {
          console.error('  ❌ Erro ao criar usuário no Supabase:', createErr?.message);
        }
      }
    } catch (e) {
      console.error('  ❌ Falha no admin auth do Supabase:', e.message);
    }

    if (!targetUserId) {
      console.error(`  ⚠️ Pulando ${safeUserId}: não foi possível obter ID de usuário no Supabase.`);
      continue;
    }

    // 0. Update Profile metadata
    if (store.userProfile) {
      await supabase.from('profiles').upsert({
        id: targetUserId,
        name: store.userProfile.name || userMeta.name,
        email: userMeta.email,
        phone: store.userProfile.phone || userMeta.phone,
        currency: store.userProfile.currency || 'BRL',
        role: store.userProfile.role || 'admin',
        theme: store.userProfile.theme || 'dark',
        theme_preset: store.userProfile.themePreset || 'planner-dark',
        accent_color: store.userProfile.accentColor || '#10b981',
        card_radius: store.userProfile.cardRadius || 'rounded',
        show_values: store.userProfile.showValues !== false,
        language: store.userProfile.language || 'pt-BR',
      });
      console.log('  ✅ Perfil sincronizado.');
    }

    // 1. Accounts
    if (Array.isArray(store.accounts) && store.accounts.length > 0) {
      const rows = store.accounts.map(a => ({
        id: a.id,
        user_id: targetUserId,
        name: a.name,
        type: a.type || 'checking',
        balance: a.balance || 0,
        initial_balance: a.initialBalance || 0,
        institution: a.institution || '',
        color: a.color || '#10b981',
        include_in_total: a.includeInTotal !== false,
        account_number: a.accountNumber,
      }));
      const { error } = await supabase.from('accounts').upsert(rows);
      if (error) console.error('  ❌ Erro em accounts:', error.message);
      else console.log(`  ✅ ${rows.length} contas migradas.`);
    }

    // 2. Cards
    if (Array.isArray(store.cards) && store.cards.length > 0) {
      const rows = store.cards.map(c => ({
        id: c.id,
        user_id: targetUserId,
        name: c.name,
        brand: c.brand || 'Mastercard',
        limit: c.limit || 0,
        closing_day: c.closingDay || 1,
        due_day: c.dueDay || 10,
        color: c.color || '#820ad1',
        default_account_id: c.defaultAccountId,
      }));
      const { error } = await supabase.from('credit_cards').upsert(rows);
      if (error) console.error('  ❌ Erro em cards:', error.message);
      else console.log(`  ✅ ${rows.length} cartões migrados.`);
    }

    // 3. Categories
    if (Array.isArray(store.categories) && store.categories.length > 0) {
      const rows = store.categories.map(c => ({
        id: c.id,
        user_id: targetUserId,
        name: c.name,
        icon: c.icon || '📁',
        color: c.color || '#10b981',
        type: c.type || 'expense',
        subcategories: c.subcategories || [],
      }));
      const { error } = await supabase.from('categories').upsert(rows);
      if (error) console.error('  ❌ Erro em categories:', error.message);
      else console.log(`  ✅ ${rows.length} categorias migradas.`);
    }

    // 4. Transactions
    if (Array.isArray(store.transactions) && store.transactions.length > 0) {
      const rows = store.transactions.map(t => ({
        id: t.id,
        user_id: targetUserId,
        description: t.description,
        amount: t.amount,
        type: t.type,
        date: t.date,
        category_id: t.categoryId,
        subcategory_id: t.subcategoryId,
        account_id: t.accountId,
        target_account_id: t.targetAccountId,
        card_id: t.cardId,
        status: t.status || 'completed',
        recurring: Boolean(t.recurring),
        recurrence_frequency: t.recurrenceFrequency,
        installments: t.installments,
        tags: t.tags || [],
        notes: t.notes,
        attachment_url: t.attachmentUrl,
        attachment_name: t.attachmentName,
        reminder: t.reminder,
        invoice_month: t.invoiceMonth,
        due_date: t.dueDate,
        purchase_date: t.purchaseDate,
        ignored: Boolean(t.ignored),
        is_third_party: Boolean(t.isThirdParty),
        third_party_name: t.thirdPartyName,
        reimbursed: Boolean(t.reimbursed),
        created_at: t.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('transactions').upsert(rows);
      if (error) console.error('  ❌ Erro em transactions:', error.message);
      else console.log(`  ✅ ${rows.length} transações migradas.`);
    }

    // 5. Budgets, Goals, Debts, Investments
    if (Array.isArray(store.budgets) && store.budgets.length > 0) {
      const rows = store.budgets.map(b => ({
        id: b.id,
        user_id: targetUserId,
        category_id: b.categoryId,
        subcategory_id: b.subcategoryId,
        month: b.month,
        limit: b.limit,
      }));
      await supabase.from('budgets').upsert(rows);
      console.log(`  ✅ ${rows.length} orçamentos migrados.`);
    }

    if (Array.isArray(store.goals) && store.goals.length > 0) {
      const rows = store.goals.map(g => ({
        id: g.id,
        user_id: targetUserId,
        title: g.title,
        description: g.description,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        deadline: g.deadline || null,
        icon: g.icon || '🎯',
        color: g.color || '#10b981',
        category: g.category,
        deposits: g.deposits || [],
        image_url: g.imageUrl,
        status: g.status || 'active',
        completed: Boolean(g.completed),
      }));
      await supabase.from('goals').upsert(rows);
      console.log(`  ✅ ${rows.length} metas migradas.`);
    }

    if (Array.isArray(store.debts) && store.debts.length > 0) {
      const rows = store.debts.map(d => ({
        id: d.id,
        user_id: targetUserId,
        title: d.title,
        creditor: d.creditor,
        total_amount: d.totalAmount,
        remaining_amount: d.remainingAmount,
        interest_rate: d.interestRate,
        installment_amount: d.installmentAmount,
        total_installments: d.totalInstallments,
        paid_installments: d.paidInstallments,
        due_day: d.dueDay,
        next_due_date: d.nextDueDate || null,
        notes: d.notes,
        payments: d.payments || [],
      }));
      await supabase.from('debts').upsert(rows);
      console.log(`  ✅ ${rows.length} dívidas migradas.`);
    }

    if (Array.isArray(store.investments) && store.investments.length > 0) {
      const rows = store.investments.map(i => ({
        id: i.id,
        user_id: targetUserId,
        name: i.name,
        ticker: i.ticker,
        type: i.type,
        institution: i.institution,
        invested_amount: i.investedAmount,
        current_balance: i.currentBalance,
        quantity: i.quantity,
        average_price: i.averagePrice,
        current_price: i.currentPrice,
        monthly_yield: i.monthlyYield,
        yield_percentage: i.yieldPercentage,
        updated_at: i.updatedAt || new Date().toISOString(),
      }));
      await supabase.from('investments').upsert(rows);
      console.log(`  ✅ ${rows.length} investimentos migrados.`);
    }
  }

  console.log('\n✨ Migração concluída com sucesso!');
}

runMigration().catch(err => {
  console.error('❌ Falha na execução do script:', err);
  process.exit(1);
});
