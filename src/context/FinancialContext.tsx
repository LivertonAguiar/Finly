import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  addDebt: (debt: Omit<Debt, 'id' | 'remainingAmount' | 'paidInstallments' | 'payments'>) => void;
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
  inviteFamilyMember: (name: string, email: string, role: 'admin' | 'editor' | 'viewer') => void;
  removeFamilyMember: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Data Management & Backups
  clearAppCache: () => void;
  resetAllUserData: () => void;
  exportBackupJSON: () => void;
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
  if (typeof obj === 'string') {
    let str = obj as string;
    return str
      .replace(/🛡️|🛡️/g, '🛡️')
      .replace(/✈️|✈️/g, '✈️')
      .replace(/👋/g, '👋')
      .replace(/💰/g, '💰')
      .replace(/💵/g, '💵')
      .replace(/💳/g, '💳')
      .replace(/🏦/g, '🏦')
      .replace(/📈/g, '📈')
      .replace(/💸/g, '💸')
      .replace(/💎/g, '💎')
      .replace(/🍽️|🍽️/g, '🍽️')
      .replace(/ðŸ›’/g, '🛒')
      .replace(/ðŸ •/g, '🍕')
      .replace(/â˜•/g, '☕')
      .replace(/ðŸ¥–/g, '🥖')
      .replace(/🏠/g, '🏠') as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeStoredData) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const res: any = {};
    for (const k of Object.keys(obj)) {
      res[k] = sanitizeStoredData((obj as any)[k]);
    }
    return res;
  }
  return obj;
}

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser ? currentUser.id : 'guest';
  const userStoreKey = `plannerfin_user_${userId}_store`;

  // Helper to load user's initial state
  const loadUserStore = (): UserStoreData => {
    try {
      const saved = localStorage.getItem(userStoreKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeStoredData({
          accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
          cards: Array.isArray(parsed.cards) ? parsed.cards : [],
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
          budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
          goals: Array.isArray(parsed.goals) ? parsed.goals : [],
          debts: Array.isArray(parsed.debts) ? parsed.debts : [],
          investments: Array.isArray(parsed.investments) ? parsed.investments : [],
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          familyMembers: Array.isArray(parsed.familyMembers) ? parsed.familyMembers : [
            { id: 'fam-1', name: currentUser?.name || 'Titular', email: currentUser?.email || '', role: 'admin', status: 'active', joinedAt: '2026-01-01' }
          ],
          notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
          userProfile: parsed.userProfile || {
            name: currentUser?.name || 'Liverton',
            email: currentUser?.email || 'liverton.aguiar@hotmail.com',
            currency: 'BRL',
            role: 'admin',
            theme: 'dark',
            showValues: true,
          },
        });
      }
    } catch (e) {
      console.error('Error loading user store:', e);
    }

    // Default initial seeded store for new sessions/mobile devices
    return {
      accounts: SEED_ACCOUNTS,
      cards: SEED_CARDS,
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      goals: [
        { id: 'goal-1', title: 'Reserva de Emergência', targetAmount: 30000.00, currentAmount: 18500.00, deadline: '2026-12-31', color: '#10b981', icon: '🛡️', category: 'Segurança', deposits: [], completed: false }
      ],
      debts: [],
      investments: [
        { id: 'inv-1', name: 'Tesouro Selic 2029', type: 'fixed', institution: 'Banco Inter', investedAmount: 5000.00, currentBalance: 5450.00, monthlyYield: 45.00, yieldPercentage: 0.9, updatedAt: '2026-08-30' }
      ],
      transactions: SEED_TRANSACTIONS,
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

  const [period, setPeriod] = useState<string>('this_month');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: `${getCurrentMonth()}-01`,
    end: getTodayString(),
  });

  // Reload state whenever active user changes
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
  }, [userId]);

  // Automatic Real-Time Persistence
  useEffect(() => {
    try {
      const dataToSave: UserStoreData = {
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
      localStorage.setItem(userStoreKey, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Error saving user store:', e);
    }
  }, [userStoreKey, accounts, cards, categories, budgets, goals, debts, investments, transactions, familyMembers, notifications, user]);

  // Apply Dark/Light Theme
  useEffect(() => {
    if (user.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user.theme]);

  // User Actions
  const updateUser = (data: Partial<UserProfile>) => setUser(prev => ({ ...prev, ...data }));
  const toggleHideValues = () => setUser(prev => ({ ...prev, showValues: !prev.showValues }));
  const toggleTheme = () => setUser(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));

  // Account Actions
  const addAccount = (acc: Omit<Account, 'id'>) => {
    const newAcc: Account = { ...acc, id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` };
    setAccounts(prev => [...prev, newAcc]);
  };

  const updateAccount = (id: string, data: Partial<Account>) => {
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  // Card Actions
  const addCard = (card: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = { ...card, id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` };
    setCards(prev => [...prev, newCard]);
  };

  const updateCard = (id: string, data: Partial<CreditCard>) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

    const payCardInvoice = (cardId: string, accountId: string, amount: number, month: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Deduct from paying account
    setAccounts(prev => prev.map(a => (a.id === accountId ? { ...a, balance: round2(a.balance - amount) } : a)));

    // Mark card transactions of that month as completed/paid
    setTransactions(prev =>
      prev.map(t => {
        if (t.cardId === cardId && t.type === 'expense' && t.date.startsWith(month)) {
          return { ...t, status: 'completed' };
        }
        return t;
      })
    );

    // Register invoice payment transaction in cash flow
    const payTx: Transaction = {
      id: `tx-pay-${Date.now()}`,
      description: `Pagamento Fatura ${card.name} (${month})`,
      amount,
      type: 'expense',
      date: getTodayString(),
      categoryId: 'cat-financas-desp',
      subcategoryId: 'sub-tarifas',
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

    // Find any payment transaction created for this invoice
    const payTx = transactions.find(
      t =>
        t.tags?.includes('fatura') &&
        t.tags?.includes('cartao') &&
        t.description.includes(card.name) &&
        t.description.includes(month)
    );

    // If a payment transaction existed and had an account, restore the money
    if (payTx && payTx.accountId) {
      setAccounts(prev =>
        prev.map(a => (a.id === payTx.accountId ? { ...a, balance: round2(a.balance + payTx.amount) } : a))
      );
      // Remove payment transaction
      setTransactions(prev => prev.filter(t => t.id !== payTx.id));
    }

    // Set all card expense transactions for this month back to pending
    setTransactions(prev =>
      prev.map(t => {
        if (t.cardId === cardId && t.type === 'expense' && t.date.startsWith(month)) {
          return { ...t, status: 'pending' };
        }
        return t;
      })
    );
  };


  // Category Actions
  const addCategory = (cat: Omit<Category, 'id' | 'subcategories'>) => {
    const newCat: Category = { ...cat, id: `cat-${Date.now()}`, subcategories: [] };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addSubcategory = (categoryId: string, name: string, icon?: string) => {
    const newSub = { id: `sub-${Date.now()}`, name, icon: icon || '📁', categoryId };
    setCategories(prev => prev.map(c => (c.id === categoryId ? { ...c, subcategories: [...c.subcategories, newSub] } : c)));
  };

  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCategories(prev => prev.map(c => (c.id === categoryId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subcategoryId) } : c)));
  };

  const resetCategoriesToDefault = () => {
    setCategories(DEFAULT_CATEGORIES);
  };

  // Transaction Actions
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    if (newTx.status === 'completed') {
      if (newTx.type === 'income' && newTx.accountId) {
        setAccounts(prev => prev.map(a => (a.id === newTx.accountId ? { ...a, balance: round2(a.balance + newTx.amount) } : a)));
      } else if (newTx.type === 'expense' && newTx.accountId) {
        setAccounts(prev => prev.map(a => (a.id === newTx.accountId ? { ...a, balance: round2(a.balance - newTx.amount) } : a)));
      } else if (newTx.type === 'transfer' && newTx.accountId && newTx.targetAccountId) {
        setAccounts(prev =>
          prev.map(a => {
            if (a.id === newTx.accountId) return { ...a, balance: a.balance - newTx.amount };
            if (a.id === newTx.targetAccountId) return { ...a, balance: a.balance + newTx.amount };
            return a;
          })
        );
      }
    }

    setTransactions(prev => [newTx, ...prev]);
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const deleteMultipleTransactions = (ids: string[]) => {
    const idSet = new Set(ids);
    setTransactions(prev => prev.filter(t => !idSet.has(t.id)));
  };

  const toggleTransactionStatus = (id: string) => {
    setTransactions(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        return { ...t, status: nextStatus };
      })
    );
  };

  const importTransactions = (txs: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    const formatted = txs.map((tx, idx) => ({
      ...tx,
      id: `tx-imp-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));
    setTransactions(prev => [...formatted, ...prev]);
  };

  // Budgets
  const setCategoryBudget = (categoryId: string, limit: number, month: string = getCurrentMonth()) => {
    setBudgets(prev => {
      const idx = prev.findIndex(b => b.categoryId === categoryId && b.month === month);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], limit };
        return copy;
      }
      return [...prev, { id: `b-${Date.now()}`, categoryId, month, limit }];
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
    setGoals(prev => prev.filter(g => g.id !== id));
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
      setAccounts(prev => prev.map(a => (a.id === accountId ? { ...a, balance: a.balance - amount } : a)));
    }
  };

  // Debts
  const addDebt = (debt: Omit<Debt, 'id' | 'remainingAmount' | 'paidInstallments' | 'payments'>) => {
    const newDebt: Debt = {
      ...debt,
      id: `debt-${Date.now()}`,
      remainingAmount: debt.totalAmount,
      paidInstallments: 0,
      payments: [],
    };
    setDebts(prev => [...prev, newDebt]);
  };

  const updateDebt = (id: string, data: Partial<Debt>) => {
    setDebts(prev => prev.map(d => (d.id === id ? { ...d, ...data } : d)));
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
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
      setAccounts(prev => prev.map(a => (a.id === accountId ? { ...a, balance: a.balance - d.installmentAmount } : a)));
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
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  // Family Members
  const inviteFamilyMember = (name: string, email: string, role: 'admin' | 'editor' | 'viewer') => {
    const newMember: FamilyMember = { id: `fam-${Date.now()}`, name, email, role, status: 'pending', joinedAt: getTodayString() };
    setFamilyMembers(prev => [...prev, newMember]);
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Reset / Clear Data
  const resetAllUserData = () => {
    setAccounts([]);
    setCards([]);
    setTransactions([]);
    setGoals([]);
    setDebts([]);
    setBudgets([]);
    setInvestments([]);
    localStorage.setItem(userStoreKey, JSON.stringify({
      accounts: [],
      cards: [],
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      goals: [],
      debts: [],
      investments: [],
      transactions: [],
      familyMembers,
      notifications: [],
      userProfile: user,
    }));
  };

  const clearAppCache = () => {
    resetAllUserData();
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload();
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
    a.download = `plannerfin-backup-${user.name.toLowerCase().replace(/\s+/g, '-')}-${getTodayString()}.json`;
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
    const totalCreditUsed = transactions.filter(t => t.cardId && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
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
        removeFamilyMember,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        clearAppCache,
        resetAllUserData,
        exportBackupJSON,
        importBackupJSON,
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
