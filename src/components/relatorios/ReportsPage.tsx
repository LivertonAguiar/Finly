import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Download,
  Calendar,
  X,
  Check,
  FileText,
  FileSpreadsheet,
  LayoutGrid,
  Maximize2,
  Building,
  HeartPulse,
  GitCompare,
} from 'lucide-react';
import { ComparativeReport } from './ComparativeReport';
import { FinancingReport } from './FinancingReport';
import { Health503020Report } from './Health503020Report';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { resolveCategory } from '../../utils/categoryResolver';
import { getEffectiveTransactionDate } from '../../utils/invoiceCalculator';
import { FilterPopover, FilterState } from '../ui/FilterPopover';
import { Modal } from '../ui/Modal';
import { exportReportPDF, exportReportCSV } from '../../utils/reportExportService';
import { exportReportExcel } from '../../utils/excelExportService';
import html2canvas from 'html2canvas';

type TabType = 'donut' | 'line' | 'bar';

type DonutSubtype =
  | 'despesas_categoria'
  | 'despesas_contas'
  | 'receitas_categoria'
  | 'receitas_contas'
  | 'saldos_contas';

type LineSubtype =
  | 'despesas_mes'
  | 'despesas_semana'
  | 'despesas_ano';

type BarSubtype =
  | 'balanco_mensal'
  | 'fluxo_caixa_anual'
  | 'despesas_dia_semana';

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

export type ReportMainTab = 'overview' | 'comparatives' | 'financing' | 'health_50_30_20';
export type ReportLayoutMode = 'focused' | 'bento';

