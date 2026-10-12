import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Wallet,
  PieChart as PieIcon,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CreditCard,
  Building2,
  Banknote,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Transaction, Category, Account, CreditCard as CreditCardType, UserProfile } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { resolveCategory } from '../../../utils/categoryResolver';
import { getAnalyticalEntries } from '../../../utils/transactionAnalytics';

interface ExecutiveDashboardProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  cards: CreditCardType[];
  user: UserProfile;
  currentMonthPrefix: string;
  monthName: string;
  yearNum: number;
  onNavigateToCategory?: (categoryId: string) => void;
}

const PALETTE = [
  '#7C4DFF', '#00E676', '#EB5757', '#00B0FF', '#FF9100',
  '#E040FB', '#00BFA5', '#FF5252', '#7C4DFF', '#651FFF',
  '#1DE9B6', '#FF6D00', '#F50057', '#2979FF',
];

const renderActiveSector = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={8}
      />
    </g>
  );
};

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  transactions,
  categories,
  accounts,
  cards,
  user,
  currentMonthPrefix,
  monthName,
  yearNum,
  onNavigateToCategory,
}) => {
  const [donutType, setDonutType] = useState<'expense' | 'income'>('expense');
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  // 1. Totais Executivos e KPIs do Período
  const kpis = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });

    const net = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const incomeCommitment = income > 0 ? (expense / income) * 100 : expense > 0 ? 100 : 0;

    // Dias do mês atual e projeção
    const today = new Date();
    const isCurrentCalendarMonth = today.toISOString().substring(0, 7) === currentMonthPrefix;
    const daysInMonth = new Date(yearNum, parseInt(currentMonthPrefix.split('-')[1], 10), 0).getDate();
    const passedDays = isCurrentCalendarMonth ? Math.max(1, today.getDate()) : daysInMonth;

    const dailyAverageExpense = passedDays > 0 ? expense / passedDays : 0;
    const projectedExpense = isCurrentCalendarMonth ? dailyAverageExpense * daysInMonth : expense;

    return {
      income,
      expense,
      net,
      savingsRate,
      incomeCommitment,
      dailyAverageExpense,
      projectedExpense,
      daysInMonth,
      passedDays,
      isCurrentCalendarMonth,
    };
  }, [transactions, currentMonthPrefix, yearNum]);

  // 2. Evolução Diária no Mês (Área Dupla com Gradientes)
  const dailyFlowData = useMemo(() => {
    const daysCount = kpis.daysInMonth;
    const items = [];

    let cumIncome = 0;
    let cumExpense = 0;

    for (let day = 1; day <= daysCount; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentMonthPrefix}-${dayStr}`;

      const dayTxs = transactions.filter(t => t.date === dateStr);
      const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      cumIncome += dayIncome;
      cumExpense += dayExpense;

      items.push({
        day: `${dayStr}`,
        label: `${dayStr}/${currentMonthPrefix.split('-')[1]}`,
        Receita: dayIncome,
        Despesa: dayExpense,
        ReceitaAcumulada: cumIncome,
        DespesaAcumulada: cumExpense,
        SaldoDoDia: dayIncome - dayExpense,
      });
    }

    return items;
  }, [transactions, currentMonthPrefix, kpis.daysInMonth]);

  // 3. Composição de Categorias (Donut)
  const categoryComposition = useMemo(() => {
    const map: Record<string, { id: string; name: string; icon: string; color: string; amount: number; count: number }> = {};

    transactions
      .filter(t => t.type === donutType)
      .forEach(t => {
        const entries = getAnalyticalEntries(t);
        entries.forEach(entry => {
          if (entry.includeInReports === false) return;
          const resolved = resolveCategory(categories, entry.categoryId, entry.subcategoryId, donutType);
          const id = resolved.id;
          const name = resolved.name;
          const icon = resolved.icon;
          const color = resolved.color || '#9333ea';

          if (!map[id]) {
            map[id] = { id, name, icon, color, amount: 0, count: 0 };
          }
          map[id].amount += entry.amount;
          map[id].count += 1;
        });
      });

    const total = Object.values(map).reduce((sum, item) => sum + item.amount, 0);
    const sorted = Object.values(map)
      .map((item, idx) => ({
        ...item,
        percentage: total > 0 ? (item.amount / total) * 100 : 0,
        color: item.color || PALETTE[idx % PALETTE.length],
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      items: sorted,
      total,
      topCategories: sorted.slice(0, 5),
    };
  }, [transactions, categories, donutType]);

  // 4. Maiores Despesas do Mês
  const topExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  // 5. Gastos por Dia da Semana
  const weekdayData = useMemo(() => {
    const days = [
      { name: 'Dom', full: 'Domingo', amount: 0, count: 0 },
      { name: 'Seg', full: 'Segunda-feira', amount: 0, count: 0 },
      { name: 'Ter', full: 'Terça-feira', amount: 0, count: 0 },
      { name: 'Qua', full: 'Quarta-feira', amount: 0, count: 0 },
      { name: 'Qui', full: 'Quinta-feira', amount: 0, count: 0 },
      { name: 'Sex', full: 'Sexta-feira', amount: 0, count: 0 },
      { name: 'Sáb', full: 'Sábado', amount: 0, count: 0 },
    ];

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const d = new Date(t.date + 'T12:00:00');
        const dayIdx = d.getDay();
        if (!isNaN(dayIdx) && days[dayIdx]) {
          days[dayIdx].amount += t.amount;
          days[dayIdx].count += 1;
        }
      });

    const maxDay = [...days].sort((a, b) => b.amount - a.amount)[0];

    return {
      days,
      peakDay: maxDay?.amount > 0 ? maxDay : null,
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* 1. CARDS DE KPIS EXECUTIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entradas */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Entradas Totais
            </span>
            <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(kpis.income, user.currency, !user.showValues)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Recebido no período</span>
          </div>
        </div>

        {/* Saídas */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saídas Totais
            </span>
            <div className="w-8 h-8 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(kpis.expense, user.currency, !user.showValues)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Média: {formatCurrency(kpis.dailyAverageExpense, user.currency, !user.showValues)}/dia</span>
            {kpis.isCurrentCalendarMonth && (
              <span className="text-purple-600 dark:text-purple-400 font-bold">
                Proj: {formatCurrency(kpis.projectedExpense, user.currency, !user.showValues)}
              </span>
            )}
          </div>
        </div>

        {/* Balanço Líquido */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Balanço Líquido
            </span>
            <div
              className={`w-8 h-8 rounded-2xl flex items-center justify-center font-bold ${
                kpis.net >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {kpis.net >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black ${
              kpis.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(kpis.net, user.currency, !user.showValues)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {kpis.savingsRate > 0 ? `+${kpis.savingsRate.toFixed(1)}%` : `${kpis.savingsRate.toFixed(1)}%`}
            </span>
            <span>taxa de economia</span>
          </div>
        </div>

        {/* Comprometimento de Renda */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Comprometimento
            </span>
            <div className="w-8 h-8 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {kpis.incomeCommitment.toFixed(1)}%
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {kpis.incomeCommitment <= 70 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Dentro do padrão saudável (&lt;70%)</span>
            ) : kpis.incomeCommitment <= 90 ? (
              <span className="text-amber-500 font-bold">Atenção ao orçamento (70-90%)</span>
            ) : (
              <span className="text-rose-500 font-bold">Alerta: acima de 90% da receita</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. GRÁFICO DE EVOLUÇÃO DIÁRIA (FLUXO NO MÊS) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Evolução do Fluxo Diário ({monthName})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Comportamento dia a dia das receitas e despesas registradas
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300">Despesas</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={val => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl text-xs space-y-1 z-50">
                        <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                          Dia {data.label}
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold flex justify-between gap-4">
                          <span>Receita:</span>
                          <span>{formatCurrency(data.Receita, user.currency, !user.showValues)}</span>
                        </div>
                        <div className="text-rose-600 dark:text-rose-400 font-bold flex justify-between gap-4">
                          <span>Despesa:</span>
                          <span>{formatCurrency(data.Despesa, user.currency, !user.showValues)}</span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 font-bold flex justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>Saldo do dia:</span>
                          <span className={data.SaldoDoDia >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                            {formatCurrency(data.SaldoDoDia, user.currency, !user.showValues)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="Receita"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradientIncome)"
              />
              <Area
                type="monotone"
                dataKey="Despesa"
                stroke="#EF4444"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradientExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. GRID 2 COLUNAS: COMPOSIÇÃO DE CATEGORIAS + TOP DESPESAS & DIAS DA SEMANA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Composição em Donut Interativo */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Distribuição por Categoria</span>
              </h3>
              <p className="text-xs text-slate-400">
                Onde o dinheiro foi mais concentrado
              </p>
            </div>

            {/* Alternador Despesas / Receitas */}
            <div className="p-1 rounded-full bg-slate-100 dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 flex items-center text-xs font-bold shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setDonutType('expense');
                  setActiveDonutIndex(null);
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  donutType === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Despesas
              </button>
              <button
                type="button"
                onClick={() => {
                  setDonutType('income');
                  setActiveDonutIndex(null);
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  donutType === 'income'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Receitas
              </button>
            </div>
          </div>

          {categoryComposition.items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <PieIcon className="w-8 h-8 mb-2 opacity-30" />
              <span>Nenhuma movimentação de {donutType === 'expense' ? 'despesa' : 'receita'} no período</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Gráfico Donut com centro dinâmico */}
              <div className="sm:col-span-6 h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryComposition.items}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="amount"
                      activeIndex={activeDonutIndex !== null ? activeDonutIndex : undefined}
                      activeShape={renderActiveSector}
                      onMouseEnter={(_, index) => setActiveDonutIndex(index)}
                      onMouseLeave={() => setActiveDonutIndex(null)}
                    >
                      {categoryComposition.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Centro do Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {activeDonutIndex !== null && categoryComposition.items[activeDonutIndex]
                      ? categoryComposition.items[activeDonutIndex].name
                      : 'Total'}
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {activeDonutIndex !== null && categoryComposition.items[activeDonutIndex]
                      ? formatCurrency(categoryComposition.items[activeDonutIndex].amount, user.currency, !user.showValues)
                      : formatCurrency(categoryComposition.total, user.currency, !user.showValues)}
                  </span>
                  {activeDonutIndex !== null && categoryComposition.items[activeDonutIndex] && (
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      {categoryComposition.items[activeDonutIndex].percentage.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Lista dos Maiores Itens com barras de progresso */}
              <div className="sm:col-span-6 space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                {categoryComposition.items.map((cat, idx) => (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveDonutIndex(idx)}
                    onMouseLeave={() => setActiveDonutIndex(null)}
                    onClick={() => onNavigateToCategory && onNavigateToCategory(cat.id)}
                    className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                      activeDonutIndex === idx
                        ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700 shadow-xs'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm">{cat.icon || '🏷️'}</span>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span>{formatCurrency(cat.amount, user.currency, !user.showValues)}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                          ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    {/* Barra de progresso visual */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, cat.percentage)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Top 5 Maiores Despesas & Padrão por Dia da Semana */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top 5 Gastos */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Top 5 Maiores Gastos</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Impacto individual
              </span>
            </div>

            {topExpenses.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Nenhuma despesa para exibir
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {topExpenses.map((t, idx) => {
                  const resolved = resolveCategory(categories, t.categoryId, t.subcategoryId, 'expense');
                  const card = t.cardId ? cards.find(c => c.id === t.cardId) : null;
                  const acc = t.accountId ? accounts.find(a => a.id === t.accountId) : null;

                  return (
                    <div key={t.id || idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {resolved.icon || '💸'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {t.description || resolved.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                            <span>{formatDate(t.date)}</span>
                            <span>•</span>
                            <span className="truncate">
                              {card ? `Cartão ${card.name}` : acc ? acc.name : 'Outro'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="font-black text-rose-600 dark:text-rose-400 shrink-0 text-right">
                        {formatCurrency(t.amount, user.currency, !user.showValues)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Consumo por Dia da Semana */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Padrão Semanal de Gastos</span>
              </h3>
              {weekdayData.peakDay && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  Pico: {weekdayData.peakDay.name}
                </span>
              )}
            </div>

            <div className="h-36 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData.days} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => (v >= 1000 ? `${(v/1000).toFixed(0)}k` : v)} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2.5 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg text-xs space-y-0.5">
                            <div className="font-bold text-slate-900 dark:text-white">{data.full}</div>
                            <div className="text-rose-600 dark:text-rose-400 font-bold">
                              {formatCurrency(data.amount, user.currency, !user.showValues)}
                            </div>
                            <div className="text-[10px] text-slate-400">{data.count} despesas</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {weekdayData.days.map((d, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={weekdayData.peakDay?.name === d.name ? '#EF4444' : '#7C4DFF'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
