import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Calendar,
  CreditCard as CardIcon,
  CreditCard,
  Target,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  DollarSign,
  PieChart as PieIcon,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Check,
  CalendarDays,
  Star,
  User,
  ShieldCheck,
  Award,
  Zap,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency, formatDate, getTodayString, calculateCardInvoiceStatus } from '../../utils/formatters';
import { BankLogo, CardBrandLogo } from '../../utils/bankLogos';
import { PayInvoiceModal } from '../transactions/PayInvoiceModal';
import { Modal } from '../ui/Modal';
import { MonthPickerPopover } from '../ui/MonthPickerPopover';

interface OverviewTabProps {
  onOpenNewTransaction: () => void;
  onOpenNewCard?: () => void;
  setActiveTab: (tab: string) => void;
  onOpenCardDetail?: (cardId: string) => void;
}

export interface DashboardCardsState {
  // Left Column
  despesasCategoria: boolean;
  frequenciaGastos: boolean;
  balancoMensal: boolean;
  transacoesPendentes: boolean;
  planejamento: boolean;
  transacoesFavoritas: boolean;
  calendarioMovimentacoes: boolean;
  contas: boolean;

  // Right Column
  receitasCategoria: boolean;
  balancoSemestral: boolean;
  balancoTrimestral: boolean;
  cartoes: boolean;
  objetivos: boolean;
  economiaMes: boolean;
  perfil: boolean;
}

const DEFAULT_CARDS_STATE: DashboardCardsState = {
  despesasCategoria: true,
  frequenciaGastos: true,
  balancoMensal: true,
  transacoesPendentes: false,
  planejamento: true,
  transacoesFavoritas: false,
  calendarioMovimentacoes: false,
  contas: true,

  receitasCategoria: true,
  balancoSemestral: false,
  balancoTrimestral: false,
  cartoes: true,
  objetivos: false,
  economiaMes: true,
  perfil: false,
};

const CARDS_STORAGE_KEY = 'plannerfin_dashboard_cards_v4';

