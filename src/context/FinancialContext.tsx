import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories';
import { getCurrentMonth, getTodayString, round2 } from '../utils/formatters';
import { useAuth } from './AuthContext';
import { apiSync } from '../utils/apiSync';
import { generateRealisticDemoStore } from '../utils/demoDataGenerator';
import { supabaseDb } from '../services/supabaseDb';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { useUndoToast } from './UndoToastContext';
import { saveOrShareFile } from '../utils/fileDownloadHelper';
import { applyTheme, ThemePreset, CardRadius, PRESET_COLORS } from '../utils/themeEngine';

export const DEFAULT_WALLET_ACCOUNT: Account = {
  id: 'acc-carteira-padrao',
  name: 'Carteira',
  type: 'cash',
  balance: 0.00,
  initialBalance: 0.00,
  institution: 'Carteira',
  color: '#10b981',
  includeInTotal: true,
};

const SEED_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Nubank Principal', type: 'checking', balance: 4250.00, initialBalance: 4250.00, color: '#820ad1', institution: 'Nubank', includeInTotal: true },
  { id: 'acc-2', name: 'Banco Inter Reserva', type: 'investment', balance: 8900.50, initialBalance: 8900.50, color: '#ff7a00', institution: 'Banco Inter', includeInTotal: true },
  { id: 'acc-3', name: 'Itaú Corrente', type: 'checking', balance: 1540.20, initialBalance: 1540.20, color: '#ec7000', institution: 'Itaú', includeInTotal: true },
  { id: 'acc-4', name: 'Carteira Física', type: 'cash', balance: 350.00, initialBalance: 350.00, color: '#10b981', institution: 'Carteira', includeInTotal: true },
];

const SEED_CARDS: CreditCard[] = [
  { id: 'card-1', name: 'Nubank Ultravioleta', limit: 12000.00, closingDay: 28, dueDay: 5, color: '#820ad1', brand: 'Mastercard', defaultAccountId: 'acc-1' },
  { id: 'card-2', name: 'Inter Black', limit: 8000.00, closingDay: 20, dueDay: 27, color: '#ff7a00', brand: 'Mastercard', defaultAccountId: 'acc-2' },
  { id: 'card-3', name: 'PicPay Card', limit: 5000.00, closingDay: 15, dueDay: 22, color: '#11c76f', brand: 'Mastercard', defaultAccountId: 'acc-1' },
  { id: 'card-4', name: 'Mercado Pago', limit: 3500.00, closingDay: 10, dueDay: 17, color: '#009ee3', brand: 'Visa', defaultAccountId: 'acc-1' },
];

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', description: 'Salário Mensal', amount: 8500.00, type: 'income', date: `${getCurrentMonth()}-05`, categoryId: 'cat-salario', accountId: 'acc-1', status: 'completed', recurring: true, tags: ['renda', 'mensal'], createdAt: new Date().toISOString() },
  { id: 'tx-2', description: 'Supermercado Mensal', amount: 1240.50, type: 'expense', date: `${getCurrentMonth()}-08`, categoryId: 'cat-alimentacao', cardId: 'card-1', status: 'completed', recurring: false, tags: ['mercado', 'essencial'], createdAt: new Date().toISOString() },
  { id: 'tx-3', description: 'Combustível Posto Shell', amount: 280.00, type: 'expense', date: `${getCurrentMonth()}-12`, categoryId: 'cat-transporte', cardId: 'card-1', status: 'completed', recurring: false, tags: ['carro'], createdAt: new Date().toISOString() },
  { id: 'tx-4', description: 'Netflix & Spotify', amount: 79.80, type: 'expense', date: `${getCurrentMonth()}-15`, categoryId: 'cat-lazer', cardId: 'card-2', status: 'completed', recurring: true, tags: ['streaming'], createdAt: new Date().toISOString() },
  { id: 'tx-5', description: 'Rendimento CDB 110% CDI', amount: 115.40, type: 'income', date: `${getCurrentMonth()}-18`, categoryId: 'cat-investimentos-rec', accountId: 'acc-2', status: 'completed', recurring: false, tags: ['rendimento'], createdAt: new Date().toISOString() },
];


interface UserStoreData {
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

interface FinancialContextType {
  // User & Settings
  user: UserProfile;
  updateUser: (data: Partial<UserProfile>) => void;
  toggleHideValues: () => void;
  toggleTheme: () => void;

  // Period Filter
  period: string;
  setPeriod: (period: string) => void;
  customDateRange: { start: string; end: string };
  setCustomDateRange: (range: { start: string; end: string }) => void;

  // Accounts
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Cards
  cards: CreditCard[];
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCard: (id: string, data: Partial<CreditCard>) => void;
  deleteCard: (id: string) => void;
  payCardInvoice: (cardId: string, accountId: string, amount: number, month: string) => void;
  unpayCardInvoice: (cardId: string, month: string) => void;

  // Categories
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id' | 'subcategories'>) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, name: string, icon?: string) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  resetCategoriesToDefault: () => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteMultipleTransactions: (ids: string[]) => void;
  toggleTransactionStatus: (id: string) => void;
  reimburseThirdPartyTransaction: (transactionId: string, targetAccountId: string) => void;
  importTransactions: (txs: Omit<Transaction, 'id' | 'createdAt'>[]) => void;

  // Budgets
  budgets: Budget[];
  setCategoryBudget: (categoryId: string, limit: number, month?: string) => void;

  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'deposits' | 'completed'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  depositToGoal: (goalId: string, amount: number, accountId?: string, note?: string) => void;