export const ReportsPage: React.FC = () => {
  const { transactions, categories, accounts, cards, user, debts, budgets } = useFinancial();

  // Módulo Principal de Relatórios
  const [mainTab, setMainTab] = useState<ReportMainTab>('overview');

  // Alternador de visualização: Grade Bento vs Modo Focado
  const [layoutMode, setLayoutMode] = useState<ReportLayoutMode>(() => {
    try {
      return (localStorage.getItem('finly_reports_layout_mode') as ReportLayoutMode) || 'focused';
    } catch (e) {
      return 'focused';
    }
  });

  const handleToggleLayout = () => {
    const nextMode = layoutMode === 'focused' ? 'bento' : 'focused';
    setLayoutMode(nextMode);
    try {
      localStorage.setItem('finly_reports_layout_mode', nextMode);
    } catch (e) {}
  };

  // Tab State da Visão Geral: 'donut' | 'line' | 'bar'
  const [activeTab, setActiveTab] = useState<TabType>('donut');

  // Subtypes for each tab
  const [donutSubtype, setDonutSubtype] = useState<DonutSubtype>('despesas_categoria');
  const [lineSubtype, setLineSubtype] = useState<LineSubtype>('despesas_mes');
  const [barSubtype, setBarSubtype] = useState<BarSubtype>('balanco_mensal');
  const [hoveredDonutItem, setHoveredDonutItem] = useState<any>(null);

  // Dropdown open state
  const [isSubtypeDropdownOpen, setIsSubtypeDropdownOpen] = useState(false);

  // Export report dropdown state
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const chartCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Month navigation
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Unified Filter State
  const [filters, setFilters] = useState<FilterState>({
    period: 'current_month',
    customStartDate: '',
    customEndDate: '',
    selectedUserIds: [],
    selectedAccountIds: [],
    selectedCardIds: [],
    selectedCategoryIds: [],
    status: 'all',
    type: 'all',
  });

  // Base Date
  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const yearNum = viewDate.getFullYear();
  const currentMonthPrefix = viewDate.toISOString().substring(0, 7);

  const [viewRegime, setViewRegime] = useState<'due_date' | 'purchase_date'>('due_date');

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = getTodayString();

    return transactions
      .map(t => {
        const card = cards.find(c => c.id === t.cardId);
        const effectiveDate = getEffectiveTransactionDate(t, card, viewRegime);
        return effectiveDate === t.date ? t : { ...t, date: effectiveDate };
      })
      .filter(t => {
        // Exclude ignored / third-party transactions from personal spending reports
        if (t.ignored) return false;

        // Period Matching
        const period = filters.period || 'current_month';
        if (period === 'current_month') {
          if (!t.date.startsWith(currentMonthPrefix)) return false;
        } else if (period === 'today') {
          if (t.date !== todayStr) return false;
        } else if (period === 'week') {
          const d = new Date(t.date + 'T12:00:00');
          const firstDayOfWeek = new Date(now);
          firstDayOfWeek.setDate(now.getDate() - now.getDay());
          const lastDayOfWeek = new Date(firstDayOfWeek);
          lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
          if (d < firstDayOfWeek || d > lastDayOfWeek) return false;
        } else if (period === 'last_30_days') {
          const d = new Date(t.date + 'T12:00:00');
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (d < thirtyDaysAgo || d > now) return false;
        } else if (period === 'prev_month') {
          const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const prevPrefix = prev.toISOString().substring(0, 7);
          if (!t.date.startsWith(prevPrefix)) return false;
        } else if (period === 'next_month') {
          const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const nextPrefix = next.toISOString().substring(0, 7);
          if (!t.date.startsWith(nextPrefix)) return false;
        } else if (period === 'current_year') {
          if (!t.date.startsWith(String(now.getFullYear()))) return false;
        } else if (period === 'custom') {
          if (filters.customStartDate && t.date < filters.customStartDate) return false;
          if (filters.customEndDate && t.date > filters.customEndDate) return false;
        }

        // Status filter
        if (filters.status && filters.status !== 'all' && t.status !== filters.status) return false;

        // Account filter
        if (filters.selectedAccountIds && filters.selectedAccountIds.length > 0) {
          if (!t.accountId || !filters.selectedAccountIds.includes(t.accountId)) return false;
        }

        // Card filter
        if (filters.selectedCardIds && filters.selectedCardIds.length > 0) {
          if (!t.cardId || !filters.selectedCardIds.includes(t.cardId)) return false;
        }

        // Category filter
        if (filters.selectedCategoryIds && filters.selectedCategoryIds.length > 0) {
          const resolved = resolveCategory(categories, t.categoryId, t.subcategoryId, t.type);
          if (!filters.selectedCategoryIds.includes(t.categoryId) && !filters.selectedCategoryIds.includes(resolved.id)) {
            return false;
          }
        }

        // User filter
        if (filters.selectedUserIds && filters.selectedUserIds.length > 0) {
          if ((t as any).userId && !filters.selectedUserIds.includes((t as any).userId)) return false;
        }

        return true;
      });
  }, [transactions, filters, viewRegime, cards, currentMonthPrefix, categories]);

  // Executive totals for report exports
  const reportTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      let activeChartImage: string | undefined = undefined;
      const activeChartTitle =
        activeTab === 'donut'
          ? (donutSubtype === 'despesas_categoria' ? 'Despesas por categorias' : donutSubtype === 'despesas_contas' ? 'Despesas por contas' : donutSubtype === 'receitas_categoria' ? 'Receitas por categorias' : donutSubtype === 'receitas_contas' ? 'Receitas por contas' : 'Saldos por conta')
          : activeTab === 'line'
          ? (lineSubtype === 'despesas_mes' ? 'Despesas do mês (diário)' : lineSubtype === 'despesas_semana' ? 'Despesas da semana' : 'Despesas por ano (mensal)')
          : (barSubtype === 'balanco_mensal' ? 'Balanço mensal (6 meses)' : barSubtype === 'fluxo_caixa_anual' ? 'Fluxo de caixa anual' : 'Despesas x dia da semana');

      if (chartCardRef.current) {
        try {
          const canvas = await html2canvas(chartCardRef.current, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
          });
          activeChartImage = canvas.toDataURL('image/png');
        } catch (err) {
          console.warn('Erro ao capturar elemento do gráfico DOM:', err);
        }
      }

      await exportReportPDF({
        periodLabel: `${capitalizedMonth} de ${yearNum}`,
        periodSlug: `${currentMonthPrefix}_${viewRegime}`,
        viewRegime,
        totalIncome: reportTotals.income,
        totalExpense: reportTotals.expense,
        netBalance: reportTotals.balance,
        transactions: filteredTransactions,
        categories,
        accounts,
        cards,
        currency: user?.currency || 'BRL',
        userEmail: user?.email,
        activeChartImage,
        activeChartTitle,
      });
    } catch (e) {
      console.error('Erro ao gerar relatório PDF:', e);
    } finally {
      setIsExporting(false);
      setIsExportDropdownOpen(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportReportExcel({
        periodLabel: `${capitalizedMonth} de ${yearNum}`,
        periodSlug: `${currentMonthPrefix}_${viewRegime}`,
        viewRegime,
        totalIncome: reportTotals.income,
        totalExpense: reportTotals.expense,
        netBalance: reportTotals.balance,
        transactions: filteredTransactions,
        categories,
        accounts,
        cards,
        currency: user?.currency || 'BRL',
        userEmail: user?.email,
      });
    } catch (e) {
      console.error('Erro ao gerar relatório Excel:', e);
    } finally {
      setIsExporting(false);
      setIsExportDropdownOpen(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportReportCSV({
        periodLabel: `${capitalizedMonth} de ${yearNum}`,
        periodSlug: `${currentMonthPrefix}_${viewRegime}`,
        viewRegime,
        totalIncome: reportTotals.income,
        totalExpense: reportTotals.expense,
        netBalance: reportTotals.balance,
        transactions: filteredTransactions,
        categories,
        accounts,
        cards,
        currency: user?.currency || 'BRL',
        userEmail: user?.email,
      });
    } catch (e) {
      console.error('Erro ao gerar relatório CSV:', e);
    } finally {
      setIsExporting(false);
      setIsExportDropdownOpen(false);
    }
  };

  // Palette of colors
  const palette = [
    '#0099CC', '#9933CC', '#FF8A00', '#FF9494', '#439996',
    '#EB5757', '#00E676', '#7C4DFF', '#3B82F6', '#EC4899',
    '#F59E0B', '#10B981', '#6366F1', '#06B6D4'
  ];

  // -----------------------------------------------------------------------------------
  // 1. DATA FOR DONUT TAB
  // -----------------------------------------------------------------------------------
  const donutData = useMemo(() => {
    const monthTxs = filteredTransactions.filter(t => t.date.startsWith(currentMonthPrefix));

    if (donutSubtype === 'despesas_categoria' || donutSubtype === 'receitas_categoria') {
      const isExpense = donutSubtype === 'despesas_categoria';
      const targetType = isExpense ? 'expense' : 'income';
      const map: Record<string, { id: string; name: string; icon: string; amount: number; color?: string }> = {};

      monthTxs.filter(t => t.type === targetType).forEach(t => {
        const resolved = resolveCategory(categories, t.categoryId, t.subcategoryId, targetType);
        const id = resolved.id;
        const name = resolved.name.toUpperCase();
        const icon = resolved.icon;
        const color = resolved.color;

        if (!map[id]) map[id] = { id, name, icon, amount: 0, color };
        map[id].amount += t.amount;
      });

      const total = Object.values(map).reduce((sum, i) => sum + i.amount, 0);
      const items = Object.values(map)
        .map((i, idx) => ({
          ...i,
          percentage: total > 0 ? (i.amount / total) * 100 : 0,
          color: i.color || palette[idx % palette.length],
        }))
        .sort((a, b) => b.amount - a.amount);

      return { items, total, isExpense };
    }

    if (donutSubtype === 'despesas_contas' || donutSubtype === 'receitas_contas') {
      const isExpense = donutSubtype === 'despesas_contas';
      const targetType = isExpense ? 'expense' : 'income';
      const map: Record<string, { id: string; name: string; icon: string; amount: number }> = {};

      monthTxs.filter(t => t.type === targetType).forEach(t => {
        let name = 'CARTEIRA / DINHEIRO';
        let icon = '💵';
        let id = 'wallet';

        if (t.cardId) {
          const card = cards.find(c => c.id === t.cardId);
          name = card ? `CARTÃO ${card.name.toUpperCase()}` : 'CARTÃO DE CRÉDITO';
          icon = '💳';
          id = t.cardId;
        } else if (t.accountId) {
          const acc = accounts.find(a => a.id === t.accountId);
          name = acc ? acc.name.toUpperCase() : 'CONTA BANCÁRIA';
          icon = '🏦';
          id = t.accountId;
        }

        if (!map[id]) map[id] = { id, name, icon, amount: 0 };
        map[id].amount += t.amount;
      });

      const total = Object.values(map).reduce((sum, i) => sum + i.amount, 0);
      const items = Object.values(map)
        .map((i, idx) => ({
          ...i,
          percentage: total > 0 ? (i.amount / total) * 100 : 0,
          color: palette[idx % palette.length],
        }))
        .sort((a, b) => b.amount - a.amount);

      return { items, total, isExpense };
    }

    // saldos_contas
    const total = accounts.reduce((sum, a) => sum + a.balance, 0);
    const items = accounts.map((a, idx) => ({
      id: a.id,
      name: a.name.toUpperCase(),
      icon: '🏦',
      amount: a.balance,
      percentage: total > 0 ? (Math.max(0, a.balance) / total) * 100 : 0,
      color: a.color || palette[idx % palette.length],
    })).sort((a, b) => b.amount - a.amount);

    return { items, total, isExpense: false };
  }, [donutSubtype, filteredTransactions, currentMonthPrefix, categories, accounts, cards]);

  // -----------------------------------------------------------------------------------
  // 2. DATA FOR LINE TAB
  // -----------------------------------------------------------------------------------
  const lineData = useMemo(() => {
    if (lineSubtype === 'despesas_mes') {
      const daysInMonth = new Date(yearNum, viewDate.getMonth() + 1, 0).getDate();
      const items = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = String(i + 1).padStart(2, '0');
        const dateStr = `${currentMonthPrefix}-${dayNum}`;
        const dayAmount = filteredTransactions
          .filter(t => t.date === dateStr && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          key: dateStr,
          label: dayNum,
          displayLabel: `${dayNum} ${capitalizedMonth}`,
          amount: dayAmount,
        };
      });

      const total = items.reduce((sum, i) => sum + i.amount, 0);
      return { items, total, xKey: 'label' };
    }

    if (lineSubtype === 'despesas_semana') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const items = days.map((dayName, idx) => {
        const dayAmount = filteredTransactions
          .filter(t => {
            if (t.type !== 'expense' || !t.date.startsWith(currentMonthPrefix)) return false;
            const d = new Date(t.date + 'T12:00:00');
            return d.getDay() === idx;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          key: dayName,
          label: dayName,
          displayLabel: dayName,
          amount: dayAmount,
        };
      });

      const total = items.reduce((sum, i) => sum + i.amount, 0);
      return { items, total, xKey: 'label' };
    }

    // despesas_ano
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const items = months.map((m, idx) => {
      const mStr = `${yearNum}-${String(idx + 1).padStart(2, '0')}`;
      const monthAmount = filteredTransactions
        .filter(t => t.date.startsWith(mStr) && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        key: mStr,
        label: m,
        displayLabel: `${m} ${yearNum}`,
        amount: monthAmount,
      };
    });

    const total = items.reduce((sum, i) => sum + i.amount, 0);
    return { items, total, xKey: 'label' };
  }, [lineSubtype, filteredTransactions, currentMonthPrefix, yearNum, viewDate, capitalizedMonth]);

  // -----------------------------------------------------------------------------------
  // 3. DATA FOR BAR TAB
  // -----------------------------------------------------------------------------------
  const barData = useMemo(() => {
    if (barSubtype === 'balanco_mensal') {
      // Last 6 months
      const offsets = [-5, -4, -3, -2, -1, 0];
      const items = offsets.map(offset => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + offset);
        const mStr = d.toISOString().substring(0, 7);
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

        const rec = filteredTransactions
          .filter(t => t.date.startsWith(mStr) && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const desp = filteredTransactions
          .filter(t => t.date.startsWith(mStr) && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          key: mStr,
          label,
          displayLabel: `${label} ${d.getFullYear()}`,
          Receita: rec,
          Despesa: desp,
          saldo: rec - desp,
        };
      });

      return { items, type: 'dual' as const };
    }

    if (barSubtype === 'fluxo_caixa_anual') {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const items = months.map((m, idx) => {
        const mStr = `${yearNum}-${String(idx + 1).padStart(2, '0')}`;
        const rec = filteredTransactions
          .filter(t => t.date.startsWith(mStr) && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const desp = filteredTransactions
          .filter(t => t.date.startsWith(mStr) && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const saldo = rec - desp;

        return {
          key: mStr,
          label: m,
          displayLabel: `${m} ${yearNum}`,
          Balanco: saldo,
          Receita: rec,
          Despesa: desp,
        };
      });

      return { items, type: 'single' as const };
    }

    // despesas_dia_semana
    const days = [
      { name: 'Dom', full: 'Domingo' },
      { name: 'Seg', full: 'Segunda-feira' },
      { name: 'Ter', full: 'Terça-feira' },
      { name: 'Qua', full: 'Quarta-feira' },
      { name: 'Qui', full: 'Quinta-feira' },
      { name: 'Sex', full: 'Sexta-feira' },
      { name: 'Sáb', full: 'Sábado' },
    ];

    const items = days.map((day, idx) => {
      const dayAmount = filteredTransactions
        .filter(t => {
          if (t.type !== 'expense' || !t.date.startsWith(currentMonthPrefix)) return false;
          const d = new Date(t.date + 'T12:00:00');
          return d.getDay() === idx;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        key: day.name,
        label: day.name,
        displayLabel: day.full,
        Despesa: dayAmount,
      };
    });

    return { items, type: 'weekday' as const };
  }, [barSubtype, filteredTransactions, viewDate, currentMonthPrefix, yearNum]);

  // Labels mappings
  const donutSubtypeLabels: Record<DonutSubtype, string> = {
    despesas_categoria: 'Despesas por Categorias',
    despesas_contas: 'Despesas por Contas',
    receitas_categoria: 'Receitas por Categorias',
    receitas_contas: 'Receitas por Contas',
    saldos_contas: 'Saldos por Conta',
  };

  const lineSubtypeLabels: Record<LineSubtype, string> = {
    despesas_mes: 'Despesas do mês (diário)',
    despesas_semana: 'Despesas da semana',
    despesas_ano: 'Despesas por ano (mensal)',
  };

  const barSubtypeLabels: Record<BarSubtype, string> = {
    balanco_mensal: 'Balanço mensal (6 meses)',
    fluxo_caixa_anual: 'Fluxo de caixa anual',
    despesas_dia_semana: 'Despesas x dia da semana',
  };

  const currentDropdownLabel =
    activeTab === 'donut'
      ? donutSubtypeLabels[donutSubtype]
      : activeTab === 'line'
      ? lineSubtypeLabels[lineSubtype]
      : barSubtypeLabels[barSubtype];

  const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 0. CABEÇALHO GLOBAL & SELETOR DE LAYOUT (FOCADO VS GRADE BENTO) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Relatórios & Análises
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inteligência financeira, comparações e projeções patrimoniais
          </p>
        </div>

        {/* Botão de Alternância de Layout: Modo Focado vs Grade Bento */}
        <button
          onClick={handleToggleLayout}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs active:scale-95 transition-all cursor-pointer"
          title={layoutMode === 'bento' ? 'Mudar para Modo Focado' : 'Mudar para Modo Grade Bento'}
        >
          {layoutMode === 'bento' ? (
            <>
              <LayoutGrid className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Grade Bento</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Modo Focado</span>
            </>
          )}
        </button>
      </div>

      {/* NAVEGAÇÃO ENTRE OS 4 MÓDULOS DE RELATÓRIO */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setMainTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'overview'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieIcon className="w-3.5 h-3.5" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setMainTab('comparatives')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'comparatives'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Comparativos MoM</span>
        </button>

        <button
          onClick={() => setMainTab('financing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'financing'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Financiamentos & Dívidas</span>
        </button>

        <button
          onClick={() => setMainTab('health_50_30_20')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'health_50_30_20'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Regra 50/30/20</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. MÓDULO VISÃO GERAL */}
      {/* ========================================================================= */}
      {mainTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* 1. TOP HEADER (FINLY REPORTS SPEC: SUBTYPE DROPDOWN + FILTER + EXPORT) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Exibição da Visão Geral:
              </span>
            </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 3 Tabs Segmented Control Pill */}
          <div className="p-1 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 flex items-center shadow-xs">
            <button
              onClick={() => setActiveTab('donut')}
              title="Gráfico Donut / Pizza"
              className={`p-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'donut'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <PieIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('line')}
              title="Gráfico de Linha / Evolução"
              className={`p-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'line'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('bar')}
              title="Gráfico de Barras / Comparativo"
              className={`p-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'bar'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Subtype Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => setIsSubtypeDropdownOpen(!isSubtypeDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white hover:border-purple-500 shadow-xs cursor-pointer"
            >
              <span>{currentDropdownLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isSubtypeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in divide-y divide-slate-100 dark:divide-slate-800/60">
                {activeTab === 'donut' &&
                  Object.entries(donutSubtypeLabels).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => {
                        setDonutSubtype(k as DonutSubtype);
                        setIsSubtypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        donutSubtype === k
                          ? 'bg-purple-50 dark:bg-purple-600/30 text-purple-700 dark:text-purple-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                {activeTab === 'line' &&
                  Object.entries(lineSubtypeLabels).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => {
                        setLineSubtype(k as LineSubtype);
                        setIsSubtypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        lineSubtype === k
                          ? 'bg-purple-50 dark:bg-purple-600/30 text-purple-700 dark:text-purple-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                {activeTab === 'bar' &&
                  Object.entries(barSubtypeLabels).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => {
                        setBarSubtype(k as BarSubtype);
                        setIsSubtypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        barSubtype === k
                          ? 'bg-purple-50 dark:bg-purple-600/30 text-purple-700 dark:text-purple-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Unified Filter Popover */}
          <FilterPopover
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
            accounts={accounts}
            cards={cards}
            currentUser={user}
            showPeriod={true}
            showUser={true}
            showAccounts={true}
            showCards={true}
            showCategories={true}
            showStatus={true}
            customPeriodLabel={capitalizedMonth + ' ' + yearNum}
          />

          {/* Export Report Dropdown (PDF & CSV) */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs cursor-pointer active:scale-95 transition-all"
              title="Exportar Relatório em PDF ou CSV"
            >
              <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Exportar</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportDropdownOpen && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs font-bold divide-y divide-slate-100 dark:divide-slate-800/60"
              >
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-slate-100">Relatório em PDF</div>
                    <div className="text-[10px] text-slate-400 font-normal">Documento executivo formatado</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Planilha Excel (.xlsx)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">Oficial</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">Múltiplas abas formatadas e fórmulas</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-slate-100">Exportar em CSV</div>
                    <div className="text-[10px] text-slate-400 font-normal">Formato bruto universal</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. EXPANDABLE PERIOD SELECTOR PILL & REGIME TOGGLE */}
      <div className="flex flex-col items-center justify-center gap-3">
        {/* Regime Toggle */}
        <div className="inline-flex p-1 rounded-full bg-slate-100 dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 text-[11px] font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setViewRegime('due_date')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              viewRegime === 'due_date'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Relatórios por data de vencimento da fatura (Fluxo de Caixa)"
          >
            <span>Por Vencimento (Caixa)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewRegime('purchase_date')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              viewRegime === 'purchase_date'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Relatórios por data em que a compra ocorreu (Competência)"
          >
            <span>Por Data da Compra</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedMonthOffset(prev => prev - 1)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="px-5 py-1.5 rounded-full border border-purple-500/50 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs font-extrabold uppercase tracking-widest cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-xs"
          >
            {capitalizedMonth} {yearNum}
          </button>

          <button
            onClick={() => setSelectedMonthOffset(prev => prev + 1)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Inline Month Picker Matrix */}
        {showMonthPicker && (
          <div className="p-4 rounded-3xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 animate-in fade-in max-w-sm w-full">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white px-2">
              <button
                onClick={() => setSelectedMonthOffset(prev => prev - 12)}
                className="p-1 hover:text-purple-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{yearNum}</span>
              <button
                onClick={() => setSelectedMonthOffset(prev => prev + 12)}
                className="p-1 hover:text-purple-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {monthsShort.map((m, idx) => {
                const isSelected = viewDate.getMonth() === idx;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      const now = new Date();
                      const currentYear = now.getFullYear();
                      const currentMonth = now.getMonth();
                      const targetOffset = (yearNum - currentYear) * 12 + (idx - currentMonth);
                      setSelectedMonthOffset(targetOffset);
                      setShowMonthPicker(false);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN CARD CONTAINER (2-COLUMN RESPONSIVE LAYOUT) */}
      <div
        ref={chartCardRef}
        className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl"
      >
        {/* ========================================================================= */}
        {/* TAB 1: DONUT / PIE VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'donut' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Donut Chart with Centered Total */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              {donutData.items.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhuma transação encontrada no período.
                </div>
              ) : (
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData.items}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={94}
                        paddingAngle={donutData.items.length > 1 ? 4 : 0}
                        cornerRadius={6}
                        dataKey="amount"
                        stroke="transparent"
                        activeIndex={hoveredDonutItem ? donutData.items.findIndex(item => item.id === hoveredDonutItem.id) : undefined}
                        activeShape={renderActiveDonutShape}
                        onMouseEnter={(_, index) => setHoveredDonutItem(donutData.items[index])}
                        onMouseLeave={() => setHoveredDonutItem(null)}
                      >
                        {donutData.items.map((entry, index) => (
                          <Cell
                            key={`cell-donut-${entry.id || index}`}
                            fill={entry.color || '#7c4dff'}
                            className="cursor-pointer transition-opacity hover:opacity-90"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Interactive Center (No Overlapping Tooltip & Multi-line Wrap) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                    {hoveredDonutItem ? (
                      <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center justify-center max-w-[135px] text-center px-1 select-none">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-base mb-1 shadow-2xs"
                          style={{ backgroundColor: `${hoveredDonutItem.color || '#7c4dff'}25` }}
                        >
                          {hoveredDonutItem.icon || '🏷️'}
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">
                          {hoveredDonutItem.name}
                        </span>
                        <span className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-400 tracking-tight mt-0.5 whitespace-nowrap">
                          {formatCurrency(hoveredDonutItem.amount, user.currency, !user.showValues)}
                        </span>
                        <span
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 border shadow-2xs"
                          style={{
                            backgroundColor: `${hoveredDonutItem.color || '#7c4dff'}15`,
                            borderColor: `${hoveredDonutItem.color || '#7c4dff'}35`,
                            color: hoveredDonutItem.color || '#7c4dff',
                          }}
                        >
                          {hoveredDonutItem.percentage.toFixed(1)}% do total
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center max-w-[140px] text-center px-1 select-none">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                          Total do Período
                        </span>
                        <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                          {formatCurrency(donutData.total, user.currency, !user.showValues)}
                        </strong>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full mt-1.5 border border-slate-200/60 dark:border-slate-700/60">
                          {donutData.items.length} categorias
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Ranked Breakdown List (ALL CAPS, ICON, PERCENT, VALUE) */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                {donutSubtypeLabels[donutSubtype]}
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                {donutData.items.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400">Nenhum dado para exibir.</p>
                ) : (
                  donutData.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
                    >
                      {/* Left: Round Colored Icon + ALL CAPS Title + "Porcentagem" */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white shadow-xs"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-tight truncate">
                            {item.name}
                          </p>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                            Porcentagem
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount + Formatted % */}
                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs font-black ${
                            donutData.isExpense ? 'text-rose-600 dark:text-[#FF5252]' : 'text-emerald-600 dark:text-[#00E676]'
                          }`}
                        >
                          {formatCurrency(item.amount, user.currency, !user.showValues)}
                        </p>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">
                          {item.percentage.toFixed(2).replace('.', ',')}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LINE / EVOLUTION VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'line' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Smooth Line Chart */}
            <div className="lg:col-span-7 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData.items} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={v => `R$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                    formatter={(val: number) => [formatCurrency(val, user.currency), 'Gasto']}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#EB5757"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#EB5757' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Right Column: Chronological List of Days/Months */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                Detalhamento Cronológico
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                {lineData.items.map((i, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs px-2">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{i.displayLabel}</span>
                    <span className={`font-black ${i.amount > 0 ? 'text-rose-600 dark:text-[#FF5252]' : 'text-slate-400'}`}>
                      {formatCurrency(i.amount, user.currency, !user.showValues)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-black px-2">
                <span className="text-slate-900 dark:text-white uppercase">Total</span>
                <span className="text-rose-600 dark:text-[#FF5252]">
                  {formatCurrency(lineData.total, user.currency, !user.showValues)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BAR / COMPARATIVE VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'bar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Bar Chart */}
            <div className="lg:col-span-7 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {barData.type === 'dual' ? (
                  <BarChart data={barData.items} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={v => `R$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                      formatter={(val: number) => formatCurrency(val, user.currency)}
                    />
                    <Bar dataKey="Receita" fill="#00E676" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Despesa" fill="#EB5757" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : barData.type === 'single' ? (
                  <BarChart data={barData.items} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={v => `R$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                      formatter={(val: number) => formatCurrency(val, user.currency)}
                    />
                    <Bar dataKey="Balanco" fill="#7C4DFF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={barData.items} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={v => `R$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                      formatter={(val: number) => formatCurrency(val, user.currency)}
                    />
                    <Bar dataKey="Despesa" fill="#EB5757" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 pt-3 text-[11px] font-bold">
                {barData.type === 'dual' ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#00E676]" />
                      <span className="text-slate-600 dark:text-slate-300">Receita</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#EB5757]" />
                      <span className="text-slate-600 dark:text-slate-300">Despesa</span>
                    </div>
                  </>
                ) : barData.type === 'single' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#7C4DFF]" />
                    <span className="text-slate-600 dark:text-slate-300">Balanço Líquido</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#EB5757]" />
                    <span className="text-slate-600 dark:text-slate-300">Despesas</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Breakdown List */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                Detalhamento dos Valores
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                {barData.items.map((i: any, idx) => (
                  <div key={idx} className="py-2.5 px-2 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>{i.displayLabel}</span>
                      {i.saldo !== undefined && (
                        <span className={`${i.saldo >= 0 ? 'text-emerald-600 dark:text-[#00E676]' : 'text-rose-600 dark:text-[#EB5757]'}`}>
                          {formatCurrency(i.saldo, user.currency, !user.showValues)}
                        </span>
                      )}
                      {i.Balanco !== undefined && (
                        <span className={`${i.Balanco >= 0 ? 'text-emerald-600 dark:text-[#00E676]' : 'text-rose-600 dark:text-[#EB5757]'}`}>
                          {formatCurrency(i.Balanco, user.currency, !user.showValues)}
                        </span>
                      )}
                      {i.Despesa !== undefined && i.saldo === undefined && (
                        <span className="text-rose-600 dark:text-[#EB5757]">
                          {formatCurrency(i.Despesa, user.currency, !user.showValues)}
                        </span>
                      )}
                    </div>

                    {i.Receita !== undefined && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Rec: {formatCurrency(i.Receita, user.currency)}</span>
                        <span>Desp: {formatCurrency(i.Despesa, user.currency)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  {/* ========================================================================= */}
  {/* 2. MÓDULO COMPARATIVOS (MOM & ORÇADO VS REALIZADO) */}
  {/* ========================================================================= */}
  {mainTab === 'comparatives' && (
    <div className="space-y-6 animate-in fade-in">
      {/* Seletor de Mês */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setSelectedMonthOffset(prev => prev - 1)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          title="Mês Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="px-5 py-1.5 rounded-full border border-purple-500/50 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs font-extrabold uppercase tracking-widest cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-xs"
        >
          {capitalizedMonth} {yearNum}
        </button>

        <button
          onClick={() => setSelectedMonthOffset(prev => prev + 1)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          title="Próximo Mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <ComparativeReport
        transactions={filteredTransactions}
        categories={categories}
        budgets={budgets}
        currentMonth={currentMonthPrefix}
        currency={user.currency}
        isBento={layoutMode === 'bento'}
      />
    </div>
  )}

  {/* ========================================================================= */}
  {/* 3. MÓDULO FINANCIAMENTOS & DÍVIDAS */}
  {/* ========================================================================= */}
  {mainTab === 'financing' && (
    <div className="animate-in fade-in">
      <FinancingReport
        debts={debts}
        currency={user.currency}
        isBento={layoutMode === 'bento'}
      />
    </div>
  )}

  {/* ========================================================================= */}
  {/* 4. MÓDULO REGRA 50/30/20 & DIAGNÓSTICO */}
  {/* ========================================================================= */}
  {mainTab === 'health_50_30_20' && (
    <div className="space-y-6 animate-in fade-in">
      {/* Seletor de Mês */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setSelectedMonthOffset(prev => prev - 1)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          title="Mês Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="px-5 py-1.5 rounded-full border border-purple-500/50 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs font-extrabold uppercase tracking-widest cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-xs"
        >
          {capitalizedMonth} {yearNum}
        </button>

        <button
          onClick={() => setSelectedMonthOffset(prev => prev + 1)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          title="Próximo Mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <Health503020Report
        transactions={filteredTransactions}
        categories={categories}
        currentMonth={currentMonthPrefix}
        currency={user.currency}
        isBento={layoutMode === 'bento'}
      />
    </div>
  )}
    </div>
  );
};
