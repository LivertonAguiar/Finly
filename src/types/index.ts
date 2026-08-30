export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment';
export type TransactionStatus = 'completed' | 'pending' | 'scheduled';
export type AccountType = 'checking' | 'savings' | 'investment' | 'cash' | 'other';
export type InvestmentType = 'fixed' | 'stocks' | 'fiis' | 'crypto' | 'funds' | 'other';

export interface Subcategory {
  id: string;
  name: string;
  icon?: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'transfer';
  subcategories: Subcategory[];
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  institution: string;
  color: string;
  includeInTotal: boolean;
  accountNumber?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  defaultAccountId?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO format: YYYY-MM-DD
  categoryId: string;
  subcategoryId?: string;
  accountId?: string;
  targetAccountId?: string; // For transfers
  cardId?: string; // For credit card expenses
  status: TransactionStatus;
  recurring: boolean;
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  installments?: {
    current: number;
    total: number;
    parentId?: string;
  };
  tags: string[];
  notes?: string;
  attachmentUrl?: string;
  invoiceMonth?: string; // e.g. "2026-08"
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  month: string; // YYYY-MM
  limit: number;
}

export interface GoalDeposit {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
  category?: string;
  deposits: GoalDeposit[];
  imageUrl?: string;
  status?: 'active' | 'paused' | 'completed';
  completed: boolean;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  installmentNumber: number;
}

export interface Debt {
  id: string;
  title: string;
  creditor: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  dueDay: number;
  nextDueDate: string;
  notes?: string;
  payments: DebtPayment[];
}

export interface InvestmentAsset {
  id: string;
  name: string;
  ticker?: string;
  type: InvestmentType;
  institution: string;
  investedAmount: number;
  currentBalance: number;
  quantity?: number;
  averagePrice?: number;
  currentPrice?: number;
  monthlyYield: number;
  yieldPercentage: number;
  updatedAt: string;
}

export interface UserProfile {
  language?: 'pt-BR' | 'en-US' | 'es-ES';
  themePreset?: 'planner-dark' | 'plannerfin-dark' | 'midnight-oled' | 'emerald-slate' | 'clean-light' | 'warm-sand';
  accentColor?: string;
  cardRadius?: 'sharp' | 'medium' | 'rounded';
  name: string;
  email: string;
  phone?: string;
  whatsappPhone?: string;
  avatarUrl?: string;
  currency: string;
  role: 'user' | 'consultor' | 'admin';
  theme: 'light' | 'dark' | 'system';
  showValues: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  type?: 'linked' | 'unlinked';
  isOwner?: boolean;
  joinedAt: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  videoUrl?: string;
  durationMinutes: number;
  completed: boolean;
  description?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  modules: CourseModule[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'alert' | 'success' | 'reminder';
}