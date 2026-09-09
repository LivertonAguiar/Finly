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
  GripVertical,
  Maximize2,
  Minimize2,
  Move,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
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
import { resolveCategory } from '../../utils/categoryResolver';
import { BankLogo, CardBrandLogo } from '../../utils/bankLogos';
import { PayInvoiceModal } from '../transactions/PayInvoiceModal';
import { Modal } from '../ui/Modal';
import { MonthPickerPopover } from '../ui/MonthPickerPopover';
import { useTranslation } from '../../utils/i18n';
import { isNativeCapacitor, isMobileDevice } from '../../utils/appUpdateService';

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
  autonomiaReserva: boolean;
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

  autonomiaReserva: true,
  receitasCategoria: true,
  balancoSemestral: false,
  balancoTrimestral: false,
  cartoes: true,
  objetivos: false,
  economiaMes: true,
  perfil: false,
};

const DEFAULT_CARDS_ORDER: string[] = [
  'despesasCategoria',
  'autonomiaReserva',
  'frequenciaGastos',
  'balancoMensal',
  'cartoes',
  'planejamento',
  'contas',
  'economiaMes',
  'receitasCategoria',
  'transacoesPendentes',
  'transacoesFavoritas',
  'calendarioMovimentacoes',
  'balancoSemestral',
  'balancoTrimestral',
  'objetivos',
  'perfil',
];

const CARDS_STORAGE_KEY = 'finly_dashboard_cards_v5';
const CARDS_ORDER_STORAGE_KEY = 'finly_dashboard_cards_order_v2';
const CARDS_SIZES_STORAGE_KEY = 'finly_dashboard_card_sizes_v2';

const DEFAULT_CARD_SIZES: Record<string, 'half' | 'full'> = {
  despesasCategoria: 'full',
};

const renderActiveDonutShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={8}
      />
    </g>
  );
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ onOpenNewTransaction, onOpenNewCard, setActiveTab, onOpenCardDetail }) => {
  const { user, metrics, categories, accounts, cards, transactions, goals, budgets, toggleTransactionStatus, toggleHideValues } = useFinancial();
  const { lang, t, translateCategory } = useTranslation();
  const isApp = isNativeCapacitor() || isMobileDevice();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedCardForPay, setSelectedCardForPay] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<{ name: string; icon: string; value: number; percentage: number; color: string; id?: string } | null>(null);
  const [hoveredIncomeCategory, setHoveredIncomeCategory] = useState<{ name: string; icon: string; value: number; percentage: number; color: string; id?: string } | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'all' | 'fixed' | 'variable'>('all');
  const [isExpandedCategoriesMobile, setIsExpandedCategoriesMobile] = useState(false);
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

  // Card Sizing State (half: 1 col, full: 2 cols / full horizontal)
  const [cardSizes, setCardSizes] = useState<Record<string, 'half' | 'full'>>(() => {
    try {
      const saved = localStorage.getItem(CARDS_SIZES_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CARD_SIZES, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return { ...DEFAULT_CARD_SIZES };
  });

  const toggleCardSize = (cardKey: string) => {
    setCardSizes((prev) => {
      const current = prev[cardKey] || (cardKey === 'despesasCategoria' ? 'full' : 'half');
      const nextSize: 'full' | 'half' = current === 'full' ? 'half' : 'full';
      const updated: Record<string, 'full' | 'half'> = { ...prev, [cardKey]: nextSize };
      try {
        localStorage.setItem(CARDS_SIZES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const setCardSizeExplicit = (cardKey: string, size: 'half' | 'full') => {
    setCardSizes((prev) => {
      const updated: Record<string, 'full' | 'half'> = { ...prev, [cardKey]: size };
      try {
        localStorage.setItem(CARDS_SIZES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Helper to format currency compactly for Donut center (e.g. R$ 1,3mil, R$ 2,8mil)
  const formatCompactCurrency = (value: number, currency: string = 'BRL', hideValues: boolean = false) => {
    if (hideValues) return '••••••';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    if (value >= 1_000_000) {
      const v = (value / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return `${symbol} ${v}mi`;
    }
    if (value >= 1_000) {
      const v = (value / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return `${symbol} ${v}mil`;
    }
    return formatCurrency(value, currency, false);
  };

  // Dynamic Card Ordering & Drag-and-Drop state
  const [dashboardCardsOrder, setDashboardCardsOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CARDS_ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((k: string) => DEFAULT_CARDS_ORDER.includes(k));
          DEFAULT_CARDS_ORDER.forEach(k => {
            if (!valid.includes(k)) valid.push(k);
          });
          return valid;
        }
      }
      // Migrate from v1 legacy columns if present
      const legacy = localStorage.getItem('finly_dashboard_cards_order_v1');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed && (Array.isArray(parsed.left) || Array.isArray(parsed.right))) {
          const left = Array.isArray(parsed.left) ? parsed.left : [];
          const right = Array.isArray(parsed.right) ? parsed.right : [];
          const combined = Array.from(new Set(['despesasCategoria', ...left, ...right]));
          const valid = combined.filter((k: string) => DEFAULT_CARDS_ORDER.includes(k));
          DEFAULT_CARDS_ORDER.forEach(k => {
            if (!valid.includes(k)) valid.push(k);
          });
          return valid;
        }
      }
    } catch (e) {}
    return [...DEFAULT_CARDS_ORDER];
  });

  const [draggedCardKey, setDraggedCardKey] = useState<string | null>(null);
  const [dragOverCardKey, setDragOverCardKey] = useState<string | null>(null);
  const [draggableCardKey, setDraggableCardKey] = useState<string | null>(null);

  const saveCardsOrder = (newOrder: string[]) => {
    setDashboardCardsOrder(newOrder);
    try {
      localStorage.setItem(CARDS_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
    } catch (e) {}
  };

  const resetCardsOrder = () => {
    saveCardsOrder([...DEFAULT_CARDS_ORDER]);
    setCardSizes({ ...DEFAULT_CARD_SIZES });
    try {
      localStorage.setItem(CARDS_SIZES_STORAGE_KEY, JSON.stringify(DEFAULT_CARD_SIZES));
    } catch (e) {}
  };

  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDraggedCardKey(key);
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCardKey !== targetKey) {
      setDragOverCardKey(targetKey);
    }
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedCardKey || draggedCardKey === targetKey) {
      setDraggedCardKey(null);
      setDragOverCardKey(null);
      setDraggableCardKey(null);
      return;
    }

    const newOrder = [...dashboardCardsOrder];
    const sourceIdx = newOrder.indexOf(draggedCardKey);
    const targetIdx = newOrder.indexOf(targetKey);

    if (sourceIdx !== -1 && targetIdx !== -1 && sourceIdx !== targetIdx) {
      // Splice & Shift: remove from original position and insert into target position
      const [movedCard] = newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, movedCard);
      saveCardsOrder(newOrder);
    }

    setDraggedCardKey(null);
    setDragOverCardKey(null);
    setDraggableCardKey(null);
  };

  const handleDragEnd = () => {
    setDraggedCardKey(null);
    setDragOverCardKey(null);
    setDraggableCardKey(null);
  };

  const updateCardState = (key: keyof DashboardCardsState, value: boolean) => {
    const updated = { ...cardsState, [key]: value };
    setCardsState(updated);
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const resetCardState = () => {
    setCardsState(DEFAULT_CARDS_STATE);
    resetCardsOrder();
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

  const monthName = viewDate.toLocaleDateString(lang || 'pt-BR', { month: 'long' });
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
    const expensesByCategory: Record<string, { amount: number; categoryId: string }> = {};
    monthTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed' && !t.ignored)
      .forEach(t => {
        const resolved = resolveCategory(categories, t.categoryId, t.subcategoryId, 'expense');
        const key = resolved.id;
        if (!expensesByCategory[key]) {
          expensesByCategory[key] = { amount: 0, categoryId: resolved.id };
        }
        expensesByCategory[key].amount += t.amount;
      });

    const total = Object.values(expensesByCategory).reduce((a, b) => a + b.amount, 0);
    if (total === 0) return [];

    return Object.entries(expensesByCategory)
      .map(([catId, item]) => {
        const resolved = resolveCategory(categories, catId, undefined, 'expense');
        const name = translateCategory(resolved.name);
        const color = resolved.color;
        const icon = resolved.icon;
        const percentage = total > 0 ? (item.amount / total) * 100 : 0;
        return { name, value: item.amount, color, icon, percentage, id: catId };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, categories, translateCategory]);

  const totalExpenseCategorySum = useMemo(() => {
    return categoryChartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryChartData]);

  // Fixed vs Variable Split for Expenses (MGO Inspired)
  const fixedVsVariable = useMemo(() => {
    const fixedKeywords = [
      'moradia', 'aluguel', 'condomínio', 'condominio', 'internet', 'água', 'agua',
      'luz', 'energia', 'plano', 'assinatura', 'streaming', 'mensalidade',
      'educação', 'educacao', 'escola', 'faculdade', 'imposto', 'seguro',
      'financiamento', 'empréstimo', 'emprestimo', 'casa', 'contas de casa',
      'tarifas bancárias', 'manutenção', 'fixo', 'fixa'
    ];

    let fixed = 0;
    let variable = 0;

    categoryChartData.forEach(c => {
      const lower = (c.name || '').toLowerCase();
      const isFixed = fixedKeywords.some(k => lower.includes(k));
      if (isFixed) {
        fixed += c.value;
      } else {
        variable += c.value;
      }
    });

    const total = fixed + variable;
    const fixedPct = total > 0 ? (fixed / total) * 100 : 0;
    const variablePct = total > 0 ? (variable / total) * 100 : 0;

    return {
      fixed,
      variable,
      fixedPct,
      variablePct,
      total,
    };
  }, [categoryChartData]);

  // Category Adherence with Budget Limits
  const categoryAdherenceList = useMemo(() => {
    const fixedKeywords = [
      'moradia', 'aluguel', 'condomínio', 'condominio', 'internet', 'água', 'agua',
      'luz', 'energia', 'plano', 'assinatura', 'streaming', 'mensalidade',
      'educação', 'educacao', 'escola', 'faculdade', 'imposto', 'seguro',
      'financiamento', 'empréstimo', 'emprestimo', 'casa', 'contas de casa',
      'tarifas bancárias', 'manutenção', 'fixo', 'fixa'
    ];

    return categoryChartData.map(c => {
      const budgetForCat = budgets.find(b => b.categoryId === c.id && (b.month === currentMonthPrefix || !b.month));
      const budgetAmount = budgetForCat ? budgetForCat.limit : 0;
      const lower = (c.name || '').toLowerCase();
      const isFixed = fixedKeywords.some(k => lower.includes(k));
      const adherence = budgetAmount > 0 ? (c.value / budgetAmount) * 100 : 100;
      return {
        ...c,
        isFixed,
        budgetAmount,
        adherence,
      };
    });
  }, [categoryChartData, budgets, currentMonthPrefix]);

  // Filtered lists for the Donut Chart & Category Breakdown based on categoryTypeFilter
  const filteredCategoryAdherenceList = useMemo(() => {
    if (categoryTypeFilter === 'fixed') {
      return categoryAdherenceList.filter(c => c.isFixed);
    }
    if (categoryTypeFilter === 'variable') {
      return categoryAdherenceList.filter(c => !c.isFixed);
    }
    return categoryAdherenceList;
  }, [categoryAdherenceList, categoryTypeFilter]);

  const filteredCategoryChartData = useMemo(() => {
    const total = filteredCategoryAdherenceList.reduce((sum, c) => sum + c.value, 0);
    return filteredCategoryAdherenceList.map(c => ({
      ...c,
      percentage: total > 0 ? (c.value / total) * 100 : 0,
    }));
  }, [filteredCategoryAdherenceList]);

  const filteredExpenseTotal = useMemo(() => {
    return filteredCategoryChartData.reduce((sum, c) => sum + c.value, 0);
  }, [filteredCategoryChartData]);

  // Autonomia de Reserva (Runway / Burn Rate)
  const runwayData = useMemo(() => {
    const totalLiquidBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const today = new Date();
    const isCurrentMonth = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();
    const daysElapsed = isCurrentMonth ? Math.max(1, today.getDate()) : new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const dailyBurn = monthlyExpense > 0 ? monthlyExpense / daysElapsed : 0;

    const daysLeft = dailyBurn > 0 && totalLiquidBalance > 0 ? Math.round(totalLiquidBalance / dailyBurn) : (totalLiquidBalance > 0 ? 365 : 0);

    const depletionDate = new Date();
    depletionDate.setDate(depletionDate.getDate() + Math.min(daysLeft, 3650));
    const depletionDateStr = depletionDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return {
      totalLiquidBalance,
      dailyBurn,
      daysLeft,
      depletionDateStr,
      status: daysLeft > 90 ? 'safe' : daysLeft >= 30 ? 'warning' : 'danger',
    };
  }, [accounts, monthlyExpense, viewDate]);

  // 2. Income by Category Donut Data
  const incomeCategoryChartData = useMemo(() => {
    const incomeByCategory: Record<string, { amount: number; categoryId: string }> = {};
    monthTransactions
      .filter(t => t.type === 'income' && t.status === 'completed' && !t.ignored)
      .forEach(t => {
        const resolved = resolveCategory(categories, t.categoryId, t.subcategoryId, 'income');
        const key = resolved.id;
        if (!incomeByCategory[key]) {
          incomeByCategory[key] = { amount: 0, categoryId: resolved.id };
        }
        incomeByCategory[key].amount += t.amount;
      });

    const total = Object.values(incomeByCategory).reduce((a, b) => a + b.amount, 0);
    if (total === 0) return [];

    const greenTones = ['#10B981', '#059669', '#34D399', '#6EE7B7', '#047857', '#86EFAC'];

    return Object.entries(incomeByCategory)
      .map(([catId, item], idx) => {
        const resolved = resolveCategory(categories, catId, undefined, 'income');
        const name = translateCategory(resolved.name);
        const color = resolved.color && resolved.color.startsWith('#') ? resolved.color : greenTones[idx % greenTones.length];
        const icon = resolved.icon;
        const percentage = total > 0 ? (item.amount / total) * 100 : 0;
        return { name, value: item.amount, color, icon, percentage, id: catId };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, categories, translateCategory]);

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

  // 7. Credit Cards Breakdown Data (Synchronized exactly with CreditTab logic)
  const cardSummaries = useMemo(() => {
    return cards.map(card => {
      const cardTxs = transactions.filter(t => t.cardId === card.id && t.type === 'expense' && !t.ignored);
      const monthTxs = cardTxs.filter(t => t.date.startsWith(currentMonthPrefix));
      const invoiceTotal = Math.round(monthTxs.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;

      const isPaid = monthTxs.length > 0 && monthTxs.every(t => t.status === 'completed');

      // Open current month invoice amount
      const currentOpenInvoice = isPaid ? 0 : invoiceTotal;
      const currentInvoicePercent = card.limit > 0 ? (currentOpenInvoice / card.limit) * 100 : 0;

      // Future unpaid installments in subsequent months
      const futureInstallmentsTxs = cardTxs.filter(t => t.status !== 'completed' && !t.date.startsWith(currentMonthPrefix));
      const futureInstallmentsTotal = Math.round(futureInstallmentsTxs.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
      const futureInstallmentsPercent = card.limit > 0 ? (futureInstallmentsTotal / card.limit) * 100 : 0;

      // Active committed limit = all unpaid/open card expense transactions
      const totalCommitted = Math.round(cardTxs.filter(t => t.status !== 'completed').reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
      const availableLimit = Math.max(0, Math.round((card.limit - totalCommitted) * 100) / 100);
      const limitUsedPercent = card.limit > 0 ? Math.min(100, (totalCommitted / card.limit) * 100) : 0;
      const isOverLimit = totalCommitted > card.limit;
      const overLimitAmount = Math.max(0, totalCommitted - card.limit);

      const viewMonthNum = viewDate.getMonth() + 1;
      const viewYearNum = viewDate.getFullYear();

      const statusInfo = calculateCardInvoiceStatus(card, viewYearNum, viewMonthNum, invoiceTotal, isPaid);
      const statusLabel = statusInfo.statusLabel;
      const statusColor = statusInfo.statusColor;
      const isOverdue = statusLabel.toLowerCase().includes('vencid');
      const isZero = invoiceTotal === 0;

      return {
        ...card,
        invoiceTotal,
        currentOpenInvoice,
        currentInvoicePercent,
        futureInstallmentsTotal,
        futureInstallmentsPercent,
        totalCommitted,
        availableLimit,
        limitUsedPercent,
        isOverLimit,
        overLimitAmount,
        statusLabel,
        statusColor,
        isPaid,
        isOverdue,
        isZero,
      };
    });
  }, [cards, transactions, currentMonthPrefix, viewDate]);

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

  // Left 1: Despesas por Categoria (Modern, Responsive & Interactive Donut)
  const renderDespesasCategoria = (isFullWidth: boolean = true) => {
    const filteredTxsForCategory = selectedCategoryFilter
      ? monthTransactions.filter(t => t.categoryId === selectedCategoryFilter && t.type === 'expense' && t.status === 'completed')
      : [];

    const activeCat = hoveredCategory || (selectedCategoryFilter ? categoryChartData.find(c => c.id === selectedCategoryFilter) : null);
    const activeIndex = filteredCategoryChartData.findIndex(c => c.id === activeCat?.id);

    const displayedCategoriesList = (!isFullWidth && !isExpandedCategoriesMobile && filteredCategoryAdherenceList.length > 5)
      ? filteredCategoryAdherenceList.slice(0, 5)
      : filteredCategoryAdherenceList;

    return (
      <div key="despesasCategoria" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
        {/* Header: 🍩 DESPESAS POR CATEGORIA ⓘ + [Todas | Fixas | Variáveis] + Mês */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold select-none shadow-2xs">
              <PieIcon className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {lang === 'en-US' ? 'EXPENSES BY CATEGORY' : lang === 'es-ES' ? 'GASTOS POR CATEGORÍA' : 'DESPESAS POR CATEGORIA'}
              </h3>
              <div className="group/tooltip relative inline-flex">
                <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tooltip:flex flex-col items-center z-30 pointer-events-none">
                  <span className="px-2.5 py-1 text-[10px] font-semibold text-white bg-slate-900 dark:bg-slate-700 rounded-md whitespace-nowrap shadow-lg">
                    {lang === 'en-US' ? 'Fixed vs Variable & Budget Adherence' : lang === 'es-ES' ? 'Fijos vs Variables y Adherencia al Presupuesto' : 'Fixas vs Variáveis e Aderência ao Orçamento'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Segment Filter Tabs */}
            <div className="inline-flex p-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[10px] font-black shadow-xs">
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('all')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  categoryTypeFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('fixed')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  categoryTypeFilter === 'fixed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Fixas
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('variable')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  categoryTypeFilter === 'variable'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Variáveis
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full shrink-0">
              {capitalizedMonth}
            </span>
          </div>
        </div>

        {filteredCategoryChartData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {categoryTypeFilter === 'fixed'
              ? 'Nenhuma despesa fixa registrada neste mês.'
              : categoryTypeFilter === 'variable'
              ? 'Nenhuma despesa variável registrada neste mês.'
              : 'Nenhuma despesa registrada neste mês.'}
          </div>
        ) : (
          <div className={isFullWidth ? "flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10 pt-2" : "space-y-4 pt-2"}>
            {/* Column 1: Donut Chart with Interactive Center Hub and Macro Split Pills */}
            <div className={`relative flex flex-col items-center justify-center shrink-0 mx-auto ${
              isFullWidth ? "w-full lg:w-[320px] my-auto" : "w-full"
            }`}>
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none" style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ outline: 'none' }}>
                    <Pie
                      data={filteredCategoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={94}
                      paddingAngle={filteredCategoryChartData.length > 1 ? 4 : 0}
                      cornerRadius={6}
                      dataKey="value"
                      stroke="transparent"
                      activeIndex={activeIndex >= 0 ? activeIndex : undefined}
                      activeShape={renderActiveDonutShape}
                      onClick={(entry, index) => {
                        const cat = filteredCategoryChartData[index];
                        if (selectedCategoryFilter === entry.id) {
                          setSelectedCategoryFilter(null);
                          setHoveredCategory(null);
                        } else {
                          setSelectedCategoryFilter(entry.id);
                          setHoveredCategory(cat);
                        }
                      }}
                      onMouseEnter={(_, index) => setHoveredCategory(filteredCategoryChartData[index])}
                      onMouseLeave={() => { if (!selectedCategoryFilter) setHoveredCategory(null); }}
                      style={{ outline: 'none' }}
                    >
                      {filteredCategoryChartData.map((entry, index) => (
                        <Cell
                          key={`cell-overview-cat-${entry.id || index}`}
                          fill={entry.color || '#7c4dff'}
                          className="cursor-pointer transition-opacity hover:opacity-90"
                          style={{ outline: 'none' }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Hub */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  {activeCat ? (
                    <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center justify-center max-w-[135px] text-center px-1 select-none">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-base mb-1 shadow-2xs transition-transform"
                        style={{ backgroundColor: `${activeCat.color || '#7c4dff'}25` }}
                      >
                        {activeCat.icon || '🏷️'}
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">
                        {activeCat.name}
                      </span>
                      <span className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-400 tracking-tight mt-0.5 whitespace-nowrap">
                        {formatCurrency(activeCat.value, user.currency, !user.showValues)}
                      </span>
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 border shadow-2xs"
                        style={{
                          backgroundColor: `${activeCat.color || '#7c4dff'}15`,
                          borderColor: `${activeCat.color || '#7c4dff'}35`,
                          color: activeCat.color || '#7c4dff',
                        }}
                      >
                        {activeCat.percentage.toFixed(1)}% do total
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center max-w-[140px] px-1 select-none">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                        {categoryTypeFilter === 'fixed' ? 'Total Fixas' : categoryTypeFilter === 'variable' ? 'Total Variáveis' : 'Total Gasto'}
                      </span>
                      <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {formatCurrency(filteredExpenseTotal, user.currency, !user.showValues)}
                      </strong>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full mt-1.5 border border-slate-200/60 dark:border-slate-700/60">
                        {filteredCategoryChartData.length} categorias
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Macro Split Pills (Fixas vs Variáveis) */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => setCategoryTypeFilter(categoryTypeFilter === 'fixed' ? 'all' : 'fixed')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                    categoryTypeFilter === 'fixed'
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                  }`}
                  title="Filtrar por despesas fixas"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>Fixas: <strong>{fixedVsVariable.fixedPct.toFixed(0)}%</strong></span>
                  <span className="text-[10px] text-slate-400">({formatCompactCurrency(fixedVsVariable.fixed, user.currency, !user.showValues)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryTypeFilter(categoryTypeFilter === 'variable' ? 'all' : 'variable')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                    categoryTypeFilter === 'variable'
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/30 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-purple-400'
                  }`}
                  title="Filtrar por despesas variáveis"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span>Variáveis: <strong>{fixedVsVariable.variablePct.toFixed(0)}%</strong></span>
                  <span className="text-[10px] text-slate-400">({formatCompactCurrency(fixedVsVariable.variable, user.currency, !user.showValues)})</span>
                </button>
              </div>
            </div>

            {/* Column 2: Category Progress & Adherence Bars + Action Footer */}
            <div className={isFullWidth ? "flex-1 min-w-0 w-full flex flex-col justify-between space-y-3" : "space-y-3"}>
              {/* Category Filter active bar */}
              {selectedCategoryFilter && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 text-xs text-purple-700 dark:text-purple-300">
                  <span className="font-bold flex items-center gap-1.5 truncate">
                    <span>Filtrando por:</span>
                    <span className="underline truncate">
                      {categoryChartData.find(c => c.id === selectedCategoryFilter)?.name}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSelectedCategoryFilter(null); setHoveredCategory(null); }}
                    className="text-[11px] font-black uppercase hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    Limpar ✕
                  </button>
                </div>
              )}

              <div className={isFullWidth ? "space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin pr-2" : "space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1"}>
                {displayedCategoriesList.map((c, index) => {
                  const isSelected = selectedCategoryFilter === c.id;
                  const isHovered = activeCat?.id === c.id;
                  const hasBudget = c.budgetAmount > 0;
                  const progressPct = hasBudget ? Math.min(100, (c.value / c.budgetAmount) * 100) : 100;
                  const isOverBudget = hasBudget && c.value > c.budgetAmount;
                  const adherenceLabel = `${progressPct.toFixed(0)}%`;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCategoryFilter(isSelected ? null : c.id)}
                      onMouseEnter={() => setHoveredCategory(c)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`group/cat cursor-pointer transition-all space-y-1.5 p-2.5 rounded-2xl border ${
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/40 ring-2 ring-purple-500/20 shadow-sm'
                          : isHovered
                          ? 'bg-slate-50 dark:bg-slate-800/60 border-purple-400/40 shadow-2xs'
                          : 'bg-white dark:bg-[#1E1E22] border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Top Row: Rank + Icon + Name + Type Tag, and Amount + Percentage */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank badge */}
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 w-4 text-center">
                            #{index + 1}
                          </span>

                          {/* Category Icon */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs transition-transform group-hover/cat:scale-105"
                            style={{
                              backgroundColor: c.color ? `${c.color}20` : '#f1f5f9',
                            }}
                          >
                            {c.icon || '🏷️'}
                          </div>

                          {/* Category Name & Type Tag */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {c.name}
                              </h4>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0 uppercase ${
                                  c.isFixed
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50'
                                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50'
                                }`}
                              >
                                {c.isFixed ? 'Fixa' : 'Var'}
                              </span>
                            </div>

                            {/* Budget or share detail */}
                            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-400 whitespace-nowrap">
                              {hasBudget ? (
                                <>
                                  <span>{formatCurrency(c.value, user.currency, !user.showValues)}</span>
                                  <span className="mx-1 text-slate-300 dark:text-slate-600">de</span>
                                  <span>{formatCurrency(c.budgetAmount, user.currency, !user.showValues)}</span>
                                </>
                              ) : (
                                <span>{c.percentage.toFixed(1)}% do total</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Right Percentage / Budget adherence */}
                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block">
                            {formatCurrency(c.value, user.currency, !user.showValues)}
                          </span>
                          <span
                            className={`text-[10px] font-black inline-block ${
                              isOverBudget
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {hasBudget ? (
                              isOverBudget ? `Estourado (${adherenceLabel})` : `${adherenceLabel} meta`
                            ) : (
                              `${c.percentage.toFixed(1)}%`
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Smooth Progress bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800/90 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(3, hasBudget ? progressPct : c.percentage))}%`,
                            backgroundColor: isOverBudget ? '#ef5350' : c.color || '#7C4DFF',
                          }}
                          className="h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile / Compact toggle if > 5 categories */}
              {filteredCategoryAdherenceList.length > 5 && !isFullWidth && (
                <button
                  type="button"
                  onClick={() => setIsExpandedCategoriesMobile(!isExpandedCategoriesMobile)}
                  className="w-full py-2 rounded-xl text-center text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
                >
                  {isExpandedCategoriesMobile ? 'Recolher categorias ▴' : `Ver todas as ${filteredCategoryAdherenceList.length} categorias ▾`}
                </button>
              )}

              {/* Drill-down transactions for selected category */}
              {selectedCategoryFilter && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C20] border border-slate-200/80 dark:border-slate-800/80 space-y-2 animate-in fade-in w-full">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Lançamentos</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                        {filteredTxsForCategory.length}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter(null)}
                      className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-36 overflow-y-auto pr-1">
                    {filteredTxsForCategory.slice(0, 10).map(tx => (
                      <div key={tx.id} className="py-2 flex items-center justify-between text-xs gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{tx.description}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{formatDate(tx.date)}</span>
                        </div>
                        <span className="font-black text-rose-600 dark:text-rose-400 shrink-0">
                          -{formatCurrency(tx.amount, user.currency, !user.showValues)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end w-full">
                <button
                  onClick={() => setActiveTab('relatorios')}
                  className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer flex items-center gap-1"
                >
                  <span>Ver Relatório Completo</span>
                  <span>→</span>
                </button>
              </div>
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
              className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
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

  // Left 8: Minhas Contas (Finly Style)
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

  // Right 0: Autonomia Financeira (Runway / Burn Rate - MGO Inspired)
  const renderAutonomiaReserva = () => (
    <div key="autonomiaReserva" className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold">
            ⏱️
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Sua reserva dá pra quantos dias?</h3>
            <p className="text-[11px] text-slate-400">Autonomia financeira e taxa de queima</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
          runwayData.status === 'safe'
            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : runwayData.status === 'warning'
            ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
            : 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          {runwayData.status === 'safe' ? 'Seguro' : runwayData.status === 'warning' ? 'Moderado' : 'Atenção'}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-2 space-y-3">
        {/* Circular Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="text-slate-100 dark:text-slate-800 stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className={`stroke-current transition-all duration-1000 ease-out ${
                runwayData.status === 'safe'
                  ? 'text-emerald-500'
                  : runwayData.status === 'warning'
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}
              strokeWidth="10"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * Math.min(100, (runwayData.daysLeft / 180) * 100)) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {runwayData.daysLeft > 365 ? '+365d' : `${runwayData.daysLeft}d`}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Autonomia
            </span>
          </div>
        </div>

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          {runwayData.dailyBurn > 0 ? (
            <>Se nada mudar, sua reserva em contas dura até <strong className="text-slate-900 dark:text-white">{runwayData.depletionDateStr}</strong>.</>
          ) : (
            <>Sem despesas registradas para calcular a taxa de queima.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#202024] border border-slate-100 dark:border-slate-800/60 text-center">
          <span className="text-[10px] text-slate-400 font-semibold block">Gasto Médio/Dia</span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            {formatCurrency(runwayData.dailyBurn, user.currency, !user.showValues)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#202024] border border-slate-100 dark:border-slate-800/60 text-center">
          <span className="text-[10px] text-slate-400 font-semibold block">Saldo em Contas</span>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(runwayData.totalLiquidBalance, user.currency, !user.showValues)}
          </span>
        </div>
      </div>
    </div>
  );

  // Right 1: Receitas por Categoria
  const renderReceitasCategoria = (isFullWidth: boolean = false) => (
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
        <div className={isFullWidth ? "flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10 pt-2" : "space-y-4 pt-2"}>
          <div className={`relative flex flex-col items-center justify-center shrink-0 mx-auto ${
            isFullWidth ? "w-full lg:w-[320px] my-auto" : "w-full"
          }`}>
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeCategoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={94}
                    paddingAngle={incomeCategoryChartData.length > 1 ? 4 : 0}
                    cornerRadius={6}
                    dataKey="value"
                    stroke="transparent"
                    activeIndex={hoveredIncomeCategory ? incomeCategoryChartData.findIndex(c => c.id === hoveredIncomeCategory.id) : undefined}
                    activeShape={renderActiveDonutShape}
                    onMouseEnter={(_, index) => setHoveredIncomeCategory(incomeCategoryChartData[index])}
                    onMouseLeave={() => setHoveredIncomeCategory(null)}
                  >
                    {incomeCategoryChartData.map((entry, index) => (
                      <Cell
                        key={`cell-overview-inc-cat-${entry.id || index}`}
                        fill={entry.color || '#10b981'}
                        className="cursor-pointer transition-opacity hover:opacity-90"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {hoveredIncomeCategory ? (
                  <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center justify-center max-w-[135px] text-center px-1 select-none">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base mb-1 shadow-2xs transition-transform"
                      style={{ backgroundColor: `${hoveredIncomeCategory.color || '#10b981'}25` }}
                    >
                      {hoveredIncomeCategory.icon || '💰'}
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">
                      {hoveredIncomeCategory.name}
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5 whitespace-nowrap">
                      {formatCurrency(hoveredIncomeCategory.value, user.currency, !user.showValues)}
                    </span>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 border shadow-2xs"
                      style={{
                        backgroundColor: `${hoveredIncomeCategory.color || '#10b981'}15`,
                        borderColor: `${hoveredIncomeCategory.color || '#10b981'}35`,
                        color: hoveredIncomeCategory.color || '#10b981',
                      }}
                    >
                      {hoveredIncomeCategory.percentage.toFixed(1)}% do total
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center max-w-[140px] text-center px-1 select-none">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                      Total Receitas
                    </span>
                    <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                      {formatCurrency(totalIncomeCategorySum, user.currency, !user.showValues)}
                    </strong>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full mt-1.5 border border-emerald-200/60 dark:border-emerald-800/60">
                      {incomeCategoryChartData.length} fontes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={isFullWidth ? "flex-1 min-w-0 w-full flex flex-col justify-between space-y-3" : "space-y-3"}>
            <div className={isFullWidth ? "space-y-2 max-h-[350px] overflow-y-auto scrollbar-thin pr-2" : "space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 max-h-48 overflow-y-auto scrollbar-thin pr-1"}>
              {(isFullWidth ? incomeCategoryChartData : incomeCategoryChartData.slice(0, 6)).map((c, i) => {
                const isHovered = hoveredIncomeCategory?.id === c.id;
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredIncomeCategory(c)}
                    onMouseLeave={() => setHoveredIncomeCategory(null)}
                    className={`flex items-center justify-between text-xs py-2 px-3 rounded-2xl border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-emerald-400/40 shadow-2xs'
                        : 'bg-white dark:bg-[#1E1E22] border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-2xs"
                        style={{ backgroundColor: `${c.color || '#10b981'}20` }}
                      >
                        {c.icon || '💰'}
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                        {c.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-900 dark:text-white font-black block">
                        {formatCurrency(c.value, user.currency, !user.showValues)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                        {c.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                onClick={() => setActiveTab('relatorios')}
                className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline uppercase tracking-wider cursor-pointer flex items-center gap-1"
              >
                <span>Ver Mais Relatórios</span>
                <span>→</span>
              </button>
            </div>
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

      <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
        {cardSummaries.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">Nenhum cartão cadastrado.</p>
        ) : (
          cardSummaries.map(card => {
            const cardColor = card.color || '#7c4dff';
            return (
            <div
              key={card.id}
              onClick={() => onOpenCardDetail ? onOpenCardDetail(card.id) : setActiveTab('cartoes')}
              className="p-3.5 rounded-2xl hover:bg-slate-100/90 dark:hover:bg-[#1E1E22] border transition-all duration-150 cursor-pointer group/card space-y-2.5 shadow-2xs"
              style={{
                backgroundColor: user.theme === 'dark' ? '#141416' : 'rgba(248, 250, 252, 0.7)',
                borderColor: `${cardColor}30`,
                borderLeftWidth: '3px',
                borderLeftColor: cardColor,
              }}
              title="Clique para ver extrato e composição da fatura"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center p-1 shrink-0 shadow-2xs border"
                    style={{
                      backgroundColor: `${cardColor}22`,
                      borderColor: `${cardColor}40`,
                    }}
                  >
                    <BankLogo nameOrId={card.bankId || card.name} fallbackBrand={card.brand} size={18} radius={5} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5 min-w-0 truncate">
                    <span className="truncate">{card.name}</span>
                    <div className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 shrink-0 border border-slate-200/50 dark:border-white/10 flex items-center justify-center" title={`Bandeira ${card.brand}`}>
                      <CardBrandLogo brand={card.brand} size={10} className="w-3.5 h-2" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover/card:opacity-100 group-hover/card:translate-x-0.5 transition-all shrink-0" />
                  </h4>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 inline-flex items-center border shadow-2xs ${card.statusColor}`}>
                    {card.statusLabel}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-black block ${card.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#ef5350]'}`}>
                    {formatCurrency(card.invoiceTotal, user.currency, !user.showValues)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {card.limitUsedPercent.toFixed(1).replace('.', ',')}% do limite
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-200/80 dark:bg-[#18181B] h-2.5 rounded-full overflow-hidden flex shadow-inner">
                {card.currentInvoicePercent > 0 && (
                  <div
                    style={{ width: `${Math.min(100, card.currentInvoicePercent)}%`, backgroundColor: cardColor }}
                    className="h-full transition-all duration-500"
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
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7c4dff]" />
                    Mês: {formatCurrency(card.invoiceTotal, user.currency, !user.showValues)}
                  </span>
                  {card.futureInstallmentsTotal > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a00]" />
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
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      Ver Composição
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={() => onOpenCardDetail ? onOpenCardDetail(card.id) : setActiveTab('cartoes')}
                      className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover/card:text-purple-600 dark:group-hover/card:text-purple-400 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
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
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      {card.invoiceTotal > 0 ? 'Pagar Fatura' : 'Adicionar despesa'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })
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
          className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer text-center"
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
          <p className="text-xs text-slate-400 truncate">{user.email || 'Usuário Finly'}</p>
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

      {/* 2. HERO BALANCE CARD */}
      <div className="p-6 rounded-[28px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5 text-center">
        <div className="space-y-1">
          <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold tracking-wide block">
            {t('common.total_balance', 'Saldo em contas')}
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
              title={user.showValues ? t('common.hide_values', 'Ocultar valores') : t('common.hide_values', 'Mostrar valores')}
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
              <span className="text-[11px] text-slate-400 font-semibold block">{t('common.incomes', 'Receitas')}</span>
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
              <span className="text-[11px] text-slate-400 font-semibold block">{t('common.expenses', 'Despesas')}</span>
              <span className="text-xs sm:text-sm font-black text-[#ef5350] block truncate">
                {formatCurrency(monthlyExpense, user.currency, !user.showValues)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PENDÊNCIAS E ALERTAS (HORIZONTAL CAROUSEL) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            {lang === 'en-US' ? 'Alerts & Reminders' : lang === 'es-ES' ? 'Alertas y Pendientes' : 'Pendências e alertas'}
          </h3>
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
              <span className="text-[11px] text-slate-400 font-medium block">
                {lang === 'en-US' ? 'Pending expenses' : lang === 'es-ES' ? 'Gastos pendientes' : 'Despesas pendentes'}
              </span>
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
              <span className="text-[11px] text-slate-400 font-medium block">
                {lang === 'en-US' ? 'Overdue invoices' : lang === 'es-ES' ? 'Facturas vencidas' : 'Faturas vencidas'}
              </span>
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
              <span className="text-[11px] text-slate-400 font-medium block">
                {lang === 'en-US' ? 'Open card bills' : lang === 'es-ES' ? 'Facturas abiertas' : 'Faturas abertas'}
              </span>
              <span className="text-xs sm:text-sm font-black text-[#26a69a]">
                {formatCurrency(openInvoicesTotal, user.currency, !user.showValues)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RESPONSIVE MODULAR GRID (DRAG AND DROP MODULAR GRID WITH RESIZABLE CARDS & DENSE PACKING) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start grid-flow-row-dense">
        {dashboardCardsOrder
          .filter((cardKey) => cardsState[cardKey as keyof DashboardCardsState])
          .map((cardKey) => {
            const cardRenderers: Record<string, (isFull: boolean) => React.ReactNode> = {
              despesasCategoria: renderDespesasCategoria,
              frequenciaGastos: renderFrequenciaGastos,
              balancoMensal: renderBalancoMensal,
              transacoesPendentes: renderTransacoesPendentes,
              planejamento: renderPlanejamento,
              transacoesFavoritas: renderTransacoesFavoritas,
              calendarioMovimentacoes: renderCalendarioMovimentacoes,
              contas: renderContas,
              autonomiaReserva: renderAutonomiaReserva,
              receitasCategoria: renderReceitasCategoria,
              balancoSemestral: renderBalancoSemestral,
              balancoTrimestral: renderBalancoTrimestral,
              cartoes: renderCartoes,
              objetivos: renderObjetivos,
              economiaMes: renderEconomiaMes,
              perfil: renderPerfil,
            };

            const renderer = cardRenderers[cardKey];
            if (!renderer) return null;

            const isFull = !isApp && (cardSizes[cardKey] || (cardKey === 'despesasCategoria' ? 'full' : 'half')) === 'full';
            const isBeingDragged = draggedCardKey === cardKey;
            const isOver = dragOverCardKey === cardKey && !isBeingDragged;

            return (
              <div
                key={cardKey}
                draggable={!isApp}
                onDragStart={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button, input, select, textarea, a, .recharts-surface, .no-drag, [role="button"], [role="tab"]')) {
                    e.preventDefault();
                    return;
                  }
                  handleDragStart(e, cardKey);
                }}
                onDragOver={(e) => handleDragOver(e, cardKey)}
                onDrop={(e) => handleDrop(e, cardKey)}
                onDragEnd={handleDragEnd}
                className={`relative group/draggable transition-all duration-200 ${
                  isFull ? 'col-span-1 md:col-span-2' : 'col-span-1'
                } ${
                  !isApp ? 'cursor-grab active:cursor-grabbing' : ''
                } ${
                  isBeingDragged
                    ? 'opacity-30 scale-[0.98] border-2 border-dashed border-purple-500/80 rounded-[28px]'
                    : isOver
                    ? 'ring-2 ring-purple-500/80 ring-offset-2 dark:ring-offset-[#121214] scale-[1.01] shadow-2xl bg-purple-500/5 rounded-[28px]'
                    : ''
                }`}
              >
                {/* Discrete Expand / Collapse Micro Button (Desktop Web Only) */}
                {!isApp && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCardSize(cardKey);
                    }}
                    className="hidden md:flex absolute top-3.5 right-3.5 z-20 w-7 h-7 rounded-lg items-center justify-center bg-white/75 dark:bg-[#18181B]/75 hover:bg-white dark:hover:bg-[#222226] border border-slate-200/60 dark:border-white/10 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 shadow-2xs opacity-0 group-hover/draggable:opacity-75 hover:!opacity-100 transition-all cursor-pointer backdrop-blur-md"
                    title={isFull ? 'Reduzir para meia largura (1 coluna)' : 'Expandir para largura total (2 colunas)'}
                  >
                    {isFull ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Fluid Reorder Insertion Indicator Overlay */}
                {isOver && (
                  <div className="absolute inset-0 z-10 pointer-events-none rounded-[28px] border-2 border-purple-500 bg-purple-500/10 flex items-center justify-center animate-in fade-in zoom-in-95 duration-150 backdrop-blur-[1px]">
                    <span className="px-3.5 py-1.5 rounded-full bg-purple-600 text-white text-xs font-black tracking-wide shadow-xl flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5" />
                      <span>Mover para esta posição</span>
                    </span>
                  </div>
                )}

                {renderer(isFull)}
              </div>
            );
          })}
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
                  Cards Principais
                </h4>

                {[
                  { key: 'despesasCategoria', label: 'Despesas por categoria' },
                  { key: 'frequenciaGastos', label: 'Frequência de gastos' },
                  { key: 'balancoMensal', label: 'Balanço mensal' },
                  { key: 'transacoesPendentes', label: 'Transações pendentes' },
                  { key: 'planejamento', label: 'Resumo do orçamento mensal' },
                  { key: 'transacoesFavoritas', label: 'Transações favoritas' },
                  { key: 'calendarioMovimentacoes', label: 'Calendário de movimentações' },
                  { key: 'contas', label: 'Minhas contas' },
                ].map(item => {
                  const checked = cardsState[item.key as keyof DashboardCardsState];
                  const isFull = (cardSizes[item.key] || (item.key === 'despesasCategoria' ? 'full' : 'half')) === 'full';

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#28282A] dark:bg-[#2C2C2E] border border-slate-700/60 dark:border-slate-800/80 hover:border-purple-500/50 hover:bg-[#323235] dark:hover:bg-[#343437] transition-all shadow-xs gap-2"
                    >
                      <div
                        onClick={() => updateCardState(item.key as keyof DashboardCardsState, !checked)}
                        className="flex items-center gap-3 cursor-pointer select-none group min-w-0 flex-1"
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

                        <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 leading-snug truncate">
                          {item.label}
                        </span>
                      </div>

                      {!isApp && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardSize(item.key);
                          }}
                          className={`hidden lg:flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all items-center gap-1 shrink-0 cursor-pointer ${
                            isFull
                              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 hover:bg-purple-600/40'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:text-slate-200'
                          }`}
                          title={isFull ? 'Largura total (2 colunas) - clique para mudar para 1 coluna' : 'Meia largura (1 coluna) - clique para mudar para 2 colunas'}
                        >
                          {isFull ? (
                            <>
                              <Minimize2 className="w-3 h-3" />
                              <span>2 cols</span>
                            </>
                          ) : (
                            <>
                              <Maximize2 className="w-3 h-3" />
                              <span>1 col</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* RIGHT COLUMN CHECKBOXES */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider text-center select-none">
                  Cards Complementares
                </h4>

                {[
                  { key: 'autonomiaReserva', label: 'Autonomia de reserva (Runway)' },
                  { key: 'receitasCategoria', label: 'Receitas por categoria' },
                  { key: 'balancoSemestral', label: 'Balanço semestral' },
                  { key: 'balancoTrimestral', label: 'Balanço trimestral' },
                  { key: 'cartoes', label: 'Cartões de crédito' },
                  { key: 'objetivos', label: 'Objetivos e metas' },
                  { key: 'economiaMes', label: 'Economia do mês atual' },
                  { key: 'perfil', label: 'Perfil de usuário' },
                ].map(item => {
                  const checked = cardsState[item.key as keyof DashboardCardsState];
                  const isFull = (cardSizes[item.key] || (item.key === 'despesasCategoria' ? 'full' : 'half')) === 'full';

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#28282A] dark:bg-[#2C2C2E] border border-slate-700/60 dark:border-slate-800/80 hover:border-purple-500/50 hover:bg-[#323235] dark:hover:bg-[#343437] transition-all shadow-xs gap-2"
                    >
                      <div
                        onClick={() => updateCardState(item.key as keyof DashboardCardsState, !checked)}
                        className="flex items-center gap-3 cursor-pointer select-none group min-w-0 flex-1"
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

                        <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 leading-snug truncate">
                          {item.label}
                        </span>
                      </div>

                      {!isApp && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardSize(item.key);
                          }}
                          className={`hidden lg:flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all items-center gap-1 shrink-0 cursor-pointer ${
                            isFull
                              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 hover:bg-purple-600/40'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:text-slate-200'
                          }`}
                          title={isFull ? 'Largura total (2 colunas) - clique para mudar para 1 coluna' : 'Meia largura (1 coluna) - clique para mudar para 2 colunas'}
                        >
                          {isFull ? (
                            <>
                              <Minimize2 className="w-3 h-3" />
                              <span>2 cols</span>
                            </>
                          ) : (
                            <>
                              <Maximize2 className="w-3 h-3" />
                              <span>1 col</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
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
