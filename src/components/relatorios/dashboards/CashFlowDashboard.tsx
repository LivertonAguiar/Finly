import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Layers,
  Scale,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Transaction, UserProfile } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface CashFlowDashboardProps {
  transactions: Transaction[];
  user: UserProfile;
  currentMonthPrefix: string;
  yearNum: number;
}

export const CashFlowDashboard: React.FC<CashFlowDashboardProps> = ({
  transactions,
  user,
  currentMonthPrefix,
  yearNum,
}) => {
  const [rangeType, setRangeType] = useState<'6m' | '12m' | 'year'>('6m');

  // 1. Dados temporais para o gráfico de fluxo de caixa (mês a mês)
  const monthlyFlowData = useMemo(() => {
    let monthsToScan: { prefix: string; label: string; year: number }[] = [];
    const baseDate = new Date(`${currentMonthPrefix}-01T12:00:00`);

    if (rangeType === '6m') {
      for (let i = -5; i <= 0; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        const prefix = d.toISOString().substring(0, 7);
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
        monthsToScan.push({ prefix, label, year: d.getFullYear() });
      }
    } else if (rangeType === '12m') {
      for (let i = -11; i <= 0; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        const prefix = d.toISOString().substring(0, 7);
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
        monthsToScan.push({ prefix, label, year: d.getFullYear() });
      }
    } else {
      // Ano vigente
      for (let m = 1; m <= 12; m++) {
        const prefix = `${yearNum}-${String(m).padStart(2, '0')}`;
        const d = new Date(`${prefix}-01T12:00:00`);
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
        monthsToScan.push({ prefix, label, year: yearNum });
      }
    }

    let runningAccumulatedBalance = 0;

    return monthsToScan.map(m => {
      const monthTxs = transactions.filter(t => t.date.startsWith(m.prefix));
      const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = income - expense;
      runningAccumulatedBalance += balance;

      const savingsRate = income > 0 ? (balance / income) * 100 : 0;

      return {
        key: m.prefix,
        label: `${m.label}/${String(m.year).slice(2)}`,
        displayMonth: `${m.label} ${m.year}`,
        Receita: income,
        Despesa: expense,
        Saldo: balance,
        SaldoAcumulado: runningAccumulatedBalance,
        savingsRate,
      };
    });
  }, [transactions, currentMonthPrefix, yearNum, rangeType]);

  // 2. Resumo consolidado do período selecionado
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    monthlyFlowData.forEach(m => {
      totalIncome += m.Receita;
      totalExpense += m.Despesa;
    });

    const net = totalIncome - totalExpense;
    const avgMonthlyIncome = monthlyFlowData.length > 0 ? totalIncome / monthlyFlowData.length : 0;
    const avgMonthlyExpense = monthlyFlowData.length > 0 ? totalExpense / monthlyFlowData.length : 0;
    const avgSavingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      net,
      avgMonthlyIncome,
      avgMonthlyExpense,
      avgSavingsRate,
    };
  }, [monthlyFlowData]);

  // 3. Evolução de Despesas por Semana do Mês Selecionado
  const weeksData = useMemo(() => {
    const curMonthTxs = transactions.filter(
      t => t.date.startsWith(currentMonthPrefix) && t.type === 'expense'
    );

    const weeks = [
      { name: 'Semana 1 (1-7)', amount: 0, count: 0 },
      { name: 'Semana 2 (8-14)', amount: 0, count: 0 },
      { name: 'Semana 3 (15-21)', amount: 0, count: 0 },
      { name: 'Semana 4 (22-28)', amount: 0, count: 0 },
      { name: 'Semana 5 (29-31)', amount: 0, count: 0 },
    ];

    curMonthTxs.forEach(t => {
      const day = parseInt(t.date.split('-')[2], 10);
      if (day <= 7) {
        weeks[0].amount += t.amount;
        weeks[0].count += 1;
      } else if (day <= 14) {
        weeks[1].amount += t.amount;
        weeks[1].count += 1;
      } else if (day <= 21) {
        weeks[2].amount += t.amount;
        weeks[2].count += 1;
      } else if (day <= 28) {
        weeks[3].amount += t.amount;
        weeks[3].count += 1;
      } else {
        weeks[4].amount += t.amount;
        weeks[4].count += 1;
      }
    });

    return weeks.filter(w => w.amount > 0 || w.name.startsWith('Semana 1') || w.name.startsWith('Semana 2'));
  }, [transactions, currentMonthPrefix]);

  return (
    <div className="space-y-6">
      {/* 1. SELETOR DE JANELA TEMPORAL & CARDS CONSOLIDADOS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Fluxo de Caixa Histórico & Projeções</span>
          </h3>
          <p className="text-xs text-slate-400">
            Acompanhe o equilíbrio entre entradas e saídas ao longo do tempo
          </p>
        </div>

        {/* Range Selector Pill */}
        <div className="p-1 rounded-full bg-slate-100 dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 flex items-center text-xs font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setRangeType('6m')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              rangeType === '6m'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Últimos 6 Meses
          </button>
          <button
            type="button"
            onClick={() => setRangeType('12m')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              rangeType === '12m'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Últimos 12 Meses
          </button>
          <button
            type="button"
            onClick={() => setRangeType('year')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              rangeType === 'year'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ano {yearNum}
          </button>
        </div>
      </div>

      {/* Mini KPIs do Período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase mb-2">
            <span>Média Mensal de Entradas</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {formatCurrency(summary.avgMonthlyIncome, user.currency, !user.showValues)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total no período: {formatCurrency(summary.totalIncome, user.currency, !user.showValues)}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase mb-2">
            <span>Média Mensal de Saídas</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {formatCurrency(summary.avgMonthlyExpense, user.currency, !user.showValues)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total no período: {formatCurrency(summary.totalExpense, user.currency, !user.showValues)}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase mb-2">
            <span>Resultado Acumulado</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div
            className={`text-lg sm:text-xl font-black ${
              summary.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summary.net, user.currency, !user.showValues)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {summary.avgSavingsRate.toFixed(1)}%
            </span>
            <span>de poupança média</span>
          </div>
        </div>
      </div>

      {/* 2. GRÁFICO COMPOSTO: BARRAS DE ENTRADA/SAÍDA + LINHA DE SALDO */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Receitas, Despesas e Saldo Líquido</span>
            </h4>
            <p className="text-xs text-slate-400">
              Barras para entradas e saídas com linha indicadora do saldo final
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300">Despesas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-600 dark:text-slate-300">Saldo Líquido</span>
            </div>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => (v >= 1000 ? `${(v/1000).toFixed(0)}k` : v)} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl text-xs space-y-1.5">
                        <div className="font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                          {data.displayMonth}
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold flex justify-between gap-4">
                          <span>Receitas:</span>
                          <span>{formatCurrency(data.Receita, user.currency, !user.showValues)}</span>
                        </div>
                        <div className="text-rose-600 dark:text-rose-400 font-bold flex justify-between gap-4">
                          <span>Despesas:</span>
                          <span>{formatCurrency(data.Despesa, user.currency, !user.showValues)}</span>
                        </div>
                        <div className="text-purple-600 dark:text-purple-400 font-black flex justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>Saldo do mês:</span>
                          <span>{formatCurrency(data.Saldo, user.currency, !user.showValues)}</span>
                        </div>
                        <div className="text-slate-400 text-[10px] flex justify-between gap-4">
                          <span>Poupança:</span>
                          <span>{data.savingsRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="Receita" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Despesa" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Line
                type="monotone"
                dataKey="Saldo"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#8B5CF6' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. GRID 2 COLUNAS: TABELA DETALHADA MÊS A MÊS + RITMO SEMANAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela Analítica Mês a Mês */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Demonstrativo Mensal Detalhado
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {monthlyFlowData.length} competências
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400">
                  <th className="py-2 px-1">Mês</th>
                  <th className="py-2 px-1 text-right">Receitas</th>
                  <th className="py-2 px-1 text-right">Despesas</th>
                  <th className="py-2 px-1 text-right">Saldo</th>
                  <th className="py-2 px-1 text-right">Taxa Poupança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
                {monthlyFlowData.map(m => (
                  <tr key={m.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-1 text-slate-900 dark:text-white">{m.displayMonth}</td>
                    <td className="py-2.5 px-1 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(m.Receita, user.currency, !user.showValues)}
                    </td>
                    <td className="py-2.5 px-1 text-right text-rose-600 dark:text-rose-400">
                      {formatCurrency(m.Despesa, user.currency, !user.showValues)}
                    </td>
                    <td
                      className={`py-2.5 px-1 text-right ${
                        m.Saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(m.Saldo, user.currency, !user.showValues)}
                    </td>
                    <td className="py-2.5 px-1 text-right text-slate-500 dark:text-slate-400">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] ${
                          m.savingsRate > 20
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : m.savingsRate > 0
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {m.savingsRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ritmo Semanal do Mês */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Ritmo de Despesas
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              No mês
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Distribuição dos gastos pelas semanas do mês
          </p>

          <div className="space-y-3 pt-2">
            {weeksData.map((w, idx) => {
              const maxWeek = Math.max(...weeksData.map(x => x.amount), 1);
              const pct = (w.amount / maxWeek) * 100;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{w.name}</span>
                    <span className="text-rose-600 dark:text-rose-400">
                      {formatCurrency(w.amount, user.currency, !user.showValues)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
