import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Account,
  CreditCard,
  Category,
  Transaction,
  Budget,
  Goal,
  Debt,
  InvestmentAsset,
  UserProfile,
  FamilyMember,
  NotificationItem,
} from '../types';

export interface UserStoreData {
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  investments: InvestmentAsset[];
  transactions: Transaction[];
  familyMembers: FamilyMember[];
  notifications: NotificationItem[];
  userProfile: UserProfile;
}

export class SupabaseDbService {
  /**
   * Helper to validate or resolve UUID string for Postgres user_id columns
   */
  public getValidUserId(userId: string): string | null {
    if (!userId) return null;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return userId;
    }
    // Backward-compatible alias mappings for default/seed users
    if (userId === 'usr-default-liverton') return 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b';
    if (userId === 'usr-demo-financeiro') return '75a44ea2-c56f-474f-aaf1-4688f6e778a2';
    return null;
  }

  /**
   * Fetch all user data across normalized tables
   */
  public async fetchUserStore(userId: string): Promise<UserStoreData | null> {
    if (!isSupabaseConfigured()) return null;
    const targetUserId = this.getValidUserId(userId);
    if (!targetUserId) return null;

    try {
      const [
        profileRes,
        accountsRes,
        cardsRes,
        categoriesRes,
        transactionsRes,
        budgetsRes,
        goalsRes,
        debtsRes,
        investmentsRes,
        familyRes,
        notificationsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle(),
        supabase.from('accounts').select('*').eq('user_id', targetUserId),
        supabase.from('credit_cards').select('*').eq('user_id', targetUserId),
        supabase.from('categories').select('*').eq('user_id', targetUserId),
        supabase.from('transactions').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', targetUserId),
        supabase.from('goals').select('*').eq('user_id', targetUserId),
        supabase.from('debts').select('*').eq('user_id', targetUserId),
        supabase.from('investments').select('*').eq('user_id', targetUserId),
        supabase.from('family_members').select('*').eq('user_id', targetUserId),
        supabase.from('notifications').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }),
      ]);

      // If cardsRes failed, warn instead of silently treating as empty
      if (cardsRes.error) {
        console.warn('Supabase fetch cards notice:', cardsRes.error.message);
      }

      // If no data exists at all on Supabase yet
      if (
        !profileRes.data &&
        (!accountsRes.data || accountsRes.data.length === 0) &&
        (!transactionsRes.data || transactionsRes.data.length === 0)
      ) {
        return null;
      }

      const p = profileRes.data || {};
      const userProfile: UserProfile = {
        name: p.name || 'Usuário',
        email: p.email || '',
        phone: p.phone,
        whatsappPhone: p.whatsapp_phone,
        avatarUrl: p.avatar_url,
        currency: p.currency || 'BRL',
        role: p.role || 'user',
        theme: p.theme || 'dark',
        themePreset: p.theme_preset || 'finly-dark',
        accentColor: p.accent_color || '#10b981',
        cardRadius: p.card_radius || 'rounded',
        showValues: p.show_values !== false,
        language: p.language || 'pt-BR',
      };

      const accounts: Account[] = (accountsRes.data || []).map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        balance: Number(r.balance) || 0,
        initialBalance: Number(r.initial_balance) || 0,
        institution: r.institution || '',
        color: r.color || '#10b981',
        includeInTotal: r.include_in_total !== false,
        accountNumber: r.account_number,
      }));

      const cards: CreditCard[] = (cardsRes.data || []).map(r => ({
        id: r.id,
        name: r.name,
        brand: r.brand || 'Mastercard',
        limit: Number(r.limit) || 0,
        closingDay: r.closing_day || 1,
        dueDay: r.due_day || 10,
        color: r.color || '#820ad1',
        defaultAccountId: r.default_account_id,
      }));

      const categories: Category[] = (categoriesRes.data || []).map(r => ({
        id: r.id,
        name: r.name,
        icon: r.icon || '📁',
        color: r.color || '#10b981',
        type: r.type,
        subcategories: Array.isArray(r.subcategories) ? r.subcategories : [],
      }));

      const transactions: Transaction[] = (transactionsRes.data || []).map(r => ({
        id: r.id,
        description: r.description,
        amount: Number(r.amount) || 0,
        type: r.type,
        date: r.date,
        categoryId: r.category_id,
        subcategoryId: r.subcategory_id,
        accountId: r.account_id,
        targetAccountId: r.target_account_id,
        cardId: r.card_id,
        status: r.status || 'completed',
        recurring: Boolean(r.recurring),
        recurrenceFrequency: r.recurrence_frequency,
        installments: r.installments,
        tags: Array.isArray(r.tags) ? r.tags : [],
        notes: r.notes,
        attachmentUrl: r.attachment_url,
        attachmentName: r.attachment_name,
        reminder: r.reminder,
        invoiceMonth: r.invoice_month,
        dueDate: r.due_date,
        purchaseDate: r.purchase_date,
        ignored: Boolean(r.ignored),
        isThirdParty: Boolean(r.is_third_party),
        thirdPartyName: r.third_party_name,
        reimbursed: Boolean(r.reimbursed),
        createdAt: r.created_at,
      }));

      const budgets: Budget[] = (budgetsRes.data || []).map(r => ({
        id: r.id,
        categoryId: r.category_id,
        subcategoryId: r.subcategory_id,
        month: r.month,
        limit: Number(r.limit) || 0,
      }));

      const goals: Goal[] = (goalsRes.data || []).map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        targetAmount: Number(r.target_amount) || 0,
        currentAmount: Number(r.current_amount) || 0,
        deadline: r.deadline || '',
        icon: r.icon || '🎯',
        color: r.color || '#10b981',
        category: r.category,
        deposits: Array.isArray(r.deposits) ? r.deposits : [],
        imageUrl: r.image_url,
        status: r.status || 'active',
        completed: Boolean(r.completed),
      }));

      const debts: Debt[] = (debtsRes.data || []).map(r => ({
        id: r.id,
        title: r.title,
        creditor: r.creditor,
        totalAmount: Number(r.total_amount) || 0,
        remainingAmount: Number(r.remaining_amount) || 0,
        interestRate: r.interest_rate != null ? Number(r.interest_rate) : undefined,
        installmentAmount: Number(r.installment_amount) || 0,
        totalInstallments: r.total_installments || 1,
        paidInstallments: r.paid_installments || 0,
        dueDay: r.due_day || 10,
        nextDueDate: r.next_due_date || '',
        notes: r.notes,
        payments: Array.isArray(r.payments) ? r.payments : [],
      }));

      const investments: InvestmentAsset[] = (investmentsRes.data || []).map(r => ({
        id: r.id,
        name: r.name,
        ticker: r.ticker,
        type: r.type,
        institution: r.institution,
        investedAmount: Number(r.invested_amount) || 0,
        currentBalance: Number(r.current_balance) || 0,
        quantity: r.quantity != null ? Number(r.quantity) : undefined,
        averagePrice: r.average_price != null ? Number(r.average_price) : undefined,
        currentPrice: r.current_price != null ? Number(r.current_price) : undefined,
        monthlyYield: Number(r.monthly_yield) || 0,
        yieldPercentage: Number(r.yield_percentage) || 0,
        updatedAt: r.updated_at,
      }));

      const familyMembers: FamilyMember[] = (familyRes.data || []).map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: r.role || 'viewer',
        status: r.status || 'active',
        type: r.type || 'linked',
        isOwner: Boolean(r.is_owner),
        joinedAt: r.joined_at,
      }));

      const notifications: NotificationItem[] = (notificationsRes.data || []).map(r => ({
        id: r.id,
        title: r.title,
        message: r.message,
        date: r.date,
        read: Boolean(r.read),
        type: r.type || 'info',
      }));

      return {
        userProfile,
        accounts,
        cards,
        categories,
        transactions,
        budgets,
        goals,
        debts,
        investments,
        familyMembers,
        notifications,
      };
    } catch (err) {
      console.error('❌ Supabase fetchUserStore error:', err);
      return null;
    }
  }

  /**
   * Save / Sync entire user store in batches
   */
  public async saveEntireStore(userId: string, store: UserStoreData): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;
    const targetUserId = this.getValidUserId(userId);
    if (!targetUserId) return false;

    try {
      // 1. Profile Upsert
      if (store.userProfile) {
        await supabase.from('profiles').upsert({
          id: targetUserId,
          name: store.userProfile.name,
          email: store.userProfile.email,
          phone: store.userProfile.phone,
          whatsapp_phone: store.userProfile.whatsappPhone,
          avatar_url: store.userProfile.avatarUrl,
          currency: store.userProfile.currency || 'BRL',
          role: store.userProfile.role || 'user',
          theme: store.userProfile.theme || 'dark',
          theme_preset: store.userProfile.themePreset || 'finly-dark',
          accent_color: store.userProfile.accentColor || '#10b981',
          card_radius: store.userProfile.cardRadius || 'rounded',
          show_values: store.userProfile.showValues !== false,
          language: store.userProfile.language || 'pt-BR',
        });
      }

      // 2. Accounts Upsert
      if (store.accounts && store.accounts.length > 0) {
        const rows = store.accounts.map(a => ({
          id: a.id,
          user_id: targetUserId,
          name: a.name,
          type: a.type,
          balance: a.balance,
          initial_balance: a.initialBalance,
          institution: a.institution || '',
          color: a.color || '#10b981',
          include_in_total: a.includeInTotal !== false,
          account_number: a.accountNumber,
        }));
        await supabase.from('accounts').upsert(rows);
      }

      // 3. Cards Upsert
      if (store.cards && store.cards.length > 0) {
        const rows = store.cards.map(c => ({
          id: c.id,
          user_id: targetUserId,
          name: c.name || 'Cartão de Crédito',
          brand: c.brand || 'Mastercard',
          limit: Number(c.limit) || 0,
          closing_day: Number(c.closingDay) || 1,
          due_day: Number(c.dueDay) || 10,
          color: c.color || '#820ad1',
          default_account_id: c.defaultAccountId || null,
        }));
        const { error: cardsErr } = await supabase.from('credit_cards').upsert(rows);
        if (cardsErr) {
          console.error('❌ Supabase cards upsert error:', cardsErr);
        }
      }

      // 4. Categories Upsert
      if (store.categories && store.categories.length > 0) {
        const rows = store.categories.map(c => ({
          id: c.id,
          user_id: targetUserId,
          name: c.name,
          icon: c.icon || '📁',
          color: c.color || '#10b981',
          type: c.type,
          subcategories: c.subcategories || [],
        }));
        await supabase.from('categories').upsert(rows);
      }

      // 5. Transactions Upsert
      if (store.transactions && store.transactions.length > 0) {
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
        await supabase.from('transactions').upsert(rows);
      }

      // 6. Budgets Upsert
      if (store.budgets && store.budgets.length > 0) {
        const rows = store.budgets.map(b => ({
          id: b.id,
          user_id: targetUserId,
          category_id: b.categoryId,
          subcategory_id: b.subcategoryId,
          month: b.month,
          limit: b.limit,
        }));
        await supabase.from('budgets').upsert(rows);
      }

      // 7. Goals Upsert
      if (store.goals && store.goals.length > 0) {
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
      }

      // 8. Debts Upsert
      if (store.debts && store.debts.length > 0) {
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
      }

      // 9. Investments Upsert
      if (store.investments && store.investments.length > 0) {
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
      }

      return true;
    } catch (err) {
      console.error('❌ Supabase saveEntireStore error:', err);
      return false;
    }
  }

  /**
   * Upsert single transaction
   */
  public async upsertTransaction(userId: string, t: Transaction): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;
    try {
      const { error } = await supabase.from('transactions').upsert({
        id: t.id,
        user_id: userId,
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
      });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Delete single or multiple transactions
   */
  public async deleteTransactions(userId: string, ids: string[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId || ids.length === 0) return false;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .in('id', ids);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Upsert single account
   */
  public async upsertAccount(userId: string, a: Account): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;
    try {
      const { error } = await supabase.from('accounts').upsert({
        id: a.id,
        user_id: userId,
        name: a.name,
        type: a.type,
        balance: a.balance,
        initial_balance: a.initialBalance,
        institution: a.institution || '',
        color: a.color || '#10b981',
        include_in_total: a.includeInTotal !== false,
        account_number: a.accountNumber,
      });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Delete account
   */
  public async deleteAccount(userId: string, id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('user_id', userId)
        .eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Upsert single credit card
   */
  public async upsertCard(userId: string, c: CreditCard): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;
    const targetUserId = this.getValidUserId(userId);
    if (!targetUserId) return false;

    try {
      const { error } = await supabase.from('credit_cards').upsert({
        id: c.id,
        user_id: targetUserId,
        name: c.name || 'Cartão de Crédito',
        brand: c.brand || 'Mastercard',
        limit: Number(c.limit) || 0,
        closing_day: Number(c.closingDay) || 1,
        due_day: Number(c.dueDay) || 10,
        color: c.color || '#820ad1',
        default_account_id: c.defaultAccountId || null,
      });
      if (error) console.error('❌ Supabase upsertCard error:', error);
      return !error;
    } catch (e) {
      console.error('❌ Supabase upsertCard exception:', e);
      return false;
    }
  }

  /**
   * Delete credit card
   */
  public async deleteCard(userId: string, id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;
    const targetUserId = this.getValidUserId(userId);
    if (!targetUserId) return false;

    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('user_id', targetUserId)
        .eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Hard clear all financial data for user in Supabase (transactions, cards, budgets, goals, debts, investments, accounts)
   */
  public async clearUserStore(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return false;

    try {
      const tables = [
        'transactions',
        'credit_cards',
        'budgets',
        'goals',
        'debts',
        'investments',
        'notifications',
        'accounts',
      ];

      for (const tbl of tables) {
        const { error } = await supabase.from(tbl).delete().eq('user_id', userId);
        if (error) {
          console.warn(`Supabase notice on delete from ${tbl}:`, error.message);
        }
      }

      console.log(`✅ Supabase: Dados financeiros limpos para usuário ${userId}`);
      return true;
    } catch (err) {
      console.error('❌ Erro ao limpar dados no Supabase:', err);
      return false;
    }
  }
}

export const supabaseDb = new SupabaseDbService();