  // Debts
  debts: Debt[];
  addDebt: (debt: Omit<Debt, 'id' | 'remainingAmount' | 'paidInstallments' | 'payments'> & { remainingAmount?: number; paidInstallments?: number }) => void;
  updateDebt: (id: string, data: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  payDebtInstallment: (debtId: string, accountId?: string) => void;

  // Investments
  investments: InvestmentAsset[];
  addInvestment: (inv: Omit<InvestmentAsset, 'id' | 'updatedAt'>) => void;
  updateInvestment: (id: string, data: Partial<InvestmentAsset>) => void;
  deleteInvestment: (id: string) => void;

  // Family Members
  familyMembers: FamilyMember[];
  inviteFamilyMember: (member: Omit<FamilyMember, 'id' | 'joinedAt'>) => void;
  updateFamilyMember: (id: string, data: Partial<FamilyMember>) => void;
  removeFamilyMember: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (item: {
    title: string;
    message: string;
    type?: 'info' | 'alert' | 'success' | 'reminder';
    date?: string;
    tag?: string;
  }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Data Management & Backups
  refreshData: () => Promise<void>;
  clearAppCache: () => Promise<void> | void;
  resetAllUserData: () => Promise<void>;
  resetToCleanState: () => Promise<void>;
  loadDemoData: () => void;
  exportBackupJSON: () => Promise<void> | void;
  importBackupJSON: (jsonString: string) => boolean;

  // Calculated Metrics
  metrics: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
    savingsRate: number;
    totalInvestments: number;
    monthlyInvestmentYield: number;
    totalDebts: number;
    totalCreditLimit: number;
    totalCreditUsed: number;
    totalCreditAvailable: number;
    filteredTransactions: Transaction[];
  };
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

function sanitizeStoredData<T>(obj: T): T {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeStoredData) as unknown as T;
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const k of Object.keys(obj)) {
      res[k] = sanitizeStoredData((obj as any)[k]);
    }
    // If it's a category, ensure subcategories is an array
    if (res.id && res.name && res.type && (res.type === 'income' || res.type === 'expense')) {
      if (!Array.isArray(res.subcategories)) {
        res.subcategories = [];
      }
    }
    return res;
  }
  return obj;
}

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const payingInvoiceLockRef = useRef<Record<string, number>>({});
  const isStoreLoadedForUserIdRef = useRef<string | null>(null);
  const isResettingRef = useRef<boolean>(false);

  const { showUndo } = useUndoToast();
  const { currentUser } = useAuth();
  const userId = currentUser ? currentUser.id : 'guest';
  const userStoreKey = `finly_user_${userId}_store`;

  // Helper to merge default categories with any existing user categories
  const mergeCategories = (savedCats: any[]): Category[] => {
    // If the saved list is old format (contains cat-academia or missing cat-desp-alimentacao), force reset to DEFAULT_CATEGORIES
    if (!Array.isArray(savedCats) || savedCats.length === 0 || !savedCats.some(c => c && c.id === 'cat-desp-alimentacao')) {
      return DEFAULT_CATEGORIES;
    }

    const standardIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
    const userCustomCats: Category[] = [];

    savedCats.forEach(c => {
      if (c && c.id && !standardIds.has(c.id) && c.id.startsWith('cat-custom-')) {
        userCustomCats.push({
          ...c,
          subcategories: Array.isArray(c.subcategories) ? c.subcategories : []
        });
      }
    });

    return [...DEFAULT_CATEGORIES, ...userCustomCats];
  };

  // Helper to load user's initial state
  const loadUserStore = (): UserStoreData => {
    const isDemo = userId === 'usr-demo-financeiro' || currentUser?.email === 'demo@finly.com';

    try {
      const saved = localStorage.getItem(userStoreKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If demo user but transactions/accounts are empty, regenerate complete demo store
        if (isDemo && (!Array.isArray(parsed.transactions) || parsed.transactions.length === 0 || !Array.isArray(parsed.accounts) || parsed.accounts.length === 0)) {
          // Fall through to generateRealisticDemoStore below
        } else {
          return sanitizeStoredData({
            accounts: Array.isArray(parsed.accounts) && parsed.accounts.length > 0 ? parsed.accounts : [DEFAULT_WALLET_ACCOUNT],
            cards: Array.isArray(parsed.cards) ? parsed.cards : [],
            categories: mergeCategories(parsed.categories),
            budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
            goals: Array.isArray(parsed.goals) ? parsed.goals : [],
            debts: Array.isArray(parsed.debts) ? parsed.debts : [],
            investments: Array.isArray(parsed.investments) ? parsed.investments : [],
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            familyMembers: Array.isArray(parsed.familyMembers) ? parsed.familyMembers : [
              { id: 'fam-1', name: currentUser?.name || 'Titular', email: currentUser?.email || '', role: 'admin', status: 'active', joinedAt: '2026-01-01' }
            ],
            notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
            userProfile: (() => {
              const rawTheme = parsed.userProfile?.theme || 'dark';
              let rawPreset = parsed.userProfile?.themePreset || 'sleek-neo-glass';
              if (rawTheme === 'dark' && rawPreset === 'clean-light') {
                const savedDark = (localStorage.getItem('finly_last_dark_preset') as ThemePreset);
                rawPreset = (savedDark && savedDark !== 'clean-light') ? savedDark : 'sleek-neo-glass';
              } else if (rawTheme === 'light' && rawPreset !== 'clean-light' && rawPreset !== 'linear-mono') {
                rawPreset = 'clean-light';
              }
              return {
                accentColor: parsed.userProfile?.accentColor || '#06B6D4',
                cardRadius: parsed.userProfile?.cardRadius || 'squircle',
                ...(parsed.userProfile || {}),
                themePreset: rawPreset,
                name: parsed.userProfile?.name || currentUser?.name || (isDemo ? 'Conta Demonstração' : 'Liverton'),
                email: parsed.userProfile?.email || currentUser?.email || (isDemo ? 'demo@finly.com' : 'liverton.aguiar@hotmail.com'),
                currency: parsed.userProfile?.currency || 'BRL',
                role: parsed.userProfile?.role || 'admin',
                theme: rawTheme,
                showValues: parsed.userProfile?.showValues !== false,
              };
            })(),
          });
        }
      }
    } catch (e) {
      console.error('Error loading user store:', e);
    }

    // If this is the Demo Account, initialize with full realistic demo dataset!
    if (isDemo) {
      const demo = generateRealisticDemoStore();
      try {
        localStorage.setItem(userStoreKey, JSON.stringify(demo));
      } catch (e) {}
      return sanitizeStoredData({
        accounts: demo.accounts,
        cards: demo.cards,
        categories: demo.categories,
        budgets: demo.budgets,
        goals: demo.goals,
        debts: demo.debts,
        investments: demo.investments,
        transactions: demo.transactions,
        familyMembers: demo.familyMembers,
        notifications: [],
        userProfile: {
          name: demo.userProfile?.name || 'Conta Demonstração',
          email: demo.userProfile?.email || 'demo@finly.com',
          currency: 'BRL',
          role: 'admin',
          theme: 'dark',
          themePreset: 'sleek-neo-glass',
          accentColor: '#06B6D4',
          cardRadius: 'squircle',
          showValues: true,
        },
      });
    }

    // Default clean initial store for REAL users with standard Carteira
    return {
      accounts: [DEFAULT_WALLET_ACCOUNT],
      cards: [],
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      goals: [],
      debts: [],
      investments: [],
      transactions: [],
      familyMembers: [
        { id: 'fam-1', name: currentUser?.name || 'Liverton', email: currentUser?.email || 'liverton.aguiar@hotmail.com', role: 'admin', status: 'active', joinedAt: '2026-01-01' }
      ],
      notifications: [],
      userProfile: {
        name: currentUser?.name || 'Liverton',
        email: currentUser?.email || 'liverton.aguiar@hotmail.com',
        currency: 'BRL',
        role: 'admin',
        theme: 'dark',
        themePreset: 'sleek-neo-glass',
        accentColor: '#06B6D4',
        cardRadius: 'squircle',
        showValues: true,
      },
    };
  };

  const initialStore = useMemo(() => loadUserStore(), [userId]);

  // States
  const [user, setUser] = useState<UserProfile>(initialStore.userProfile);
  const [accounts, setAccounts] = useState<Account[]>(initialStore.accounts);
  const [cards, setCards] = useState<CreditCard[]>(initialStore.cards);
  const [categories, setCategories] = useState<Category[]>(initialStore.categories);
  const [budgets, setBudgets] = useState<Budget[]>(initialStore.budgets);
  const [goals, setGoals] = useState<Goal[]>(initialStore.goals);
  const [debts, setDebts] = useState<Debt[]>(initialStore.debts);
  const [investments, setInvestments] = useState<InvestmentAsset[]>(initialStore.investments);
  const [transactions, setTransactions] = useState<Transaction[]>(initialStore.transactions);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(initialStore.familyMembers);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialStore.notifications);

  // Sync state whenever the active user changes (e.g. switching to demo mode)
  useEffect(() => {
    const store = loadUserStore();
    setUser(store.userProfile);
    setAccounts(store.accounts);
    setCards(store.cards);
    setCategories(store.categories);
    setBudgets(store.budgets);
    setGoals(store.goals);
    setDebts(store.debts);
    setInvestments(store.investments);
    setTransactions(store.transactions);
    setFamilyMembers(store.familyMembers);
    setNotifications(store.notifications);
    isStoreLoadedForUserIdRef.current = userId;
  }, [userId]);

  const [period, setPeriod] = useState<string>('this_month');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: `${getCurrentMonth()}-01`,
    end: getTodayString(),
  });

  
  // CONTINUOUS SERVER AUTO-SYNC (SUPABASE & BACKEND)
  useEffect(() => {
    if (!currentUser) return;
    apiSync.setUserId(currentUser.id);

    const isDemo = currentUser.id === 'usr-demo-financeiro' || currentUser.email === 'demo@finly.com';

    const pullData = async () => {
      if (isDemo || isResettingRef.current) return;

      let sbStore: UserStoreData | null = null;
      if (isSupabaseConfigured()) {
        try {
          sbStore = await supabaseDb.fetchUserStore(currentUser.id);
        } catch (sbErr) {
          console.warn('Supabase store fetch notice:', sbErr);
        }
      }

      // Also pull serverStore so that data from the express server is never dropped
      const serverStore = await apiSync.fetchServerStore(currentUser.id);

      const effectiveStore = sbStore || serverStore;
      if (!effectiveStore) return;

      // Reconcile cards from Supabase and Express server:
      const sbCards = Array.isArray(sbStore?.cards) ? sbStore.cards : [];
      const srvCards = Array.isArray(serverStore?.cards) ? serverStore.cards : [];

      const cardsMap = new Map<string, CreditCard>();
      srvCards.forEach((c: any) => c && c.id && cardsMap.set(c.id, c));
      sbCards.forEach((c: any) => c && c.id && cardsMap.set(c.id, c));

      if (cardsMap.size > 0) {
        setCards(Array.from(cardsMap.values()));
      }

      if (effectiveStore.accounts && effectiveStore.accounts.length > 0) {
        setAccounts(effectiveStore.accounts);
      }
      if (effectiveStore.categories) {
        setCategories(mergeCategories(effectiveStore.categories));
      }
      if (effectiveStore.budgets) setBudgets(effectiveStore.budgets);
      if (effectiveStore.goals) setGoals(effectiveStore.goals);
      if (effectiveStore.debts) setDebts(effectiveStore.debts);
      if (effectiveStore.investments) setInvestments(effectiveStore.investments);
      if (effectiveStore.transactions) {
        const sbTxs = Array.isArray(sbStore?.transactions) ? sbStore.transactions : [];
        const srvTxs = Array.isArray(serverStore?.transactions) ? serverStore.transactions : [];
        if (sbTxs.length >= srvTxs.length && sbTxs.length > 0) {
          setTransactions(sbTxs);
        } else if (srvTxs.length > 0) {
          setTransactions(srvTxs);
        }
      }
      if (Array.isArray(effectiveStore.familyMembers)) setFamilyMembers(effectiveStore.familyMembers);
      if (effectiveStore.userProfile) setUser(effectiveStore.userProfile);
    };

    pullData();

    // Sync on window focus (e.g. when user switches from mobile to PC)
    const handleFocus = () => {
      pullData();
    };

    window.addEventListener('focus', handleFocus);

    // Background Heartbeat sync every 20 seconds
    const interval = setInterval(handleFocus, 20000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  // Automatic Real-Time Persistence (local offline cache + debounced Supabase & server sync)
  useEffect(() => {
    // Only save if the store has actually been loaded for the CURRENT user (prevents wiping out data on switch)
    if (!currentUser || isStoreLoadedForUserIdRef.current !== currentUser.id) return;

    const currentStore: UserStoreData = {
      accounts,
      cards,
      categories,
      budgets,
      goals,
      debts,
      investments,
      transactions,
      familyMembers,
      notifications,
      userProfile: user,
    };

    // 1. Save to local storage as instant offline cache
    try {
      localStorage.setItem(userStoreKey, JSON.stringify(currentStore));
    } catch (e) {
      console.error('Error saving user store to localStorage:', e);
    }

    const isDemo = currentUser.id === 'usr-demo-financeiro' || currentUser.email === 'demo@finly.com';

    // 2. Primary: Supabase PostgreSQL Persistence
    if (!isDemo && isSupabaseConfigured()) {
      supabaseDb.saveEntireStore(currentUser.id, currentStore).catch(e => {
        console.warn('Supabase save error:', e);
      });
    }

    // 3. Fallback: Push to backend server
    apiSync.pushStore(currentUser.id, currentStore);
  }, [accounts, cards, categories, budgets, goals, debts, investments, transactions, familyMembers, notifications, user, userStoreKey, currentUser?.id]);

  // Pull-to-refresh & In-app manual sync handler
  const refreshData = async (): Promise<void> => {
    if (!currentUser || isResettingRef.current) return;
    try {
      // 1. Demo account handling: guarantee full realistic demo data
      if (currentUser.id === 'usr-demo-financeiro' || currentUser.email === 'demo@finly.com') {
        const store = loadUserStore();
        setUser(store.userProfile);
        setAccounts(store.accounts);
        setCards(store.cards);
        setCategories(store.categories);
        setBudgets(store.budgets);
        setGoals(store.goals);
        setDebts(store.debts);
        setInvestments(store.investments);
        setTransactions(store.transactions);
        setFamilyMembers(store.familyMembers);
        setNotifications(store.notifications);
        return;
      }

      // 2. Fetch both Supabase and Express server store for comprehensive sync
      let sbStore: UserStoreData | null = null;
      if (isSupabaseConfigured()) {
        try {
          sbStore = await supabaseDb.fetchUserStore(currentUser.id);
        } catch (sbErr) {
          console.warn('Supabase store refresh notice:', sbErr);
        }
      }

      const serverStore = await apiSync.fetchServerStore(currentUser.id);
      const effectiveStore = sbStore || serverStore;

      if (effectiveStore && (effectiveStore.accounts || effectiveStore.transactions)) {
        if (effectiveStore.accounts) {
          setAccounts(effectiveStore.accounts.length > 0 ? effectiveStore.accounts : [DEFAULT_WALLET_ACCOUNT]);
        }

        // Reconcile cards
        const sbCards = Array.isArray(sbStore?.cards) ? sbStore.cards : [];
        const srvCards = Array.isArray(serverStore?.cards) ? serverStore.cards : [];
        const cardsMap = new Map<string, CreditCard>();
        srvCards.forEach((c: any) => c && c.id && cardsMap.set(c.id, c));
        sbCards.forEach((c: any) => c && c.id && cardsMap.set(c.id, c));

        if (cardsMap.size > 0) {
          setCards(Array.from(cardsMap.values()));
        }

        if (effectiveStore.categories) setCategories(mergeCategories(effectiveStore.categories));
        if (effectiveStore.budgets) setBudgets(effectiveStore.budgets);
        if (effectiveStore.goals) setGoals(effectiveStore.goals);
        if (effectiveStore.debts) setDebts(effectiveStore.debts);
        if (effectiveStore.investments) setInvestments(effectiveStore.investments);
        if (effectiveStore.transactions) {
          const sbTxs = Array.isArray(sbStore?.transactions) ? sbStore.transactions : [];
          const srvTxs = Array.isArray(serverStore?.transactions) ? serverStore.transactions : [];
          if (sbTxs.length >= srvTxs.length && sbTxs.length > 0) {
            setTransactions(sbTxs);
          } else if (srvTxs.length > 0) {
            setTransactions(srvTxs);
          }
        }
        if (Array.isArray(effectiveStore.familyMembers)) setFamilyMembers(effectiveStore.familyMembers);
        if (Array.isArray(effectiveStore.notifications) && effectiveStore.notifications.length > 0) {
          setNotifications(effectiveStore.notifications);
        }
        if (effectiveStore.userProfile) setUser(effectiveStore.userProfile);
        return;
      } else {
        // Fallback reload from local storage
        const store = loadUserStore();
        setUser(store.userProfile);
        setAccounts(store.accounts);
        setCards(store.cards);
        setCategories(store.categories);
        setBudgets(store.budgets);
        setGoals(store.goals);
        setDebts(store.debts);
        setInvestments(store.investments);
        setTransactions(store.transactions);
        setFamilyMembers(store.familyMembers);
        setNotifications(store.notifications);
      }
    } catch (err) {
      console.warn('Sync completed with local cache fallback:', err);
    }
  };

  // Apply Dark/Light Theme & Synchronize Theme Engine
  useEffect(() => {
    const isDark = user.theme === 'dark';

    if (isDark) {
      document.documentElement.classList.add('dark');
      if (user.themePreset === 'clean-light') {
        const savedLastDark = localStorage.getItem('finly_last_dark_preset') as ThemePreset;
        const targetPreset: ThemePreset = (savedLastDark && savedLastDark !== 'clean-light') ? savedLastDark : 'sleek-neo-glass';
        const targetAccent = PRESET_COLORS[targetPreset]?.defaultAccent || '#06B6D4';
        setUser(prev => ({ ...prev, themePreset: targetPreset, accentColor: targetAccent }));
        applyTheme({ preset: targetPreset, accentColor: targetAccent, mode: 'dark' });
        return;
      }
    } else {
      document.documentElement.classList.remove('dark');
      // In light mode, allow clean-light AND linear-mono
      if (user.themePreset !== 'clean-light' && user.themePreset !== 'linear-mono') {
        if (user.themePreset) {
          localStorage.setItem('finly_last_dark_preset', user.themePreset);
        }
        const targetPreset = 'clean-light';
        const curAccent = user.accentColor;
        const targetAccent = (!curAccent || curAccent.toUpperCase() === '#FFFFFF') ? '#0284C7' : curAccent;
        setUser(prev => ({ ...prev, themePreset: targetPreset, accentColor: targetAccent }));
        applyTheme({ preset: targetPreset, accentColor: targetAccent, mode: 'light' });
        return;
      }
    }

    let effectiveAccent = user.accentColor;
    if (user.themePreset === 'linear-mono') {
      if (isDark && (!effectiveAccent || effectiveAccent === '#18181B' || effectiveAccent === '#0284C7')) {
        effectiveAccent = '#FFFFFF';
      } else if (!isDark && (!effectiveAccent || effectiveAccent.toUpperCase() === '#FFFFFF')) {
        effectiveAccent = '#18181B';
      }
    } else if (!isDark && effectiveAccent && effectiveAccent.toUpperCase() === '#FFFFFF') {
      effectiveAccent = '#0284C7';
    }

    applyTheme({
      preset: (user.themePreset as ThemePreset) || (isDark ? 'sleek-neo-glass' : 'clean-light'),
      accentColor: effectiveAccent,
      cardRadius: user.cardRadius as CardRadius,
      mode: isDark ? 'dark' : 'light',
    });
  }, [user.theme, user.themePreset]);

  // =========================================================================
  // DERIVED BALANCE RECALCULATION
  // Recompute every account balance = initialBalance + Σ completed transactions
  // This is the single source of truth and self-heals any desync.
  // =========================================================================
  useEffect(() => {
    setAccounts(prevAccounts => {
      const defaultAccId = prevAccounts[0]?.id || 'acc-carteira-padrao';
      const updated = prevAccounts.map(account => {
        let balance = account.initialBalance ?? 0;
        for (const tx of transactions) {
          if (tx.status !== 'completed') continue;
          const isThisAccount = tx.accountId === account.id || (!tx.cardId && !tx.accountId && account.id === defaultAccId);

          if (tx.type === 'income' && isThisAccount) {
            balance += tx.amount;
          } else if (tx.type === 'expense' && isThisAccount) {
            balance -= tx.amount;
          } else if (tx.type === 'transfer') {
            if (tx.accountId === account.id) balance -= tx.amount;
            if (tx.targetAccountId === account.id) balance += tx.amount;
          }
        }
        balance = round2(balance);
        return balance !== account.balance ? { ...account, balance } : account;
      });
      return updated.some((a, i) => a !== prevAccounts[i]) ? updated : prevAccounts;
    });
  }, [transactions]);

  // User Actions
  const updateUser = (data: Partial<UserProfile>) => setUser(prev => ({ ...prev, ...data }));
  const toggleHideValues = () => setUser(prev => ({ ...prev, showValues: !prev.showValues }));
  const toggleTheme = () => {
    setUser(prev => {
      const newTheme: 'light' | 'dark' = prev.theme === 'dark' ? 'light' : 'dark';
      let newPreset: ThemePreset;
      let newAccent: string;

      if (prev.themePreset === 'linear-mono') {
        newPreset = 'linear-mono';
        newAccent = newTheme === 'dark' ? '#FFFFFF' : '#18181B';
      } else if (newTheme === 'light') {
        if (prev.themePreset && prev.themePreset !== 'clean-light') {
          localStorage.setItem('finly_last_dark_preset', prev.themePreset);
        }
        newPreset = 'clean-light';
        const curAccent = localStorage.getItem('finly_accent_color');
        newAccent = (!curAccent || curAccent.toUpperCase() === '#FFFFFF') ? '#0284C7' : curAccent;
      } else {
        const savedLastDark = localStorage.getItem('finly_last_dark_preset') as ThemePreset;
        newPreset = (savedLastDark && savedLastDark !== 'clean-light')
          ? savedLastDark
          : (prev.themePreset && prev.themePreset !== 'clean-light' ? (prev.themePreset as ThemePreset) : 'sleek-neo-glass');
        newAccent = PRESET_COLORS[newPreset]?.defaultAccent || '#7C4DFF';
      }

      applyTheme({ preset: newPreset, accentColor: newAccent, mode: newTheme });
      return { ...prev, theme: newTheme, themePreset: newPreset, accentColor: newAccent };
    });
  };

  // Account Actions
  const addAccount = (acc: Omit<Account, 'id'>) => {
    const newAcc: Account = { ...acc, id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` };
    setAccounts(prev => [...prev, newAcc]);
  };

  const updateAccount = (id: string, data: Partial<Account>) => {
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)));
  };

  const deleteAccount = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
    showUndo({
      message: `Conta "${acc.name}" excluída`,
      onUndo: () => {
        setAccounts(prev => [...prev, acc]);
      },
    });
  };

  // Card Actions
  const addCard = (card: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = { ...card, id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` };
    setCards(prev => {
      const updated = [...prev, newCard];
      try {
        const raw = localStorage.getItem(userStoreKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.cards = updated;
          localStorage.setItem(userStoreKey, JSON.stringify(parsed));
        }
      } catch (e) {}
      return updated;
    });

    if (currentUser && isSupabaseConfigured()) {
      supabaseDb.upsertCard(currentUser.id, newCard).catch(e => {
        console.warn('Supabase upsertCard notice:', e);
      });
    }
  };

  const updateCard = (id: string, data: Partial<CreditCard>) => {
    setCards(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, ...data } : c));
      try {
        const raw = localStorage.getItem(userStoreKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.cards = updated;
          localStorage.setItem(userStoreKey, JSON.stringify(parsed));
        }
      } catch (e) {}
      return updated;
    });

    if (currentUser && isSupabaseConfigured()) {
      const targetCard = cards.find(c => c.id === id);
      if (targetCard) {
        supabaseDb.upsertCard(currentUser.id, { ...targetCard, ...data }).catch(() => {});
      }
    }
  };

  const deleteCard = (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    setCards(prev => {
      const updated = prev.filter(c => c.id !== id);
      try {
        const raw = localStorage.getItem(userStoreKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.cards = updated;
          localStorage.setItem(userStoreKey, JSON.stringify(parsed));
        }
      } catch (e) {}
      return updated;
    });

    if (currentUser && isSupabaseConfigured()) {
      supabaseDb.deleteCard(currentUser.id, id).catch(() => {});
    }

    showUndo({
      message: `Cartão "${card.name}" excluído`,
      onUndo: () => {
        setCards(prev => {
          const updated = [...prev, card];
          try {
            const raw = localStorage.getItem(userStoreKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              parsed.cards = updated;
              localStorage.setItem(userStoreKey, JSON.stringify(parsed));
            }
          } catch (e) {}
          return updated;
        });
        if (currentUser && isSupabaseConfigured()) {
          supabaseDb.upsertCard(currentUser.id, card).catch(() => {});
        }
      },
    });
  };

  
  const payCardInvoice = (cardId: string, accountId: string, amount: number, month: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || amount <= 0) return;

    const lockKey = `${cardId}_${month}`;
    const now = Date.now();
    if (payingInvoiceLockRef.current[lockKey] && now - payingInvoiceLockRef.current[lockKey] < 4000) {
      console.warn('⚠️ Pagamento já em processamento para este cartão. Ignorando clique duplicado.');
      return;
    }
    payingInvoiceLockRef.current[lockKey] = now;

    // Check if there is already an existing payment transaction for this card and month
    const existingPayTx = transactions.find(
      t =>
        t.tags?.includes('fatura') &&
        t.tags?.includes('cartao') &&
        t.description.includes(card.name) &&
        t.description.includes(month)
    );

    if (existingPayTx) {
      console.warn('⚠️ Fatura já consta como paga. Ignorando pagamento duplicado.');
      return;
    }

    const roundedAmount = round2(amount);

    // Balance is auto-recalculated by the derived balance effect via the payment transaction below

    // Mark card transactions of that month as completed/paid
    setTransactions(prev =>
      prev.map(t => {
        if (t.cardId === cardId && t.type === 'expense' && t.date.startsWith(month.replace('/', '-'))) {
          return { ...t, status: 'completed' };
        }
        return t;
      })
    );

    // Register invoice payment transaction in cash flow
    const payTx: Transaction = {
      id: `tx-pay-${Date.now()}`,
      description: `Pagamento Fatura ${card.name} (${month})`,
      amount: roundedAmount,
      type: 'expense',
      date: getTodayString(),
      categoryId: 'cat-fatura-cartao',
      subcategoryId: undefined,
      accountId,
      status: 'completed',
      recurring: false,
      tags: ['fatura', 'cartao'],
      notes: `Pagamento de fatura referente a ${month}`,
      createdAt: new Date().toISOString(),
    };

    setTransactions(prev => [payTx, ...prev]);
  };



  const unpayCardInvoice = (cardId: string, month: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Find all payment transactions created for this invoice
    const payTxs = transactions.filter(
      t =>
        t.tags?.includes('fatura') &&
        t.tags?.includes('cartao') &&
        t.description.includes(card.name) &&
        t.description.includes(month)
    );

    // Remove payment transactions (balance auto-recalculated by effect)
    const payTxIds = new Set(payTxs.map(t => t.id));

    // Set all card expense transactions for this month back to pending and remove payment txs
    const normalizedMonth = month.replace('/', '-');
    setTransactions(prev =>
      prev.filter(t => !payTxIds.has(t.id)).map(t => {
        if (t.cardId === cardId && t.type === 'expense' && t.date.startsWith(normalizedMonth)) {
          return { ...t, status: 'pending' };
        }
        return t;
      })
    );
  };



  // Category Actions
  const addCategory = (cat: Omit<Category, 'id' | 'subcategories'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      subcategories: [],
    };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    showUndo({
      message: `Categoria "${cat.name}" excluída`,
      onUndo: () => {
        setCategories(prev => [...prev, cat]);
      },
    });
  };

  const addSubcategory = (categoryId: string, name: string, icon?: string) => {
    const newSub = { id: `sub-${Date.now()}`, name, icon, categoryId };
    setCategories(prev =>
      prev.map(c => (c.id === categoryId ? { ...c, subcategories: [...c.subcategories, newSub] } : c))
    );
  };

  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    const sub = cat?.subcategories.find(s => s.id === subcategoryId);
    if (!sub) return;
    setCategories(prev =>
      prev.map(c =>
        c.id === categoryId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subcategoryId) } : c
      )
    );
    showUndo({
      message: `Subcategoria "${sub.name}" excluída`,
      onUndo: () => {
        setCategories(prev =>
          prev.map(c => (c.id === categoryId ? { ...c, subcategories: [...c.subcategories, sub] } : c))
        );
      },
    });
  };

  const resetCategoriesToDefault = () => {
    setCategories(DEFAULT_CATEGORIES);
  };

  // Transaction Actions
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      amount: round2(tx.amount),
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    // Balance is auto-recalculated by the derived balance effect
    setTransactions(prev => [newTx, ...prev]);
  };


  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    const newTx: Transaction = {
      ...oldTx,
      ...data,
      amount: data.amount !== undefined ? round2(data.amount) : oldTx.amount,
    };

    // Balance is auto-recalculated by the derived balance effect
    setTransactions(prev => prev.map(t => (t.id === id ? newTx : t)));
  };



  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      // If it was an invoice payment, also mark the card's expense transactions of that month back to pending
      if (tx.tags?.includes('fatura') || tx.description.toLowerCase().includes('pagamento fatura')) {
        const card = cards.find(c => tx.description.includes(c.name));
        if (card) {
          const previousTransactions = transactions;
          setTransactions(prev =>
            prev.filter(t => t.id !== id).map(t => {
              if (t.cardId === card.id && t.type === 'expense') {
                return { ...t, status: 'pending' };
              }
              return t;
            })
          );
          showUndo({
            message: `Transação "${tx.description}" excluída`,
            onUndo: () => {
              setTransactions(previousTransactions);
            },
          });
          return;
        }
      }
    }
    // Balance is auto-recalculated by the derived balance effect
    const txToDelete = tx || transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (txToDelete) {
      showUndo({
        message: `Transação "${txToDelete.description}" excluída`,
        onUndo: () => {
          setTransactions(prev => [txToDelete, ...prev]);
        },
      });
    }
  };


  const deleteMultipleTransactions = (ids: string[]) => {
    const idSet = new Set(ids);
    const deletedTxs = transactions.filter(t => idSet.has(t.id));
    if (deletedTxs.length === 0) return;
    // Balance is auto-recalculated by the derived balance effect
    setTransactions(prev => prev.filter(t => !idSet.has(t.id)));
    showUndo({
      message: `${deletedTxs.length} transações excluídas`,
      onUndo: () => {
        setTransactions(prev => [...deletedTxs, ...prev]);
      },
    });
  };

  const toggleTransactionStatus = (id: string) => {
    // Balance is auto-recalculated by the derived balance effect
    setTransactions(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        return { ...t, status: nextStatus };
      })
    );
  };

  const reimburseThirdPartyTransaction = (transactionId: string, targetAccountId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return;

    const personName = tx.thirdPartyName || 'Terceiro';
    const acc = accounts.find(a => a.id === targetAccountId) || accounts[0];

    // 1. Mark original transaction as reimbursed
    setTransactions(prev => prev.map(t => (t.id === transactionId ? { ...t, reimbursed: true } : t)));

    // 2. Add reimbursement Income transaction in account
    const reimbursementTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: `Reembolso de ${personName}: ${tx.description}`,
      amount: tx.amount,
      type: 'income',
      date: getTodayString(),
      purchaseDate: getTodayString(),
      categoryId: 'cat-outras-receitas',
      accountId: acc?.id || 'acc-carteira-padrao',
      status: 'completed',
      recurring: false,
      tags: ['Reembolso', 'Terceiros'],
      notes: `Reembolso referente à compra no cartão "${tx.description}" (${personName})`,
      createdAt: new Date().toISOString(),
    };

    setTransactions(prev => [reimbursementTx, ...prev]);
  };

  const importTransactions = (txs: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    const formatted = txs.map((tx, idx) => ({
      ...tx,
      amount: round2(tx.amount),
      id: `tx-imp-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    // Balance is auto-recalculated by the derived balance effect
    setTransactions(prev => [...formatted, ...prev]);
  };

  // Budgets
  const setCategoryBudget = (categoryId: string, limit: number, month?: string) => {
    const targetMonth = month || getCurrentMonth();
    setBudgets(prev => {
      const existing = prev.find(b => b.categoryId === categoryId && b.month === targetMonth);
      if (existing) {
        return prev.map(b => (b.id === existing.id ? { ...b, limit: round2(limit) } : b));
      }
      return [...prev, { id: `bdg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, categoryId, limit: round2(limit), month: targetMonth }];
    });
  };

  // Goals
  const addGoal = (goal: Omit<Goal, 'id' | 'deposits' | 'completed'>) => {
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}`,
      deposits: [],
      completed: goal.currentAmount >= goal.targetAmount,
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, data: Partial<Goal>) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...data } : g)));
  };

  const deleteGoal = (id: string) => {
    const g = goals.find(item => item.id === id);
    if (!g) return;
    setGoals(prev => prev.filter(item => item.id !== id));
    showUndo({
      message: `Meta "${g.title}" excluída`,
      onUndo: () => {
        setGoals(prev => [...prev, g]);
      },
    });
  };

  const depositToGoal = (goalId: string, amount: number, accountId?: string, note?: string) => {
    const dep = { id: `dep-${Date.now()}`, amount, date: getTodayString(), accountId, note };

    setGoals(prev =>
      prev.map(g => {
        if (g.id !== goalId) return g;
        const newAmt = g.currentAmount + amount;
        return {
          ...g,
          currentAmount: newAmt,
          completed: newAmt >= g.targetAmount,
          deposits: [dep, ...g.deposits],
        };
      })
    );

    if (accountId) {
      // Create an expense transaction so balance is auto-recalculated by derived effect
      const goal = goals.find(g => g.id === goalId);
      setTransactions(prev => [{
        id: `tx-goal-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        description: `Aporte Meta: ${goal?.title || 'Meta'}`,
        amount: round2(amount),
        type: 'expense' as const,
        date: getTodayString(),
        categoryId: 'cat-desp-investimentos',
        accountId,
        status: 'completed' as const,
        recurring: false,
        tags: ['meta', 'aporte'],
        createdAt: new Date().toISOString(),
      }, ...prev]);
    }
  };

  // Debts
  const addDebt = (debt: Omit<Debt, 'id' | 'remainingAmount' | 'paidInstallments' | 'payments'> & { remainingAmount?: number; paidInstallments?: number }) => {
    const paid = debt.paidInstallments ?? 0;
    const remaining = debt.remainingAmount !== undefined ? debt.remainingAmount : Math.max(0, debt.totalAmount - paid * debt.installmentAmount);
    const newDebt: Debt = {
      ...debt,
      id: `debt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      remainingAmount: remaining,
      paidInstallments: paid,
      payments: [],
    };
    setDebts(prev => [...prev, newDebt]);
  };

  const updateDebt = (id: string, data: Partial<Debt>) => {
    setDebts(prev => prev.map(d => (d.id === id ? { ...d, ...data } : d)));
  };

  const deleteDebt = (id: string) => {
    const d = debts.find(item => item.id === id);
    if (!d) return;
    setDebts(prev => prev.filter(item => item.id !== id));
    showUndo({
      message: `Dívida "${d.title}" excluída`,
      onUndo: () => {
        setDebts(prev => [...prev, d]);
      },
    });
  };

  const payDebtInstallment = (debtId: string, accountId?: string) => {
    setDebts(prev =>
      prev.map(d => {
        if (d.id !== debtId) return d;
        const paid = d.paidInstallments + 1;
        const rem = Math.max(0, d.remainingAmount - d.installmentAmount);
        const newPay = { id: `pay-${Date.now()}`, amount: d.installmentAmount, date: getTodayString(), installmentNumber: paid };
        return { ...d, paidInstallments: paid, remainingAmount: rem, payments: [newPay, ...d.payments] };
      })
    );

    const d = debts.find(item => item.id === debtId);
    if (d && accountId) {
      // Create an expense transaction so balance is auto-recalculated by derived effect
      setTransactions(prev => [{
        id: `tx-debt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        description: `Pagamento Dívida: ${d.title}`,
        amount: round2(d.installmentAmount),
        type: 'expense' as const,
        date: getTodayString(),
        categoryId: 'cat-desp-dividas',
        accountId,
        status: 'completed' as const,
        recurring: false,
        tags: ['divida', 'parcela'],
        createdAt: new Date().toISOString(),
      }, ...prev]);
    }
  };

  // Investments
  const addInvestment = (inv: Omit<InvestmentAsset, 'id' | 'updatedAt'>) => {
    const newInv: InvestmentAsset = { ...inv, id: `inv-${Date.now()}`, updatedAt: getTodayString() };
    setInvestments(prev => [...prev, newInv]);
  };

  const updateInvestment = (id: string, data: Partial<InvestmentAsset>) => {
    setInvestments(prev => prev.map(i => (i.id === id ? { ...i, ...data, updatedAt: getTodayString() } : i)));
  };

  const deleteInvestment = (id: string) => {
    const inv = investments.find(item => item.id === id);
    if (!inv) return;
    setInvestments(prev => prev.filter(item => item.id !== id));
    showUndo({
      message: `Ativo "${inv.name}" excluído`,
      onUndo: () => {
        setInvestments(prev => [...prev, inv]);
      },
    });
  };

  // Family Members
  const inviteFamilyMember = (member: Omit<FamilyMember, 'id' | 'joinedAt'>) => {
    const newMember: FamilyMember = {
      ...member,
      id: `fam-${Date.now()}`,
      joinedAt: getTodayString(),
    };
    setFamilyMembers(prev => [...prev, newMember]);
  };

  const updateFamilyMember = (id: string, data: Partial<FamilyMember>) => {
    setFamilyMembers(prev => prev.map(m => (m.id === id ? { ...m, ...data } : m)));
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  // Notifications
  const addNotification = (item: {
    title: string;
    message: string;
    type?: 'info' | 'alert' | 'success' | 'reminder';
    date?: string;
    tag?: string;
  }) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      message: item.message,
      date: item.date || new Date().toISOString(),
      read: false,
      type: item.type || 'info',
      tag: item.tag,
    };

    setNotifications(prev => {
      // Avoid duplicate alert with same title and message if recorded within the last 15 minutes
      const nowMs = new Date(newNotif.date).getTime();
      const isDuplicate = prev.some(
        n => n.title === newNotif.title && n.message === newNotif.message &&
        Math.abs(nowMs - new Date(n.date).getTime()) < 15 * 60 * 1000
      );
      if (isDuplicate) return prev;
      return [newNotif, ...prev];
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Automatically capture in-app notifications into the persistent history
  useEffect(() => {
    const handleInAppNotif = (e: any) => {
      const detail = e?.detail;
      if (!detail || !detail.title) return;

      let type: 'info' | 'alert' | 'success' | 'reminder' = 'info';
      const text = `${detail.title} ${detail.body || ''}`.toLowerCase();
      if (text.includes('🚨') || text.includes('limite') || text.includes('alerta') || text.includes('ultrapassou')) {
        type = 'alert';
      } else if (text.includes('🎉') || text.includes('meta concluída') || text.includes('parabéns')) {
        type = 'success';
      } else if (text.includes('💳') || text.includes('fatura') || text.includes('⏰') || text.includes('vence') || text.includes('lembrete')) {
        type = 'reminder';
      }

      addNotification({
        title: detail.title,
        message: detail.body || '',
        type,
        tag: detail.tag,
        date: new Date().toISOString(),
      });
    };

    window.addEventListener('finly_in_app_notification', handleInAppNotif);
    return () => window.removeEventListener('finly_in_app_notification', handleInAppNotif);
  }, []);

  // Reset / Clear Data (hard reset locally, in Supabase and on the server)
  const resetAllUserData = async () => {
    isResettingRef.current = true;

    const cleanStore: UserStoreData = {
      accounts: [DEFAULT_WALLET_ACCOUNT],
      cards: [],
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      goals: [],
      debts: [],
      investments: [],
      transactions: [],
      familyMembers: [
        { id: 'fam-1', name: currentUser?.name || 'Titular', email: currentUser?.email || '', role: 'admin', status: 'active', joinedAt: '2026-01-01' }
      ],
      notifications: [],
      userProfile: user,
    };

    // 1. Update React state immediately
    setAccounts([DEFAULT_WALLET_ACCOUNT]);
    setCards([]);
    setTransactions([]);
    setGoals([]);
    setDebts([]);
    setBudgets([]);
    setInvestments([]);
    setNotifications([]);

    // 2. Overwrite local storage immediately
    try {
      localStorage.setItem(userStoreKey, JSON.stringify(cleanStore));
    } catch (e) {
      console.error('Error saving clean store to localStorage:', e);
    }

    if (currentUser) {
      // 3. Prevent in-flight sync from reviving old data
      isStoreLoadedForUserIdRef.current = currentUser.id;

      // 4. Wipe all records in Supabase tables
      if (isSupabaseConfigured()) {
        try {
          await supabaseDb.clearUserStore(currentUser.id);
        } catch (sbErr) {
          console.warn('Supabase clear store error:', sbErr);
        }
      }

      // 5. Reset store on backend server (atomic file write on disk)
      try {
        await apiSync.resetServerStore(currentUser.id);
        apiSync.pushStore(currentUser.id, cleanStore, true);
      } catch (srvErr) {
        console.warn('Server reset store error:', srvErr);
      }
    }

    // Keep reset lock active for 1.5 seconds to ensure in-flight requests or interval ticks do not revive stale data
    setTimeout(() => {
      isResettingRef.current = false;
    }, 1500);
  };

  const clearAppCache = async () => {
    if ('caches' in window) {
      try {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      } catch (_) {}
    }
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      } catch (_) {}
    }
    window.location.reload();
  };

  const resetToCleanState = async () => {
    await resetAllUserData();
  };

  const loadDemoData = () => {
    const demo = generateRealisticDemoStore();
    setAccounts(demo.accounts);
    setCards(demo.cards);
    setCategories(demo.categories);
    setTransactions(demo.transactions);
    setBudgets(demo.budgets);
    setGoals(demo.goals);
    setDebts(demo.debts);
    setInvestments(demo.investments);
    setFamilyMembers(demo.familyMembers);
    if (demo.userProfile) setUser(prev => ({ ...prev, ...demo.userProfile }));
  };

  // Backup & Restore
  const exportBackupJSON = () => {
    const dataToExport: UserStoreData = {
      accounts,
      cards,
      categories,
      budgets,
      goals,
      debts,
      investments,
      transactions,
      familyMembers,
      notifications,
      userProfile: user,
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finly-backup-${(user.name || 'usuario').toLowerCase().replace(/\s+/g, '-')}-${getTodayString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') return false;

      if (Array.isArray(parsed.accounts)) setAccounts(parsed.accounts);
      if (Array.isArray(parsed.cards)) setCards(parsed.cards);
      if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
      if (Array.isArray(parsed.budgets)) setBudgets(parsed.budgets);
      if (Array.isArray(parsed.goals)) setGoals(parsed.goals);
      if (Array.isArray(parsed.debts)) setDebts(parsed.debts);
      if (Array.isArray(parsed.investments)) setInvestments(parsed.investments);
      if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
      if (Array.isArray(parsed.familyMembers)) setFamilyMembers(parsed.familyMembers);
      if (parsed.userProfile) setUser(prev => ({ ...prev, ...parsed.userProfile }));

      return true;
    } catch (e) {
      console.error('Error importing backup JSON:', e);
      return false;
    }
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const curMonth = getCurrentMonth();

    const filteredTransactions = transactions.filter(t => {
      if (period === 'this_month') return t.date.startsWith(curMonth);
      if (period === 'custom') return t.date >= customDateRange.start && t.date <= customDateRange.end;
      return true;
    });

    const totalBalance = accounts.reduce((sum, a) => sum + (a.includeInTotal ? a.balance : 0), 0);

    const monthlyIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    const totalInvestments = investments.reduce((sum, i) => sum + i.currentBalance, 0);
    const monthlyInvestmentYield = investments.reduce((sum, i) => sum + i.monthlyYield, 0);

    const totalDebts = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

    const totalCreditLimit = cards.reduce((sum, c) => sum + c.limit, 0);
    const totalCreditUsed = transactions.filter(t => t.cardId && t.type === 'expense' && t.status !== 'completed').reduce((sum, t) => sum + t.amount, 0);
    const totalCreditAvailable = Math.max(0, totalCreditLimit - totalCreditUsed);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlySavings,
      savingsRate,
      totalInvestments,
      monthlyInvestmentYield,
      totalDebts,
      totalCreditLimit,
      totalCreditUsed,
      totalCreditAvailable,
      filteredTransactions,
    };
  }, [accounts, transactions, period, customDateRange, investments, debts, cards]);

  return (
    <FinancialContext.Provider
      value={{
        user,
        updateUser,
        toggleHideValues,
        toggleTheme,
        period,
        setPeriod,
        customDateRange,
        setCustomDateRange,
        accounts,
        addAccount,
        updateAccount,
        deleteAccount,
        cards,
        addCard,
        updateCard,
        deleteCard,
        payCardInvoice,
        unpayCardInvoice,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        deleteSubcategory,
        resetCategoriesToDefault,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteMultipleTransactions,
        toggleTransactionStatus,
        reimburseThirdPartyTransaction,
        importTransactions,
        budgets,
        setCategoryBudget,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        depositToGoal,
        debts,
        addDebt,
        updateDebt,
        deleteDebt,
        payDebtInstallment,
        investments,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        familyMembers,
        inviteFamilyMember,
        updateFamilyMember,
        removeFamilyMember,
        notifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,
        refreshData,
        clearAppCache,
        resetAllUserData,
        exportBackupJSON,
        importBackupJSON,
        resetToCleanState,
        loadDemoData,
        metrics,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error('useFinancial must be used within a FinancialProvider');
  return context;
};