export const OverviewTab: React.FC<OverviewTabProps> = ({ onOpenNewTransaction, onOpenNewCard, setActiveTab, onOpenCardDetail }) => {
  const { user, metrics, categories, accounts, cards, transactions, goals, budgets, toggleTransactionStatus, toggleHideValues } = useFinancial();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedCardForPay, setSelectedCardForPay] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<{ name: string; icon: string; value: number; percentage: number; color: string; id?: string } | null>(null);
  const [hoveredIncomeCategory, setHoveredIncomeCategory] = useState<{ name: string; icon: string; value: number; percentage: number; color: string; id?: string } | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const [selectedFrequencyDay, setSelectedFrequencyDay] = useState<number | null>(null);
  const [budgetViewMode, setBudgetViewMode] = useState<'total' | 'categories'>('total');

  // Manage Home Screen Modal State
  const [isManageWidgetsOpen, setIsManageWidgetsOpen] = useState(false);
  const [cardsState, setCardsState] = useState<DashboardCardsState>(() => {
    try {
      const saved = localStorage.getItem(CARDS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CARDS_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_CARDS_STATE;
  });

  const updateCardState = (key: keyof DashboardCardsState, value: boolean) => {
    const updated = { ...cardsState, [key]: value };
    setCardsState(updated);
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const resetCardState = () => {
    setCardsState(DEFAULT_CARDS_STATE);
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(DEFAULT_CARDS_STATE));
    } catch (e) {}
  };

  // Month calculations
  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const yearNum = viewDate.getFullYear();
  const currentMonthPrefix = viewDate.toISOString().substring(0, 7);

  // Month filtered transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonthPrefix));
  }, [transactions, currentMonthPrefix]);

  const monthlyIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income' && t.status === 'completed' && !t.ignored)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthlyExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed' && !t.ignored)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthlyBalance = monthlyIncome - monthlyExpense;

  // 1. Expense by Category Donut Data
  const categoryChartData = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed' && !t.ignored)
      .forEach(t => {
        expensesByCategory[t.categoryId] = (expensesByCategory[t.categoryId] || 0) + t.amount;
      });

    const total = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Object.entries(expensesByCategory)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        const name = cat?.name || 'Outros';
        const color = cat?.color || '#94a3b8';
        const icon = cat?.icon || '📦';
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return { name, value: amount, color, icon, percentage, id: catId };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, categories]);

  const totalExpenseCategorySum = useMemo(() => {
    return categoryChartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryChartData]);

  // 2. Income by Category Donut Data
  const incomeCategoryChartData = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === 'income' && t.status === 'completed' && !t.ignored)
      .forEach(t => {
        incomeByCategory[t.categoryId] = (incomeByCategory[t.categoryId] || 0) + t.amount;
      });

    const total = Object.values(incomeByCategory).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    const greenTones = ['#10B981', '#059669', '#34D399', '#6EE7B7', '#047857', '#86EFAC'];

    return Object.entries(incomeByCategory)
      .map(([catId, amount], idx) => {
        const cat = categories.find(c => c.id === catId);
        const name = cat?.name || 'Outras Receitas';
        const color = cat?.color && cat.color.startsWith('#') ? cat.color : greenTones[idx % greenTones.length];
        const icon = cat?.icon || '💰';
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return { name, value: amount, color, icon, percentage, id: catId };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, categories]);

  const totalIncomeCategorySum = useMemo(() => {
    return incomeCategoryChartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [incomeCategoryChartData]);

  // 3. Daily Spending Frequency Data
  const dailyFrequencyData = useMemo(() => {
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const dayTotals: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      dayTotals[i] = 0;
    }

    monthTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed' && !t.ignored)
      .forEach(t => {
        const day = parseInt(t.date.split('-')[2], 10);
        if (!isNaN(day) && dayTotals[day] !== undefined) {
          dayTotals[day] += t.amount;
        }
      });

    return Object.entries(dayTotals).map(([day, amount]) => ({
      day: `D${day}`,
      dayNum: parseInt(day, 10),
      amount: Math.round(amount * 100) / 100,
    }));
  }, [monthTransactions, viewDate]);

  const maxSpendingDay = useMemo(() => {
    if (dailyFrequencyData.length === 0) return null;
    let max = dailyFrequencyData[0];
    for (const d of dailyFrequencyData) {
      if (d.amount > max.amount) max = d;
    }
    return max.amount > 0 ? max : null;
  }, [dailyFrequencyData]);

  // 4. Pending / Scheduled Transactions
  const pendingTransactions = useMemo(() => {
    return monthTransactions
      .filter(t => t.status === 'pending')
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [monthTransactions]);

  // 5. Semestral Data (6 Months)
  const semestralData = useMemo(() => {
    const list: { month: string; receitas: number; despesas: number; saldo: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(viewDate);
      d.setMonth(d.getMonth() - i);
      const prefix = d.toISOString().substring(0, 7);
      const mName = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();

      const inc = transactions
        .filter(t => t.date.startsWith(prefix) && t.type === 'income' && t.status === 'completed' && !t.ignored)
        .reduce((s, t) => s + t.amount, 0);

      const exp = transactions
        .filter(t => t.date.startsWith(prefix) && t.type === 'expense' && t.status === 'completed' && !t.ignored)
        .reduce((s, t) => s + t.amount, 0);

      list.push({
        month: mName,
        receitas: Math.round(inc),
        despesas: Math.round(exp),
        saldo: Math.round(inc - exp),
      });
    }
    return list;
  }, [transactions, viewDate]);

  // 6. Trimestral Data (3 Months)
  const trimestralData = useMemo(() => {
    return semestralData.slice(-3);
  }, [semestralData]);

  // 7. Credit Cards Breakdown Data
  const todayDay = new Date().getDate();
  const cardSummaries = useMemo(() => {
    return cards.map(card => {
      const cardTxs = transactions.filter(t => t.cardId === card.id && !t.ignored);

      const currentMonthTxs = cardTxs.filter(t => t.date.startsWith(currentMonthPrefix));

      const currentOpenInvoice = currentMonthTxs
        .filter(t => t.type === 'expense' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const futureInstallmentsTotal = cardTxs
        .filter(t => Boolean(t.installments) && t.date > currentMonthPrefix && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const invoiceTotal = currentOpenInvoice;
      const isOverLimit = invoiceTotal > card.limit;
      const overLimitAmount = isOverLimit ? invoiceTotal - card.limit : 0;
      const availableLimit = Math.max(0, card.limit - invoiceTotal);

      const currentInvoicePercent = card.limit > 0 ? (invoiceTotal / card.limit) * 100 : 0;
      const futureInstallmentsPercent = card.limit > 0 ? (futureInstallmentsTotal / card.limit) * 100 : 0;
      const limitUsedPercent = Math.min(100, currentInvoicePercent + futureInstallmentsPercent);

      const isCurrentMonth = selectedMonthOffset === 0;
      const isInvoiceClosed = isCurrentMonth
        ? todayDay > card.closingDay
        : viewDate < new Date();

      const invoicePayments = transactions.filter(
        t => t.type === 'expense' &&
             t.date.startsWith(currentMonthPrefix) &&
             t.tags?.includes('fatura_cartao') &&
             t.tags?.includes(`card_${card.id}`)
      );
      const isPaid = invoicePayments.length > 0 && invoicePayments.reduce((s, p) => s + p.amount, 0) >= invoiceTotal && invoiceTotal > 0;
      const isOverdue = isInvoiceClosed && !isPaid && (isCurrentMonth ? todayDay > card.dueDay : true);
      const isZero = invoiceTotal === 0;

      let statusLabel = 'Fatura Aberta';
      let statusColor = 'text-purple-600 dark:text-purple-400';
      if (isZero) {
        statusLabel = 'Sem Gastos';
        statusColor = 'text-slate-400';
      } else if (isPaid) {
        statusLabel = 'Fatura Paga';
        statusColor = 'text-emerald-600 dark:text-emerald-400';
      } else if (isOverdue) {
        statusLabel = 'Fatura Vencida';
        statusColor = 'text-rose-600 dark:text-rose-400';
      } else if (isInvoiceClosed) {
        statusLabel = 'Fatura Fechada';
        statusColor = 'text-amber-500 dark:text-amber-400';
      }

      return {
        ...card,
        currentOpenInvoice,
        futureInstallmentsTotal,
        invoiceTotal,
        isOverLimit,
        overLimitAmount,
        availableLimit,
        currentInvoicePercent,
        futureInstallmentsPercent,
        limitUsedPercent,
        statusLabel,
        statusColor,
        isPaid,
        isOverdue,
        isZero,
      };
    });
  }, [cards, transactions, currentMonthPrefix, todayDay, viewDate, selectedMonthOffset]);

  const totalCardInvoicesSum = useMemo(() => {
    return cardSummaries.reduce((sum, c) => sum + c.invoiceTotal, 0);
  }, [cardSummaries]);

  // Alerts & Pendencies Metrics
  const pendingExpenses = useMemo(() => {
    return monthTransactions.filter(t => t.type === 'expense' && t.status === 'pending');
  }, [monthTransactions]);
  const pendingExpensesTotal = useMemo(() => {
    return pendingExpenses.reduce((s, t) => s + t.amount, 0);
  }, [pendingExpenses]);

  const overdueInvoices = useMemo(() => {
    return cardSummaries.filter(c => c.isOverdue && !c.isPaid && c.invoiceTotal > 0);
  }, [cardSummaries]);
  const overdueInvoicesTotal = useMemo(() => {
    return overdueInvoices.reduce((s, c) => s + c.invoiceTotal, 0);
  }, [overdueInvoices]);

  const openInvoices = useMemo(() => {
    return cardSummaries.filter(c => !c.isPaid && !c.isOverdue && c.invoiceTotal > 0);
  }, [cardSummaries]);
  const openInvoicesTotal = useMemo(() => {
    return openInvoices.reduce((s, c) => s + c.invoiceTotal, 0);
  }, [openInvoices]);

  // Financial health & savings rate
  const savingsRate = monthlyIncome > 0 ? Math.max(0, ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;
  const netWorth = metrics.totalBalance - totalCardInvoicesSum;

  // 8. Calendar Movements Data
  const calendarDayInfo = useMemo(() => {
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 = Sun
    const map: Record<string, { income: number; expense: number; count: number }> = {};

    monthTransactions.forEach(t => {
      if (t.status === 'completed' && !t.ignored) {
        if (!map[t.date]) map[t.date] = { income: 0, expense: 0, count: 0 };
        if (t.type === 'income') map[t.date].income += t.amount;
        if (t.type === 'expense') map[t.date].expense += t.amount;
        map[t.date].count += 1;
      }
    });

    return { daysInMonth, firstDayOfWeek, map };
  }, [monthTransactions, viewDate]);

  // 9. Budget Summary Data
  const budgetSummary = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = monthlyExpense;
    const percent = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
    const remaining = Math.max(0, totalBudget - totalSpent);
    return { totalBudget, totalSpent, percent, remaining };
  }, [budgets, monthlyExpense]);

  // ==========================================
  // CARD RENDERERS: LEFT COLUMN
  // ==========================================

  // Left 1: Despesas por Categoria
  const renderDespesasCategoria = () => {
    const filteredTxsForCategory = selectedCategoryFilter
      ? monthTransactions.filter(t => t.categoryId === selectedCategoryFilter && t.type === 'expense' && t.status === 'completed')
      : [];

    return (
      <div key="despesasCategoria" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Despesas por categoria</h3>
            <p className="text-[11px] text-slate-400">Clique em uma categoria para filtrar</p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{capitalizedMonth}</span>
        </div>

        {categoryChartData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Nenhuma despesa registrada neste mês.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="transparent"
                    onClick={(entry) => setSelectedCategoryFilter(selectedCategoryFilter === entry.id ? null : entry.id)}
                    onMouseEnter={(_, index) => setHoveredCategory(categoryChartData[index])}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell
                        key={`cell-overview-cat-${index}`}
                        fill={entry.color}
                        className={`cursor-pointer transition-all ${
                          selectedCategoryFilter === entry.id ? 'stroke-purple-600 stroke-2 scale-105' : 'hover:opacity-90'
                        }`}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {hoveredCategory ? (
                  <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase truncate max-w-[120px]">
                      {hoveredCategory.icon} {hoveredCategory.name}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(hoveredCategory.value, user.currency, !user.showValues)}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      {hoveredCategory.percentage.toFixed(1)}%
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(totalExpenseCategorySum, user.currency, !user.showValues)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Total
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 max-h-44 overflow-y-auto scrollbar-thin pr-1">
              {categoryChartData.map((c) => {
                const isSelected = selectedCategoryFilter === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCategoryFilter(isSelected ? null : c.id)}
                    className={`flex items-center justify-between text-xs p-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        {c.icon} {c.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-900 dark:text-white font-extrabold">{formatCurrency(c.value, user.currency)}</span>
                      <span className="text-[10px] text-slate-400 block">{c.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedCategoryFilter && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-slate-800/80 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Transações ({filteredTxsForCategory.length})
                  </span>
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    Limpar filtro
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-32 overflow-y-auto pr-1">
                  {filteredTxsForCategory.map(tx => (
                    <div key={tx.id} className="py-1.5 flex items-center justify-between text-xs">
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{tx.description}</span>
                      <span className="font-black text-[#ef5350] shrink-0">{formatCurrency(tx.amount, user.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                onClick={() => setActiveTab('relatorios')}
                className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer flex items-center gap-1"
              >
                VER MAIS <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Left 2: Frequência de Gastos
  const renderFrequenciaGastos = () => {
    const selectedDayExpenses = selectedFrequencyDay
      ? monthTransactions.filter(t => {
          const d = parseInt(t.date.split('-')[2], 10);
          return d === selectedFrequencyDay && t.type === 'expense' && t.status === 'completed';
        })
      : [];

    return (
      <div key="frequenciaGastos" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Frequência de gastos</h3>
              <p className="text-[11px] text-slate-400">Clique na barra do dia para ver detalhes</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{capitalizedMonth}</span>
        </div>

        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyFrequencyData}
              margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const dayNum = state.activePayload[0].payload.dayNum;
                  setSelectedFrequencyDay(selectedFrequencyDay === dayNum ? null : dayNum);
                }
              }}
            >
              <XAxis dataKey="dayNum" stroke="#64748b" fontSize={9} tickLine={false} interval={3} />
              <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={v => `R$${v}`} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val) || 0, user.currency), 'Gasto']}
                labelFormatter={label => `Dia ${label}`}
                contentStyle={{ backgroundColor: '#18181B', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
              />
              <Bar dataKey="amount" fill="#7c4dff" radius={[4, 4, 0, 0]} className="cursor-pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {selectedFrequencyDay && (
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Gastos no <strong>Dia {selectedFrequencyDay}</strong> ({selectedDayExpenses.length})
              </span>
              <button
                onClick={() => setSelectedFrequencyDay(null)}
                className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {selectedDayExpenses.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-1">Nenhuma despesa registrada neste dia.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-28 overflow-y-auto pr-1">
                {selectedDayExpenses.map(tx => (
                  <div key={tx.id} className="py-1.5 flex items-center justify-between text-xs">
                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{tx.description}</span>
                    <span className="font-black text-[#ef5350] shrink-0">{formatCurrency(tx.amount, user.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {maxSpendingDay && !selectedFrequencyDay && (
          <div
            onClick={() => setSelectedFrequencyDay(maxSpendingDay.dayNum)}
            className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-purple-600 transition-colors"
          >
            <span>Pico de gastos: <strong className="underline">Dia {maxSpendingDay.dayNum}</strong></span>
            <span className="text-purple-600 dark:text-purple-400 font-black">{formatCurrency(maxSpendingDay.amount, user.currency)}</span>
          </div>
        )}
      </div>
    );
  };

  // Left 3: Balanço Mensal
  const renderBalancoMensal = () => (
    <div key="balancoMensal" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Balanço mensal</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">{capitalizedMonth}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold">Receitas</span>
          <span className="font-black text-[#66bb6a]">{formatCurrency(monthlyIncome, user.currency, !user.showValues)}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold">Despesas</span>
          <span className="font-black text-[#ef5350]">{formatCurrency(monthlyExpense, user.currency, !user.showValues)}</span>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-900 dark:text-white font-black uppercase">Balanço</span>
          <span className={`font-black text-sm ${monthlyBalance >= 0 ? 'text-[#66bb6a]' : 'text-[#ef5350]'}`}>
            {formatCurrency(monthlyBalance, user.currency, !user.showValues)}
          </span>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={() => setActiveTab('relatorios')}
          className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer flex items-center gap-1"
        >
          VER MAIS <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // Left 4: Transações Pendentes
  const renderTransacoesPendentes = () => (
    <div key="transacoesPendentes" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Transações pendentes</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black">
          {pendingTransactions.length} pendentes
        </span>
      </div>

      {pendingTransactions.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          <span>Nenhuma transação pendente neste mês. Tudo em dia!</span>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-48 overflow-y-auto pr-1">
          {pendingTransactions.map(tx => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{tx.description}</p>
                <span className="text-[10px] text-slate-400">{formatDate(tx.date)}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`font-black ${tx.type === 'income' ? 'text-[#66bb6a]' : 'text-[#ef5350]'}`}>
                  {formatCurrency(tx.amount, user.currency)}
                </span>
                <button
                  type="button"
                  onClick={() => toggleTransactionStatus(tx.id)}
                  className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white text-[10px] font-black transition-all cursor-pointer"
                >
                  Efetivar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Left 5: Resumo do Orçamento (Planejamento)
  const renderPlanejamento = () => {
    const budgetedCategories = budgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const spent = monthTransactions
        .filter(t => t.categoryId === b.categoryId && t.type === 'expense' && t.status === 'completed' && !t.ignored)
        .reduce((sum, t) => sum + t.amount, 0);
      const pct = b.limit > 0 ? Math.min(100, (spent / b.limit) * 100) : 0;
      return {
        ...b,
        name: cat?.name || 'Categoria',
        icon: cat?.icon || '📁',
        spent,
        pct,
      };
    });

    return (
      <div key="planejamento" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Resumo do orçamento</h3>
            <p className="text-[11px] text-slate-400">Controle de limites e metas de gastos</p>
          </div>
          {budgetSummary.totalBudget > 0 && (
            <button
              onClick={() => setBudgetViewMode(budgetViewMode === 'total' ? 'categories' : 'total')}
              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              {budgetViewMode === 'total' ? 'Ver Categorias' : 'Ver Geral'}
            </button>
          )}
        </div>

        {budgetSummary.totalBudget > 0 ? (
          <div className="space-y-3">
            {budgetViewMode === 'total' ? (
              <>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Gasto do orçamento geral</span>
                  <span className={`font-black ${budgetSummary.percent > 90 ? 'text-rose-500' : 'text-purple-600 dark:text-purple-400'}`}>
                    {budgetSummary.percent.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-[#222226] h-3 rounded-full overflow-hidden shadow-inner">
                  <div
                    style={{ width: `${budgetSummary.percent}%` }}
                    className={`h-full transition-all duration-500 ${
                      budgetSummary.percent > 90 ? 'bg-rose-500' : budgetSummary.percent > 70 ? 'bg-amber-500' : 'bg-purple-600'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>Gasto: <strong>{formatCurrency(budgetSummary.totalSpent, user.currency)}</strong></span>
                  <span>Teto: <strong>{formatCurrency(budgetSummary.totalBudget, user.currency)}</strong></span>
                </div>
              </>
            ) : (
              <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                {budgetedCategories.map(bc => (
                  <div key={bc.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{bc.icon} {bc.name}</span>
                      <span className="font-bold text-slate-500 text-[10px]">{formatCurrency(bc.spent, user.currency)} / {formatCurrency(bc.limit, user.currency)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#222226] h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${bc.pct}%` }}
                        className={`h-full ${bc.pct > 100 ? 'bg-rose-500' : 'bg-purple-600'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveTab('orcamento')}
                className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer flex items-center gap-1"
              >
                AJUSTAR ORÇAMENTO <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-slate-800/80 text-center space-y-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
              Defina o teto de gastos por categoria e acompanhe sua economia em tempo real.
            </p>
            <button
              onClick={() => setActiveTab('orcamento')}
              className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              DEFINIR MEU PLANEJAMENTO
            </button>
          </div>
        )}
      </div>
    );
  };

  // Left 6: Transações Favoritas
  const renderTransacoesFavoritas = () => (
    <div key="transacoesFavoritas" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Transações favoritas</h3>
        </div>
        <span className="text-xs text-slate-400">Atalhos rápidos</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Supermercado', icon: '🛒', cat: 'cat-alimentacao' },
          { label: 'Combustível', icon: '⛽', cat: 'cat-transporte' },
          { label: 'Almoço / Café', icon: '🍽️', cat: 'cat-alimentacao' },
          { label: 'Farmácia', icon: '💊', cat: 'cat-saude' },
          { label: 'Uber / Táxi', icon: '🚗', cat: 'cat-transporte' },
          { label: 'Renda Extra', icon: '💼', cat: 'cat-renda-extra' },
        ].map(fav => (
          <button
            key={fav.label}
            type="button"
            onClick={onOpenNewTransaction}
            className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-slate-800/80 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 text-left transition-all cursor-pointer flex items-center gap-2 group"
          >
            <span className="text-base group-hover:scale-110 transition-transform">{fav.icon}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{fav.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Left 7: Calendário de Movimentações
  const renderCalendarioMovimentacoes = () => {
    const { daysInMonth, firstDayOfWeek, map } = calendarDayInfo;
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

    const selectedDayTransactions = selectedCalendarDay
      ? monthTransactions.filter(t => t.date === selectedCalendarDay && t.status === 'completed')
      : [];

    return (
      <div key="calendarioMovimentacoes" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Calendário de Movimentações</h3>
              <p className="text-[11px] text-slate-400">Clique em qualquer dia para ver ou lançar</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{capitalizedMonth}</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <div key={i} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="h-8" />
          ))}
          {daysArray.map(day => {
            const dateStr = `${currentMonthPrefix}-${String(day).padStart(2, '0')}`;
            const info = map[dateStr];
            const hasIncome = info && info.income > 0;
            const hasExpense = info && info.expense > 0;
            const isSelected = selectedCalendarDay === dateStr;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                className={`h-8 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md scale-105'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{day}</span>
                <div className="flex gap-0.5 -mt-0.5">
                  {hasIncome && <span className="w-1 h-1 rounded-full bg-[#66bb6a]" />}
                  {hasExpense && <span className="w-1 h-1 rounded-full bg-[#ef5350]" />}
                </div>
              </button>
            );
          })}
        </div>

        {selectedCalendarDay && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-slate-800/80 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Movimentações do Dia <strong>{selectedCalendarDay.split('-')[2]}/{selectedCalendarDay.split('-')[1]}</strong> ({selectedDayTransactions.length})
              </span>
              <button
                type="button"
                onClick={() => setSelectedCalendarDay(null)}
                className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {selectedDayTransactions.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-1">Nenhuma movimentação registrada nesta data.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-32 overflow-y-auto pr-1">
                {selectedDayTransactions.map(tx => (
                  <div key={tx.id} className="py-1.5 flex items-center justify-between text-xs">
                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{tx.description}</span>
                    <span className={`font-black shrink-0 ${tx.type === 'income' ? 'text-[#66bb6a]' : 'text-[#ef5350]'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, user.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onOpenNewTransaction}
              className="w-full py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar transação nesta data
            </button>
          </div>
        )}
      </div>
    );
  };

  // Left 8: Minhas Contas (Mobills Exact Style)
  const renderContas = () => (
    <div key="contas" className="p-6 rounded-[28px] bg-white dark:bg-[#1E1E20] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-900 dark:text-white">Contas</h3>
        <button
          onClick={() => setActiveTab('contas')}
          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Gerenciar Contas"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {accounts.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">Nenhuma conta cadastrada.</p>
        ) : (
          accounts.map(acc => (
            <div
              key={acc.id}
              className="py-3 flex items-center justify-between group"
            >
              <div
                onClick={() => setActiveTab('contas')}
                className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-[#2A2A2D] flex items-center justify-center p-1.5 shrink-0 border border-slate-200 dark:border-slate-800">
                  <BankLogo nameOrId={acc.institution || acc.name} size={20} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-purple-400 transition-colors truncate">{acc.name}</p>
                  <span className={`text-xs font-black block ${acc.balance < 0 ? 'text-[#ef5350]' : 'text-slate-400 dark:text-slate-400'}`}>
                    {formatCurrency(acc.balance, user.currency, !user.showValues)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNewTransaction();
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#2A2A2D] hover:bg-purple-600 hover:text-white text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
                title={`Nova transação em ${acc.name}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
        <span className="text-slate-400 font-bold">Total</span>
        <span className={metrics.totalBalance < 0 ? 'text-[#ef5350]' : 'text-[#66bb6a]'}>
          {formatCurrency(metrics.totalBalance, user.currency, !user.showValues)}
        </span>
      </div>
    </div>
  );

  // ==========================================
  // CARD RENDERERS: RIGHT COLUMN
  // ==========================================

  // Right 1: Receitas por Categoria
  const renderReceitasCategoria = () => (
    <div key="receitasCategoria" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Receitas por categoria</h3>
          <p className="text-[11px] text-slate-400">Fontes de renda e rendimentos</p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{capitalizedMonth}</span>
      </div>

      {incomeCategoryChartData.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Nenhuma receita registrada neste mês.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeCategoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="transparent"
                  onMouseEnter={(_, index) => setHoveredIncomeCategory(incomeCategoryChartData[index])}
                  onMouseLeave={() => setHoveredIncomeCategory(null)}
                >
                  {incomeCategoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-overview-inc-cat-${index}`}
                      fill={entry.color}
                      className="cursor-pointer transition-all hover:opacity-90"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {hoveredIncomeCategory ? (
                <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase truncate max-w-[120px]">
                    {hoveredIncomeCategory.icon} {hoveredIncomeCategory.name}
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(hoveredIncomeCategory.value, user.currency, !user.showValues)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                    {hoveredIncomeCategory.percentage.toFixed(1)}%
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(totalIncomeCategorySum, user.currency, !user.showValues)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Total Receitas
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 max-h-40 overflow-y-auto scrollbar-thin pr-1">
            {incomeCategoryChartData.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                    {c.icon} {c.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-900 dark:text-white font-extrabold">{formatCurrency(c.value, user.currency)}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">{c.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
            <button
              onClick={() => setActiveTab('relatorios')}
              className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline uppercase tracking-wider cursor-pointer flex items-center gap-1"
            >
              VER MAIS <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Right 2: Balanço Semestral
  const renderBalancoSemestral = () => (
    <div key="balancoSemestral" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Balanço semestral (6 meses)</h3>
          <p className="text-[11px] text-slate-400">Comparativo histórico de receitas x despesas</p>
        </div>
        <span className="text-xs text-slate-400 font-bold">Semestre</span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={semestralData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="month" stroke="#64748b" fontSize={9} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={v => `R$${v}`} />
            <Tooltip
              formatter={(val: any, name: any) => [formatCurrency(Number(val) || 0, user.currency), name === 'receitas' ? 'Receitas' : 'Despesas']}
              contentStyle={{ backgroundColor: '#18181B', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
            />
            <Bar dataKey="receitas" fill="#66bb6a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="despesas" fill="#ef5350" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#66bb6a]" /> Receitas</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef5350]" /> Despesas</span>
      </div>
    </div>
  );

  // Right 3: Balanço Trimestral
  const renderBalancoTrimestral = () => (
    <div key="balancoTrimestral" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Balanço trimestral (3 meses)</h3>
          <p className="text-[11px] text-slate-400">Tendência recente de fluxo de caixa</p>
        </div>
        <span className="text-xs text-slate-400 font-bold">Trimestre</span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trimestralData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={v => `R$${v}`} />
            <Tooltip
              formatter={(val: any, name: any) => [formatCurrency(Number(val) || 0, user.currency), name === 'receitas' ? 'Receitas' : 'Despesas']}
              contentStyle={{ backgroundColor: '#18181B', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
            />
            <Bar dataKey="receitas" fill="#66bb6a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" fill="#ef5350" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#66bb6a]" /> Receitas</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef5350]" /> Despesas</span>
      </div>
    </div>
  );

  // Right 4: Cartões de Crédito
  const renderCartoes = () => (
    <div key="cartoes" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Cartões de crédito</h3>
          <p className="text-[11px] text-slate-400">Faturas, limites e vencimentos</p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{capitalizedMonth}</span>
      </div>

      <div className="space-y-4 max-h-[480px] overflow-y-auto scrollbar-thin pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
        {cardSummaries.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">Nenhum cartão cadastrado.</p>
        ) : (
          cardSummaries.map(card => (
            <div
              key={card.id}
              onClick={() => onOpenCardDetail ? onOpenCardDetail(card.id) : setActiveTab('cartoes')}
              className="pt-3.5 first:pt-0 space-y-2 p-2.5 -mx-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#222226] transition-all cursor-pointer group/card border border-transparent hover:border-purple-500/30"
              title="Clique para ver extrato e composição da fatura"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider group-hover/card:text-purple-600 dark:group-hover/card:text-purple-400 transition-colors flex items-center gap-1">
                    {card.name}
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/card:opacity-100 transition-opacity text-purple-500" />
                  </h4>
                  <span className={`text-[11px] font-bold ${card.statusColor}`}>{card.statusLabel}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black block ${card.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#ef5350]'}`}>
                    {formatCurrency(card.invoiceTotal, user.currency, !user.showValues)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {card.limitUsedPercent.toFixed(1).replace('.', ',')}% do limite
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-[#18181B] h-3 rounded-full overflow-hidden flex shadow-inner">
                {card.currentInvoicePercent > 0 && (
                  <div
                    style={{ width: `${Math.min(100, card.currentInvoicePercent)}%` }}
                    className="h-full bg-[#7c4dff] transition-all duration-500"
                    title={`Fatura deste mês: ${formatCurrency(card.currentOpenInvoice, user.currency)}`}
                  />
                )}
                {card.futureInstallmentsPercent > 0 && (
                  <div
                    style={{ width: `${Math.min(100 - Math.min(100, card.currentInvoicePercent), card.futureInstallmentsPercent)}%` }}
                    className="h-full bg-[#ff8a00] transition-all duration-500"
                    title={`Parcelas futuras: ${formatCurrency(card.futureInstallmentsTotal, user.currency)}`}
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 flex-wrap gap-1">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1 text-[#7c4dff]">
                    <span className="w-2 h-2 rounded-full bg-[#7c4dff]" />
                    Mês: {formatCurrency(card.invoiceTotal, user.currency, !user.showValues)}
                  </span>
                  {card.futureInstallmentsTotal > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-[#ff8a00]" />
                      Futuras: {formatCurrency(card.futureInstallmentsTotal, user.currency, !user.showValues)}
                    </span>
                  )}
                </div>

                {card.isOverLimit ? (
                  <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                    Excedeu: {formatCurrency(card.overLimitAmount, user.currency, !user.showValues)}
                  </span>
                ) : (
                  <span>
                    Disp: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(card.availableLimit, user.currency, !user.showValues)}</strong>
                  </span>
                )}
              </div>

              <div className="pt-1 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                {card.isPaid ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fatura Paga
                    </span>
                    <button
                      onClick={() => onOpenCardDetail ? onOpenCardDetail(card.id) : setActiveTab('cartoes')}
                      className="text-[11px] font-bold text-slate-400 hover:text-purple-600 hover:underline cursor-pointer"
                    >
                      Ver Composição
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={() => onOpenCardDetail ? onOpenCardDetail(card.id) : setActiveTab('cartoes')}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Ver Composição <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (card.invoiceTotal > 0) {
                          setSelectedCardForPay(card.id);
                          setIsInvoiceModalOpen(true);
                        } else {
                          if (onOpenCardDetail) onOpenCardDetail(card.id);
                          else setActiveTab('cartoes');
                        }
                      }}
                      className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      {card.invoiceTotal > 0 ? 'Pagar Fatura' : 'Adicionar despesa'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 font-bold uppercase block">TOTAL</span>
          <span className="text-sm font-black text-[#ef5350]">
            {formatCurrency(totalCardInvoicesSum, user.currency, !user.showValues)}
          </span>
        </div>

        <button
          onClick={() => setActiveTab('cartoes')}
          className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer flex items-center gap-1"
        >
          VER MAIS <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // Right 5: Seus Objetivos
  const renderObjetivos = () => (
    <div key="objetivos" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Seus objetivos</h3>
        </div>
        <button
          onClick={() => setActiveTab('metas')}
          className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer"
        >
          Ver todos
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-slate-800/80 text-center space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">Você ainda não definiu metas financeiras.</p>
          <button
            onClick={() => setActiveTab('metas')}
            className="px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-bold cursor-pointer hover:bg-purple-700"
          >
            Criar meu primeiro objetivo
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {goals.slice(0, 3).map(goal => {
            const percent = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            return (
              <div
                key={goal.id}
                onClick={() => setActiveTab('metas')}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-slate-800/80 space-y-2 cursor-pointer hover:border-purple-500/60 transition-all group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 transition-colors">{goal.icon} {goal.title}</span>
                  <span className="font-black text-purple-600 dark:text-purple-400">{percent.toFixed(0)}%</span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${percent}%` }} className="h-full bg-purple-600 rounded-full transition-all duration-500" />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  <span>Acumulado: <strong>{formatCurrency(goal.currentAmount, user.currency)}</strong></span>
                  <span>Meta: <strong>{formatCurrency(goal.targetAmount, user.currency)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Right 6: Economia no Mês Atual (Meu Desempenho)
  const renderEconomiaMes = () => (
    <div key="economiaMes" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Economia no mês atual</h3>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
          {savingsRate > 20 ? 'Excelente' : savingsRate > 0 ? 'Bom' : 'Atenção'}
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl shrink-0">
          🎯
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Taxa de poupança: <strong className="text-purple-600 dark:text-purple-400">{savingsRate.toFixed(1)}%</strong> da sua renda poupada neste mês.
          </p>
          <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
            {monthlyBalance >= 0 ? `Economia de ${formatCurrency(monthlyBalance, user.currency)}` : `Déficit de ${formatCurrency(Math.abs(monthlyBalance), user.currency)}`}
          </p>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={() => setActiveTab('orcamento')}
          className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/20 transition-all cursor-pointer text-center"
        >
          VER METAS & PLANEJAMENTO
        </button>
      </div>
    </div>
  );

  // Right 7: Informações de Perfil
  const renderPerfil = () => (
    <div key="perfil" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Informações de perfil</h3>
        <button
          onClick={() => setActiveTab('perfil')}
          className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer"
        >
          Editar
        </button>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-400 truncate">{user.email || 'Usuário PlannerFin'}</p>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-500">Patrimônio Líquido</span>
        <span className="font-black text-emerald-600 dark:text-emerald-400">
          {formatCurrency(netWorth, user.currency, !user.showValues)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in pb-16">
      {/* 1. TOPBAR HEADER (CENTERED MONTH PICKER + CUSTOMIZE ACTION) */}
      <div className="relative flex items-center justify-center px-1 py-1">
        {/* Centered Month Picker Popover */}
        <MonthPickerPopover
          selectedDate={viewDate}
          onChangeMonth={(newDate) => {
            const now = new Date();
            const diffMonths = (newDate.getFullYear() - now.getFullYear()) * 12 + (newDate.getMonth() - now.getMonth());
            setSelectedMonthOffset(diffMonths);
          }}
        />

        {/* Right Action: Personalizar Widgets */}
        <div className="absolute right-1 flex items-center gap-2">
          <button
            onClick={() => setIsManageWidgetsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800/80 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-purple-400 hover:border-purple-500/50 shadow-xs transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">Personalizar</span>
          </button>
        </div>
      </div>

      {/* 2. MOBILLS EXACT HERO BALANCE CARD */}
      <div className="p-6 rounded-[28px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5 text-center">
        <div className="space-y-1">
          <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold tracking-wide block">
            Saldo em contas
          </span>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(metrics.totalBalance, user.currency, !user.showValues)}
            </h1>
          </div>
          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              onClick={toggleHideValues}
              className="p-1.5 rounded-full text-slate-400 hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-[#222226] transition-colors cursor-pointer"
              title={user.showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {user.showValues ? (
                <Eye className="w-4.5 h-4.5 text-slate-400 hover:text-purple-400 transition-colors" />
              ) : (
                <EyeOff className="w-4.5 h-4.5 text-purple-400" />
              )}
            </button>
          </div>
        </div>

        {/* RECEITAS & DESPESAS CAPSULE CARDS */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {/* Receitas */}
          <div
            onClick={() => setActiveTab('transacoes')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-100 dark:border-slate-800/60 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform text-left"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black shrink-0">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 font-semibold block">Receitas</span>
              <span className="text-xs sm:text-sm font-black text-[#66bb6a] block truncate">
                {formatCurrency(monthlyIncome, user.currency, !user.showValues)}
              </span>
            </div>
          </div>

          {/* Despesas */}
          <div
            onClick={() => setActiveTab('transacoes')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-100 dark:border-slate-800/60 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform text-left"
          >
            <div className="w-9 h-9 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center font-black shrink-0">
              <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 font-semibold block">Despesas</span>
              <span className="text-xs sm:text-sm font-black text-[#ef5350] block truncate">
                {formatCurrency(monthlyExpense, user.currency, !user.showValues)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PENDÊNCIAS E ALERTAS (MOBILLS STYLE HORIZONTAL CAROUSEL) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Pendências e alertas</h3>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {/* Alert 1: Despesas pendentes */}
          <div
            onClick={() => setActiveTab('transacoes')}
            className="min-w-[160px] sm:min-w-[190px] p-4 rounded-[22px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-xs cursor-pointer hover:border-purple-500/50 transition-all space-y-2 snap-start flex-1"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#222226] flex items-center justify-center text-slate-400">
                <ArrowDownRight className="w-4 h-4 text-slate-300" />
              </div>
              {pendingExpenses.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black">
                  +{pendingExpenses.length}
                </span>
              )}
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Despesas pendentes</span>
              <span className="text-xs sm:text-sm font-black text-[#ef5350]">
                {formatCurrency(pendingExpensesTotal, user.currency, !user.showValues)}
              </span>
            </div>
          </div>

          {/* Alert 2: Faturas vencidas */}
          <div
            onClick={() => {
              if (overdueInvoices.length > 0 && onOpenCardDetail) {
                onOpenCardDetail(overdueInvoices[0].id);
              } else {
                setActiveTab('cartoes');
              }
            }}
            className="min-w-[160px] sm:min-w-[190px] p-4 rounded-[22px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-xs cursor-pointer hover:border-purple-500/50 transition-all space-y-2 snap-start flex-1"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#222226] flex items-center justify-center text-slate-400">
                <FileText className="w-4 h-4 text-slate-300" />
              </div>
              {overdueInvoices.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black">
                  +{overdueInvoices.length}
                </span>
              )}
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Faturas vencidas</span>
              <span className="text-xs sm:text-sm font-black text-[#ef5350]">
                {formatCurrency(overdueInvoicesTotal, user.currency, !user.showValues)}
              </span>
            </div>
          </div>

          {/* Alert 3: Faturas abertas */}
          <div
            onClick={() => {
              if (openInvoices.length > 0 && onOpenCardDetail) {
                onOpenCardDetail(openInvoices[0].id);
              } else {
                setActiveTab('cartoes');
              }
            }}
            className="min-w-[160px] sm:min-w-[190px] p-4 rounded-[22px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-xs cursor-pointer hover:border-purple-500/50 transition-all space-y-2 snap-start flex-1"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#222226] flex items-center justify-center text-teal-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Faturas abertas</span>
              <span className="text-xs sm:text-sm font-black text-[#26a69a]">
                {formatCurrency(openInvoicesTotal, user.currency, !user.showValues)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TWO-COLUMN RESPONSIVE LAYOUT (MOBILLS MODULAR GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN CARDS */}
        <div className="space-y-6">
          {cardsState.despesasCategoria && renderDespesasCategoria()}
          {cardsState.frequenciaGastos && renderFrequenciaGastos()}
          {cardsState.balancoMensal && renderBalancoMensal()}
          {cardsState.transacoesPendentes && renderTransacoesPendentes()}
          {cardsState.planejamento && renderPlanejamento()}
          {cardsState.transacoesFavoritas && renderTransacoesFavoritas()}
          {cardsState.calendarioMovimentacoes && renderCalendarioMovimentacoes()}
          {cardsState.contas && renderContas()}
        </div>

        {/* RIGHT COLUMN CARDS */}
        <div className="space-y-6">
          {cardsState.receitasCategoria && renderReceitasCategoria()}
          {cardsState.balancoSemestral && renderBalancoSemestral()}
          {cardsState.balancoTrimestral && renderBalancoTrimestral()}
          {cardsState.cartoes && renderCartoes()}
          {cardsState.objetivos && renderObjetivos()}
          {cardsState.economiaMes && renderEconomiaMes()}
          {cardsState.perfil && renderPerfil()}
        </div>
      </div>

      {/* 3. BOTTOM BUTTON: "GERENCIAR TELA INICIAL" */}
      <div className="pt-8 flex justify-center">
        <button
          onClick={() => setIsManageWidgetsOpen(true)}
          className="px-8 py-3.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:border-purple-500 hover:text-purple-600 shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-2.5"
        >
          <SlidersHorizontal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>GERENCIAR TELA INICIAL</span>
        </button>
      </div>

      {/* 4. MODAL: "QUAIS CARDS VOCÊ DESEJA QUE APAREÇA NO DASHBOARD?" */}
      {isManageWidgetsOpen && (
        <Modal
          isOpen={isManageWidgetsOpen}
          onClose={() => setIsManageWidgetsOpen(false)}
          title="Quais cards você deseja que apareça no dashboard?"
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto pr-1">
              {/* LEFT COLUMN CHECKBOXES */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider text-center select-none">
                  Cards da esquerda
                </h4>

                {[
                  { key: 'despesasCategoria', label: 'Mostrar gráfico de despesas por categoria?' },
                  { key: 'frequenciaGastos', label: 'Mostrar gráfico de frequência de gastos?' },
                  { key: 'balancoMensal', label: 'Mostrar gráfico do balanço mensal?' },
                  { key: 'transacoesPendentes', label: 'Mostrar transações pendentes?' },
                  { key: 'planejamento', label: 'Mostrar resumo do orçamento do mês atual?' },
                  { key: 'transacoesFavoritas', label: 'Mostrar transações favoritas?' },
                  { key: 'calendarioMovimentacoes', label: 'Mostrar calendário de Movimentações?' },
                  { key: 'contas', label: 'Mostrar minhas contas?' },
                ].map(item => {
                  const checked = cardsState[item.key as keyof DashboardCardsState];
                  return (
                    <label
                      key={item.key}
                      onClick={() => updateCardState(item.key as keyof DashboardCardsState, !checked)}
                      className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#28282A] dark:bg-[#2C2C2E] border border-slate-700/60 dark:border-slate-800/80 hover:border-purple-500/50 hover:bg-[#323235] dark:hover:bg-[#343437] transition-all cursor-pointer select-none group shadow-xs"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          checked
                            ? 'bg-purple-600 text-white'
                            : 'border-2 border-slate-500 group-hover:border-purple-400 bg-transparent'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 leading-snug">
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* RIGHT COLUMN CHECKBOXES */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider text-center select-none">
                  Cards da direita
                </h4>

                {[
                  { key: 'receitasCategoria', label: 'Mostrar gráfico de receitas por categoria?' },
                  { key: 'balancoSemestral', label: 'Mostrar gráfico do balanço semestral?' },
                  { key: 'balancoTrimestral', label: 'Mostrar gráfico do balanço trimestral?' },
                  { key: 'cartoes', label: 'Mostrar informações de cartão de crédito?' },
                  { key: 'objetivos', label: 'Mostrar seus objetivos?' },
                  { key: 'economiaMes', label: 'Mostrar informações da economia no mês atual?' },
                  { key: 'perfil', label: 'Mostrar informações de perfil?' },
                ].map(item => {
                  const checked = cardsState[item.key as keyof DashboardCardsState];
                  return (
                    <label
                      key={item.key}
                      onClick={() => updateCardState(item.key as keyof DashboardCardsState, !checked)}
                      className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#28282A] dark:bg-[#2C2C2E] border border-slate-700/60 dark:border-slate-800/80 hover:border-purple-500/50 hover:bg-[#323235] dark:hover:bg-[#343437] transition-all cursor-pointer select-none group shadow-xs"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          checked
                            ? 'bg-purple-600 text-white'
                            : 'border-2 border-slate-500 group-hover:border-purple-400 bg-transparent'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 leading-snug">
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-700/60 dark:border-slate-800 flex items-center justify-between select-none">
              <button
                type="button"
                onClick={resetCardState}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManageWidgetsOpen(false)}
                className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
              >
                Concluir
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Payment Modal */}
      {isInvoiceModalOpen && (
        <PayInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedCardForPay(null);
          }}
          initialCardId={selectedCardForPay || undefined}
        />
      )}
    </div>
  );
};
