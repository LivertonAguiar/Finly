import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard as CardIcon,
  Target,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  PieChart as PieIcon,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { BankLogo, CardBrandLogo } from '../../utils/bankLogos';
import { PayInvoiceModal } from '../transactions/PayInvoiceModal';
import { Modal } from '../ui/Modal';

interface OverviewTabProps {
  onOpenNewTransaction: () => void;
  setActiveTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onOpenNewTransaction, setActiveTab }) => {
  const { user, metrics, categories, accounts, cards, transactions } = useFinancial();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedCardForPay, setSelectedCardForPay] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<{ name: string; icon: string; value: number; percentage: number; color: string } | null>(null);

  // Manage Home Screen (Gerenciar Tela Inicial)
  const [isManageWidgetsOpen, setIsManageWidgetsOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState({
    kpis: true,
    desempenho: true,
    despesasCategoria: true,
    balancoMensal: true,
    planejamento: true,
    cartoes: true,
    contas: true,
  });

  // Load custom widget preferences from localStorage
  useEffect(() => {
    try {
      const detailed = localStorage.getItem('plannerfin_dashboard_widgets_detailed');
      if (detailed) {
        const parsed = JSON.parse(detailed);
        setVisibleWidgets({
          kpis: true,
          desempenho: parsed.economiaMes !== false,
          despesasCategoria: parsed.despesasCategoria !== false,
          balancoMensal: parsed.balancoMensal !== false,
          planejamento: parsed.resumoOrcamento !== false,
          cartoes: parsed.cartoes !== false,
          contas: parsed.contas !== false,
        });
      } else {
        const saved = localStorage.getItem('plannerfin_dashboard_widgets');
        if (saved) {
          setVisibleWidgets(JSON.parse(saved));
        }
      }
    } catch (e) {}
  }, []);

  const saveWidgetSettings = (updated: typeof visibleWidgets) => {
    setVisibleWidgets(updated);
    try {
      localStorage.setItem('plannerfin_dashboard_widgets', JSON.stringify(updated));
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
    return monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthlyExpense = useMemo(() => {
    return monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthlyBalance = monthlyIncome - monthlyExpense;

  // Robust category helper
  const findCategory = (catId?: string, subId?: string) => {
    if (!catId && !subId) return null;
    return categories.find(
      c =>
        c.id === catId ||
        c.name.toLowerCase() === catId?.toLowerCase() ||
        (subId && c.subcategories?.some(s => s.id === subId || s.name.toLowerCase() === subId.toLowerCase()))
    );
  };

  // Category Donut Data
  const categoryChartData = useMemo(() => {
    const map: Record<string, { name: string; icon: string; amount: number; color?: string }> = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = findCategory(t.categoryId, t.subcategoryId);
        const name = (cat ? cat.name : (t.categoryId || 'OUTROS')).toUpperCase();
        const icon = cat?.icon || '📁';
        const color = cat?.color;
        if (!map[name]) map[name] = { name, icon, amount: 0, color };
        map[name].amount += t.amount;
      });

    const colors = ['#0099CC', '#9933CC', '#FF8A00', '#EC4899', '#00E676', '#3B82F6', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444', '#06B6D4'];
    const total = Object.values(map).reduce((sum, i) => sum + i.amount, 0);

    return Object.values(map)
      .map((item, idx) => ({
        name: item.name,
        icon: item.icon,
        value: item.amount,
        percentage: total > 0 ? (item.amount / total) * 100 : 0,
        color: item.color || colors[idx % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, categories]);

  const totalExpenseCategorySum = useMemo(() => {
    return categoryChartData.reduce((sum, c) => sum + c.value, 0);
  }, [categoryChartData]);

  // Today day for due calculations
  const today = getTodayString();
  const todayDay = parseInt(today.split('-')[2]);

  // Card items breakdown
  const cardSummaries = useMemo(() => {
    return cards.map(c => {
      const cardTxs = transactions.filter(t => t.cardId === c.id && t.type === 'expense' && t.date.startsWith(currentMonthPrefix));
      const invoiceTotal = cardTxs.reduce((sum, t) => sum + t.amount, 0);
      const totalAccumulatedSpent = transactions.filter(t => t.cardId === c.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const availableLimit = Math.max(0, c.limit - totalAccumulatedSpent);
      const limitUsedPercent = c.limit > 0 ? (invoiceTotal / c.limit) * 100 : 0;

      const isPaid = cardTxs.length > 0 && cardTxs.every(t => t.status === 'completed');
      const isOverdue = !isPaid && invoiceTotal > 0 && todayDay > c.dueDay;
      const isZero = invoiceTotal === 0;

      let statusLabel = 'Fatura aberta';
      let statusColor = 'text-slate-500 dark:text-slate-400';

      if (isPaid) {
        statusLabel = 'Fatura paga';
        statusColor = 'text-emerald-600 dark:text-emerald-400';
      } else if (isOverdue) {
        statusLabel = 'Fatura vencida';
        statusColor = 'text-rose-600 dark:text-rose-500 font-bold';
      } else if (isZero) {
        statusLabel = 'Fatura zerada';
        statusColor = 'text-slate-400';
      }

      return {
        ...c,
        invoiceTotal,
        availableLimit,
        limitUsedPercent,
        statusLabel,
        statusColor,
        isPaid,
        isOverdue,
        isZero,
      };
    });
  }, [cards, transactions, currentMonthPrefix, todayDay]);

  const totalCardInvoicesSum = useMemo(() => {
    return cardSummaries.reduce((sum, c) => sum + c.invoiceTotal, 0);
  }, [cardSummaries]);

  // Financial health score
  const savingsRate = monthlyIncome > 0 ? Math.max(0, ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 1. TOPBAR HEADER (MOBILLS REPLICA: MONTH NAVIGATOR + USER INFO) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonthOffset(prev => prev - 1)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-2 py-1 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 shadow-xs">
              {capitalizedMonth} {yearNum}
            </span>
            <button
              onClick={() => setSelectedMonthOffset(prev => prev + 1)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManageWidgetsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-purple-600 shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Personalizar</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 4 METRIC KPIS (MOBILLS SPEC: 4 PILL CARDS IN A ROW) */}
      {visibleWidgets.kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Saldo atual (Blue Dot #42a5f5) */}
          <div
            onClick={() => setActiveTab('contas')}
            className="p-4 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl hover:bg-slate-50 dark:hover:bg-[#343437] transition-all cursor-pointer space-y-1 group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#42a5f5] shrink-0 shadow-xs" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate">Saldo atual</span>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(metrics.totalBalance, user.currency, !user.showValues)}
            </p>
          </div>

          {/* KPI 2: Receitas (Green Dot #66bb6a) */}
          <div
            onClick={() => setActiveTab('transacoes')}
            className="p-4 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl hover:bg-slate-50 dark:hover:bg-[#343437] transition-all cursor-pointer space-y-1 group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#66bb6a] shrink-0 shadow-xs" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate">Receitas</span>
            </div>
            <p className="text-base sm:text-lg font-black text-[#66bb6a] tracking-tight">
              {formatCurrency(monthlyIncome, user.currency, !user.showValues)}
            </p>
          </div>

          {/* KPI 3: Despesas (Red Dot #ef5350) */}
          <div
            onClick={() => setActiveTab('transacoes')}
            className="p-4 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl hover:bg-slate-50 dark:hover:bg-[#343437] transition-all cursor-pointer space-y-1 group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef5350] shrink-0 shadow-xs" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate">Despesas</span>
            </div>
            <p className="text-base sm:text-lg font-black text-[#ef5350] tracking-tight">
              {formatCurrency(monthlyExpense, user.currency, !user.showValues)}
            </p>
          </div>

          {/* KPI 4: Cartão de crédito (Teal Dot #26a69a) */}
          <div
            onClick={() => setActiveTab('cartoes')}
            className="p-4 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl hover:bg-slate-50 dark:hover:bg-[#343437] transition-all cursor-pointer space-y-1 group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#26a69a] shrink-0 shadow-xs" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate">Cartão de crédito</span>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(totalCardInvoicesSum, user.currency, !user.showValues)}
            </p>
          </div>
        </div>
      )}

      {/* 3. "MEU DESEMPENHO" BANNER WIDGET */}
      {visibleWidgets.desempenho && (
        <div className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Meu Desempenho</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
                  {savingsRate > 20 ? 'Excelente' : savingsRate > 0 ? 'Bom' : 'Atenção'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Taxa de poupança atual: <span className="font-bold text-purple-600 dark:text-purple-400">{savingsRate.toFixed(1)}%</span> da renda poupada neste mês.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('orcamento')}
            className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/25 transition-all cursor-pointer"
          >
            VER METAS & PLANEJAMENTO
          </button>
        </div>
      )}

      {/* 4. TWO-COLUMN RESPONSIVE LAYOUT (MOBILLS MODULAR GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: DESPESAS POR CATEGORIA & BALANÇO MENSAL */}
        <div className="space-y-6">
          {/* Widget 1: Despesas por Categoria (Donut + Ranking + "VER MAIS") */}
          {visibleWidgets.despesasCategoria && (
            <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Despesas por categoria</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">{capitalizedMonth}</span>
              </div>

              {categoryChartData.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhuma despesa registrada neste mês.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Donut with Interactive Hover & High Contrast in Dark Mode */}
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
                          onMouseEnter={(_, index) => setHoveredCategory(categoryChartData[index])}
                          onMouseLeave={() => setHoveredCategory(null)}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell
                              key={`cell-overview-cat-${index}`}
                              fill={entry.color}
                              className="cursor-pointer transition-all hover:opacity-90"
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Interactive Center (No Overlapping Tooltip) */}
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

                  {/* Ranked List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 max-h-40 overflow-y-auto scrollbar-thin pr-1">
                    {categoryChartData.slice(0, 5).map((c, i) => (
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

                  {/* "VER MAIS" Button */}
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
          )}

          {/* Widget 2: Balanço Mensal (Receitas x Despesas x Balanço) */}
          {visibleWidgets.balancoMensal && (
            <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
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
          )}

          {/* Widget 3: Planejamento Mensal */}
          {visibleWidgets.planejamento && (
            <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Planejamento mensal</h3>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E1E20] border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                  Defina o teto de gastos por categoria e economize mais neste mês.
                </p>
                <button
                  onClick={() => setActiveTab('orcamento')}
                  className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  DEFINIR MEU PLANEJAMENTO
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CARTÕES DE CRÉDITO & CONTAS */}
        <div className="space-y-6">
          {/* Widget 4: Cartões de Crédito (PlannerFin Full Cards Breakdown) */}
          {visibleWidgets.cartoes && (
            <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Cartões de crédito</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">{capitalizedMonth}</span>
              </div>

              <div className="space-y-4 max-h-[480px] overflow-y-auto scrollbar-thin pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {cardSummaries.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Nenhum cartão cadastrado.</p>
                ) : (
                  cardSummaries.map(card => (
                    <div key={card.id} className="pt-3.5 first:pt-0 space-y-2">
                      {/* Name + Status + Amount */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                            {card.name}
                          </h4>
                          <span className={`text-[11px] ${card.statusColor}`}>{card.statusLabel}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-[#ef5350] block">
                            {formatCurrency(card.invoiceTotal, user.currency, !user.showValues)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {card.limitUsedPercent.toFixed(2).replace('.', ',')}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-[#11141b] h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(2, card.limitUsedPercent)}%` }}
                          className="h-full bg-[#00a884] rounded-full transition-all duration-500"
                        />
                      </div>

                      {/* Available Limit + Action Button */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          Limite Disponível {formatCurrency(card.availableLimit, user.currency, !user.showValues)}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedCardForPay(card.id);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="text-[11px] font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          {card.invoiceTotal > 0 ? 'Pagar Fatura' : 'Adicionar despesa'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Card Invoices + VER MAIS */}
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
          )}

          {/* Widget 5: Contas Bancárias */}
          {visibleWidgets.contas && (
            <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Contas</h3>
                <button
                  onClick={() => setActiveTab('contas')}
                  className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Gerenciar
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {accounts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Nenhuma conta cadastrada.</p>
                ) : (
                  accounts.map(acc => (
                    <div key={acc.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-[#1E1E20] flex items-center justify-center p-1 shrink-0 border border-slate-200 dark:border-slate-800">
                          <BankLogo nameOrId={acc.institution || acc.name} size={18} className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{acc.name}</p>
                          <span className="text-[10px] text-slate-400">
                            {acc.type === 'cash' ? 'Carteira' : 'Conta Corrente'}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-[#66bb6a]">
                        {formatCurrency(acc.balance, user.currency, !user.showValues)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                <span>Total em contas</span>
                <span className="text-[#66bb6a]">
                  {formatCurrency(metrics.totalBalance, user.currency, !user.showValues)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. BOTTOM BUTTON: "GERENCIAR TELA INICIAL" (MOBILLS SPEC) */}
      <div className="pt-6 flex justify-center">
        <button
          onClick={() => setActiveTab('settings')}
          className="px-6 py-3 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:border-purple-500 hover:text-purple-600 shadow-md transition-all cursor-pointer"
        >
          GERENCIAR TELA INICIAL
        </button>
      </div>

      {/* 6. MODAL: "GERENCIAR TELA INICIAL" */}
      {isManageWidgetsOpen && (
        <Modal
          isOpen={isManageWidgetsOpen}
          onClose={() => setIsManageWidgetsOpen(false)}
          title="Gerenciar Tela Inicial"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Escolha quais cartões e widgets deseja exibir na sua tela inicial:
            </p>

            <div className="space-y-2.5">
              {[
                { key: 'kpis', label: 'Resumo dos 4 KPIs (Saldo, Receitas, Despesas, Cartão)' },
                { key: 'desempenho', label: 'Meu Desempenho & Saúde Financeira' },
                { key: 'despesasCategoria', label: 'Despesas por Categoria (Donut)' },
                { key: 'balancoMensal', label: 'Balanço Mensal' },
                { key: 'planejamento', label: 'Planejamento Mensal (Orçamento)' },
                { key: 'cartoes', label: 'Cartões de Crédito' },
                { key: 'contas', label: 'Contas Bancárias' },
              ].map(w => (
                <label
                  key={w.key}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{w.label}</span>
                  <input
                    type="checkbox"
                    checked={(visibleWidgets as any)[w.key]}
                    onChange={e => {
                      const updated = { ...visibleWidgets, [w.key]: e.target.checked };
                      saveWidgetSettings(updated);
                    }}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsManageWidgetsOpen(false)}
                className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md cursor-pointer"
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
