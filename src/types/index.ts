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
  bankId?: string;
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
  debtId?: string; // Vinculado a uma dívida ou financiamento
  debtInstallmentNumber?: number; // Número da parcela correspondente (ex: 1, 2, ... total)
  tags: string[];
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  reminder?: {
    enabled: boolean;
    reminderTime?: string; // e.g. "09:00"
    daysBefore?: number; // 0 = no dia do vencimento, 1 = 1 dia antes, 2 = 2 dias antes, 7 = 1 semana antes
  };
  invoiceMonth?: string; // e.g. "2026-08"
  dueDate?: string; // Data de vencimento da fatura (Regime de Caixa)
  purchaseDate?: string; // Data em que a compra ocorreu (Regime de Competência)
  ignored?: boolean; // Ignora transação em relatórios, orçamentos e despesas pessoais
  isThirdParty?: boolean; // Compra feita para terceiro / cartão emprestado
  thirdPartyName?: string; // Nome da pessoa para quem comprou (ex: "Carlos", "Mãe")
  reimbursed?: boolean; // Se o terceiro já pagou/reembolsou o valor
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

export type DebtContractType = 'loan' | 'real_estate' | 'vehicle';
export type AmortizationSystem = 'PRICE' | 'SAC';
export type DebtIndexer = 'TR' | 'IPCA' | 'FIXED';

export interface Debt {
  id: string;
  title: string;
  creditor: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number; // Taxa nominal anual (%)
  effectiveInterestRate?: number; // Taxa efetiva anual (%)
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  dueDay: number;
  nextDueDate: string;
  notes?: string;
  payments: DebtPayment[];

  // Campos avançados para financiamentos estruturados (Imobiliário / Veicular)
  contractType?: DebtContractType;
  amortizationSystem?: AmortizationSystem;
  indexer?: DebtIndexer;
  indexerRate?: number; // Taxa do indexador vigente (% a.m.)
  insuranceMonthly?: number; // Seguro consolidado MIP + DFI
  adminFeeMonthly?: number; // Taxa operacional / de administração
  contractNumber?: string; // Número do contrato bancário
  anniversaryDay?: number; // Dia de aniversário do saldo
  defaultAccountId?: string; // Conta bancária padrão vinculada para pagamento das parcelas
  syncToTransactions?: boolean; // Se as parcelas estão sincronizadas no extrato de transações
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
  themePreset?:
    | 'sleek-obsidian'
    | 'sleek-neo-glass'
    | 'tech-green'
    | 'swiss-navy'
    | 'linear-mono'
    | 'finly-dark'
    | 'finly-deep-dark'
    | 'midnight-oled'
    | 'emerald-slate'
    | 'clean-light'
    | 'warm-sand';
  accentColor?: string;
  cardRadius?: 'sharp' | 'medium' | 'rounded' | 'squircle';
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

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'alert' | 'success' | 'reminder';
  tag?: string;
}