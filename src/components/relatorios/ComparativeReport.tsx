import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import type { Category, Transaction, Budget, CreditCard } from '../../types';
import {
  doesTransactionBelongToMonth,
  isInvoicePaymentTransaction,
  ViewRegime,
} from '../../utils/invoiceCalculator';

interface ComparativeReportProps {
  currentMonthTransactions?: Transaction[];
  previousMonthTransactions?: Transaction[];
  currentMonthPrefix?: string;
  previousMonthPrefix?: string;
  transactions?: Transaction[];
  currentMonth?: string;
  categories: Category[];
  budgets?: Budget[] | Record<string, number>;
  cards?: CreditCard[];
  viewRegime?: ViewRegime;
  currency?: string;
  showValues?: boolean;
  layoutMode?: 'focused' | 'bento';
  isBento?: boolean;
}

export const ComparativeReport: React.FC<ComparativeReportProps> = ({
  currentMonthTransactions: propCurrentTx,
  previousMonthTransactions: propPrevTx,
  currentMonthPrefix: propCurPrefix,
  previousMonthPrefix: propPrevPrefix,
  transactions,
  currentMonth,
  categories,
  budgets = [],
  cards = [],
  viewRegime = 'invoice_month',
  currency = 'BRL',
  showValues = true,
  layoutMode = 'focused',
  isBento,
}) => {
  const [subView, setSubView] = useState<'mom' | 'budget'>('mom');

  const effectiveLayout = isBento !== undefined ? (isBento ? 'bento' : 'focused') : layoutMode;

  const currentMonthPrefix = useMemo(() => {
    return propCurPrefix || currentMonth || new Date().toISOString().substring(0, 7);
  }, [propCurPrefix, currentMonth]);

  const previousMonthPrefix = useMemo(() => {
    if (propPrevPrefix) return propPrevPrefix;
    const [y, m] = currentMonthPrefix.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [propPrevPrefix, currentMonthPrefix]);

  const currentMonthTransactions = useMemo(() => {
    if (propCurrentTx) return propCurrentTx;
    if (transactions) {
      return transactions.filter(t => {
        const card = cards.find(c => c.id === t.cardId);
        return doesTransactionBelongToMonth(t, card, currentMonthPrefix, viewRegime);
      });
    }
    return [];
  }, [propCurrentTx, transactions, currentMonthPrefix, cards, viewRegime]);

  const previousMonthTransactions = useMemo(() => {
    if (propPrevTx) return propPrevTx;
    if (transactions) {
      return transactions.filter(t => {
        const card = cards.find(c => c.id === t.cardId);
        return doesTransactionBelongToMonth(t, card, previousMonthPrefix, viewRegime);
      });
    }
    return [];
  }, [propPrevTx, transactions, previousMonthPrefix, cards, viewRegime]);

  // Normalizar budgets em Record<string, number>
  const budgetMap = useMemo(() => {
    if (Array.isArray(budgets)) {
      const map: Record<string, number> = {};
      budgets.forEach((b: Budget) => {
        if (!b.month || b.month === currentMonthPrefix) {
          map[b.categoryId] = (map[b.categoryId] || 0) + (b.limit || 0);
        }
      });
      return map;
    }
    return budgets || {};
  }, [budgets, currentMonthPrefix]);

  // Format month names (e.g. "setembro" or "Set/2026")
  const currentMonthName = useMemo(() => {
    const [y, m] = currentMonthPrefix.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentMonthPrefix]);

  const previousMonthName = useMemo(() => {
    const [y, m] = previousMonthPrefix.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [previousMonthPrefix]);

  // 1. COMPARATIVE MoM (Month over Month) DATA
  const momComparisonData = useMemo(() => {
    const currentCategoryTotals: Record<string, number> = {};
    const previousCategoryTotals: Record<string, number> = {};

    currentMonthTransactions
      .filter(t => t.type === 'expense' && (t.status === 'completed' || !!t.cardId || (t as any).isCreditPurchase) && !t.ignored && !isInvoicePaymentTransaction(t))
      .forEach(t => {
        const catId = t.categoryId || 'outros';
        currentCategoryTotals[catId] = (currentCategoryTotals[catId] || 0) + t.amount;
      });

    previousMonthTransactions
      .filter(t => t.type === 'expense' && (t.status === 'completed' || !!t.cardId || (t as any).isCreditPurchase) && !t.ignored && !isInvoicePaymentTransaction(t))
      .forEach(t => {
        const catId = t.categoryId || 'outros';
        previousCategoryTotals[catId] = (previousCategoryTotals[catId] || 0) + t.amount;
      });

    const allCatIds = Array.from(
      new Set([...Object.keys(currentCategoryTotals), ...Object.keys(previousCategoryTotals)])
    );

    const rows = allCatIds.map(catId => {
      const cat = categories.find(c => c.id === catId);
      const name = cat?.name || 'Outros';
      const icon = cat?.icon || '📁';
      const color = cat?.color || '#a855f7';

      const current = currentCategoryTotals[catId] || 0;
      const previous = previousCategoryTotals[catId] || 0;
      const diff = current - previous;
      const percentageChange =
        previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

      return {
        id: catId,
        name,
        icon,
        color,
        current,
        previous,
        diff,
        percentageChange,
      };
    });

    // Sort by largest absolute difference
    rows.sort((a, b) => b.current - a.current);

    const totalCurrent = Object.values(currentCategoryTotals).reduce((sum, v) => sum + v, 0);
    const totalPrevious = Object.values(previousCategoryTotals).reduce((sum, v) => sum + v, 0);
    const totalDiff = totalCurrent - totalPrevious;
    const totalPercentage =
      totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0;

    return {
      rows,
      totalCurrent,
      totalPrevious,
      totalDiff,
      totalPercentage,
      chartData: rows.slice(0, 8).map(r => ({
        name: r.name,
        Atual: r.current,
        Anterior: r.previous,
        diff: r.diff,
        color: r.color,
      })),
    };
  }, [currentMonthTransactions, previousMonthTransactions, categories]);

  // 2. BUDGET VS REALIZED DATA
  const budgetComparisonData = useMemo(() => {
    const currentCategoryTotals: Record<string, number> = {};

    currentMonthTransactions
      .filter(t => t.type === 'expense' && (t.status === 'completed' || !!t.cardId || (t as any).isCreditPurchase) && !t.ignored && !isInvoicePaymentTransaction(t))
      .forEach(t => {
        const catId = t.categoryId || 'outros';
        currentCategoryTotals[catId] = (currentCategoryTotals[catId] || 0) + t.amount;
      });

    // Categories with a budget or with spend
    const activeCatIds = Array.from(
      new Set([...Object.keys(budgetMap), ...Object.keys(currentCategoryTotals)])
    );

    const rows = activeCatIds
      .map(catId => {
        const cat = categories.find(c => c.id === catId);
        const name = cat?.name || 'Outros';
        const icon = cat?.icon || '🎯';
        const color = cat?.color || '#a855f7';

        const planned = budgetMap[catId] || 0;
        const actual = currentCategoryTotals[catId] || 0;
        const variance = actual - planned;
        const adherencePercent = planned > 0 ? (actual / planned) * 100 : actual > 0 ? 100 : 0;
        const status =
          planned === 0
            ? 'unbudgeted'
            : actual <= planned * 0.85
            ? 'safe'
            : actual <= planned
            ? 'warning'
            : 'danger';

        return {
          id: catId,
          name,
          icon,
          color,
          planned,
          actual,
          variance,
          adherencePercent,
          status,
        };
      })
      .filter(r => r.planned > 0 || r.actual > 0);

    rows.sort((a, b) => b.actual - a.actual);

    const totalPlanned = Object.values(budgetMap).reduce((sum, b) => sum + b, 0);
    const totalActual = Object.values(currentCategoryTotals).reduce((sum, v) => sum + v, 0);
    const totalVariance = totalActual - totalPlanned;
    const overallAdherence = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

    return {
      rows,
      totalPlanned,
      totalActual,
      totalVariance,
      overallAdherence,
      chartData: rows.slice(0, 8).map(r => ({
        name: r.name,
        Planejado: r.planned,
        Realizado: r.actual,
        color: r.color,
      })),
    };
  }, [currentMonthTransactions, budgetMap, categories]);

  return (
    <div className="space-y-6">
      {/* Subview Selector Pill */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setSubView('mom')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              subView === 'mom'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mês a Mês (MoM)
          </button>
          <button
            type="button"
            onClick={() => setSubView('budget')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              subView === 'budget'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Orçado vs Realizado
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          {subView === 'mom'
            ? `Comparando: ${currentMonthName} com ${previousMonthName}`
            : `Metas de orçamento em: ${currentMonthName}`}
        </div>
      </div>

      {/* KPI CARDS (BENTO STYLE) */}
      {subView === 'mom' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Despesas Mês Atual
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {formatCurrency(momComparisonData.totalCurrent, currency, !showValues)}
            </p>
            <span className="text-[10px] text-slate-400 capitalize">{currentMonthName}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Despesas Mês Anterior
            </span>
            <p className="text-xl font-black text-slate-600 dark:text-slate-300">
              {formatCurrency(momComparisonData.totalPrevious, currency, !showValues)}
            </p>
            <span className="text-[10px] text-slate-400 capitalize">{previousMonthName}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Variação Geral
            </span>
            <div className="flex items-center gap-2">
              <p
                className={`text-xl font-black ${
                  momComparisonData.totalDiff > 0
                    ? 'text-rose-500'
                    : momComparisonData.totalDiff < 0
                    ? 'text-emerald-500'
                    : 'text-slate-500'
                }`}
              >
                {momComparisonData.totalDiff > 0 ? '+' : ''}
                {formatCurrency(momComparisonData.totalDiff, currency, !showValues)}
              </p>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  momComparisonData.totalDiff > 0
                    ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600'
                    : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                }`}
              >
                {momComparisonData.totalDiff > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(momComparisonData.totalPercentage).toFixed(1)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {momComparisonData.totalDiff > 0
                ? 'Aumento de gastos em relação ao mês anterior'
                : 'Economia alcançada em relação ao mês anterior'}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Orçamento Previsto
            </span>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400">
              {formatCurrency(budgetComparisonData.totalPlanned, currency, !showValues)}
            </p>
            <span className="text-[10px] text-slate-400">Teto planejado para o mês</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Gasto Realizado
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {formatCurrency(budgetComparisonData.totalActual, currency, !showValues)}
            </p>
            <span className="text-[10px] text-slate-400">Lançamentos confirmados</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Aderência ao Teto
            </span>
            <div className="flex items-center gap-2">
              <p
                className={`text-xl font-black ${
                  budgetComparisonData.totalVariance > 0 ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {budgetComparisonData.overallAdherence.toFixed(1)}%
              </p>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  budgetComparisonData.totalVariance > 0
                    ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600'
                    : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                }`}
              >
                {budgetComparisonData.totalVariance > 0
                  ? `Estourou ${formatCurrency(budgetComparisonData.totalVariance, currency, !showValues)}`
                  : `Sobrou ${formatCurrency(Math.abs(budgetComparisonData.totalVariance), currency, !showValues)}`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {budgetComparisonData.totalVariance > 0
                ? 'Atenção: orçamento ultrapassado'
                : 'Dentro do limite planejado'}
            </span>
          </div>
        </div>
      )}

      {/* GRÁFICO COMPARATIVO & TABELA DETALHADA */}
      <div
        className={`grid gap-6 ${
          effectiveLayout === 'bento' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* Card do Gráfico */}
        <div className="p-5 sm:p-6 rounded-[24px] bg-white dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart className="w-4 h-4 text-purple-600" />
              {subView === 'mom' ? 'Comparativo das Maiores Categorias' : 'Orçado vs Realizado'}
            </h3>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                {subView === 'mom' ? 'Mês Atual' : 'Realizado'}
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                {subView === 'mom' ? 'Mês Anterior' : 'Planejado'}
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {subView === 'mom' ? (
                <BarChart
                  data={momComparisonData.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    tickFormatter={v => (v.length > 10 ? `${v.slice(0, 9)}…` : v)}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={v => `R$${v}`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val) || 0, currency, !showValues),
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#18181B',
                      borderColor: '#27272A',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Atual" fill="#9333ea" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Anterior" fill="#64748b" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart
                  data={budgetComparisonData.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    tickFormatter={v => (v.length > 10 ? `${v.slice(0, 9)}…` : v)}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={v => `R$${v}`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val) || 0, currency, !showValues),
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#18181B',
                      borderColor: '#27272A',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Planejado" fill="#64748b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Realizado" fill="#9333ea" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Variação por Categoria */}
        <div className="p-5 sm:p-6 rounded-[24px] bg-white dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {subView === 'mom' ? 'Detalhamento das Variações' : 'Aderência por Categoria'}
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {subView === 'mom'
                ? `${momComparisonData.rows.length} categorias`
                : `${budgetComparisonData.rows.length} categorias com meta`}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
            {subView === 'mom' ? (
              momComparisonData.rows.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Nenhum dado comparativo para o período selecionado.
                </p>
              ) : (
                momComparisonData.rows.map(row => (
                  <div key={row.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: `${row.color}20`, color: row.color }}
                      >
                        {row.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {row.name}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          Anterior: {formatCurrency(row.previous, currency, !showValues)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrency(row.current, currency, !showValues)}
                      </p>
                      <span
                        className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                          row.diff > 0
                            ? 'text-rose-500'
                            : row.diff < 0
                            ? 'text-emerald-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {row.diff > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : row.diff < 0 ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : null}
                        {row.diff > 0 ? '+' : ''}
                        {row.percentageChange.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : budgetComparisonData.rows.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Nenhum orçamento configurado para as categorias deste mês.
              </p>
            ) : (
              budgetComparisonData.rows.map(row => (
                <div key={row.id} className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0"
                        style={{ backgroundColor: `${row.color}20`, color: row.color }}
                      >
                        {row.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {row.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrency(row.actual, currency, !showValues)}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-semibold block">
                        Meta: {formatCurrency(row.planned, currency, !showValues)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso com Cor Semântica */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        row.status === 'danger'
                          ? 'bg-rose-500'
                          : row.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, row.adherencePercent)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
