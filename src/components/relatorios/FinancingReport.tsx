import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Building,
  TrendingDown,
  Percent,
  Calendar,
  Zap,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Debt } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  generateAmortizationSchedule,
  simulateExtraordinaryAmortization,
} from '../../utils/financingCalculations';

interface FinancingReportProps {
  debts: Debt[];
  currency?: string;
  isBento?: boolean;
}

export const FinancingReport: React.FC<FinancingReportProps> = ({
  debts,
  currency = 'BRL',
  isBento = false,
}) => {
  // Filtrar contratos válidos ou que possuam saldo/parcelas
  const activeDebts = useMemo(() => {
    return debts.filter(d => (d.remainingAmount || d.totalAmount) > 0);
  }, [debts]);

  const [selectedDebtId, setSelectedDebtId] = useState<string>(() => {
    return activeDebts[0]?.id || '';
  });

  const selectedDebt = useMemo(() => {
    return activeDebts.find(d => d.id === selectedDebtId) || activeDebts[0] || null;
  }, [activeDebts, selectedDebtId]);

  // Estado de simulação extraordinária rápida
  const [extraAmount, setExtraAmount] = useState<number>(5000);

  // Geração do cronograma e métricas do contrato selecionado
  const scheduleData = useMemo(() => {
    if (!selectedDebt) return null;
    const isFixed = selectedDebt.indexer === 'FIXED';
    const rate = isFixed ? 0 : (selectedDebt.indexerRate ?? 0);
    const remainingMonths = Math.max(1, selectedDebt.totalInstallments - (selectedDebt.paidInstallments || 0));

    const result = generateAmortizationSchedule({
      principal: selectedDebt.remainingAmount || selectedDebt.totalAmount,
      nominalAnnualRate: selectedDebt.interestRate || 8.5,
      remainingMonths,
      paidInstallments: selectedDebt.paidInstallments || 0,
      system: selectedDebt.amortizationSystem || 'PRICE',
      indexer: selectedDebt.indexer || (selectedDebt.contractType === 'loan' ? 'FIXED' : 'TR'),
      monthlyIndexerRate: rate,
      monthlyTR: selectedDebt.indexer === 'TR' ? rate : 0,
      monthlyInsurance: selectedDebt.insuranceMonthly || 0,
      adminFee: selectedDebt.adminFeeMonthly || 0,
      startDate: selectedDebt.nextDueDate ? new Date(selectedDebt.nextDueDate) : new Date(),
    });

    return result;
  }, [selectedDebt]);

  // Simulação de amortização extraordinária
  const simulationData = useMemo(() => {
    if (!selectedDebt || extraAmount <= 0) return null;
    const isFixed = selectedDebt.indexer === 'FIXED';
    const rate = isFixed ? 0 : (selectedDebt.indexerRate ?? 0);
    const remainingMonths = Math.max(1, selectedDebt.totalInstallments - (selectedDebt.paidInstallments || 0));

    return simulateExtraordinaryAmortization({
      currentBalance: selectedDebt.remainingAmount || selectedDebt.totalAmount,
      nominalAnnualRate: selectedDebt.interestRate || 8.5,
      remainingMonths,
      system: selectedDebt.amortizationSystem || 'PRICE',
      indexer: selectedDebt.indexer || (selectedDebt.contractType === 'loan' ? 'FIXED' : 'TR'),
      monthlyIndexerRate: rate,
      monthlyTR: selectedDebt.indexer === 'TR' ? rate : 0,
      monthlyInsurance: selectedDebt.insuranceMonthly || 0,
      adminFee: selectedDebt.adminFeeMonthly || 0,
      extraLumpSum: extraAmount,
      extraMonthlyPayment: 0,
    });
  }, [selectedDebt, extraAmount]);

  // Amostragem para gráficos (amostra de pontos para contratos longos ex: 360 meses)
  const chartData = useMemo(() => {
    if (!scheduleData?.schedule) return [];
    const totalRows = scheduleData.schedule.length;
    if (totalRows <= 36) {
      return scheduleData.schedule.map(row => ({
        month: `P.${row.installmentNumber}`,
        saldo: Math.round(row.finalBalance),
        amortizacao: Math.round(row.amortizationAmount),
        juros: Math.round(row.interestAmount),
        encargos: Math.round(row.insuranceAmount + row.adminFeeAmount),
        parcela: Math.round(row.totalInstallment),
      }));
    }

    // Amostragem proporcional a cada N meses
    const step = Math.ceil(totalRows / 30);
    const sampled = [];
    for (let i = 0; i < totalRows; i += step) {
      const row = scheduleData.schedule[i];
      sampled.push({
        month: `Mês ${row.installmentNumber}`,
        saldo: Math.round(row.finalBalance),
        amortizacao: Math.round(row.amortizationAmount),
        juros: Math.round(row.interestAmount),
        encargos: Math.round(row.insuranceAmount + row.adminFeeAmount),
        parcela: Math.round(row.totalInstallment),
      });
    }
    // Incluir o último mês
    const lastRow = scheduleData.schedule[totalRows - 1];
    if (sampled[sampled.length - 1]?.month !== `Mês ${lastRow.installmentNumber}`) {
      sampled.push({
        month: `Mês ${lastRow.installmentNumber}`,
        saldo: Math.round(lastRow.finalBalance),
        amortizacao: Math.round(lastRow.amortizationAmount),
        juros: Math.round(lastRow.interestAmount),
        encargos: Math.round(lastRow.insuranceAmount + lastRow.adminFeeAmount),
        parcela: Math.round(lastRow.totalInstallment),
      });
    }
    return sampled;
  }, [scheduleData]);

  // Se não houver financiamentos/dívidas cadastradas
  if (!selectedDebt || !scheduleData) {
    return (
      <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-800/30">
          <Building className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Nenhum Financiamento ou Empréstimo Ativo
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          Cadastre seus contratos de financiamento imobiliário, veicular ou empréstimos na aba Dívidas para visualizar projeções de saldo, curva de juros e simulações de quitação antecipada.
        </p>
      </div>
    );
  }

  const remainingMonths = Math.max(1, selectedDebt.totalInstallments - (selectedDebt.paidInstallments || 0));
  const progressPercent = Math.min(100, Math.round(((selectedDebt.paidInstallments || 0) / selectedDebt.totalInstallments) * 100));

  return (
    <div className="space-y-6">
      {/* Seletor de Contrato (se houver múltiplos) & Header do Relatório */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {selectedDebt.title}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 uppercase">
                {selectedDebt.amortizationSystem || 'PRICE'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedDebt.creditor || 'Contrato Ativo'} • {selectedDebt.paidInstallments || 0} de {selectedDebt.totalInstallments} parcelas pagas ({progressPercent}%)
            </p>
          </div>
        </div>

        {activeDebts.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-medium whitespace-nowrap">Contrato:</label>
            <select
              value={selectedDebtId}
              onChange={(e) => setSelectedDebtId(e.target.value)}
              className="text-xs sm:text-sm font-semibold bg-gray-50 dark:bg-[#242429] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            >
              {activeDebts.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} ({formatCurrency(d.remainingAmount || d.totalAmount, currency)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4 Cards de Métricas Principais */}
      <div className={`grid ${isBento ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* Saldo Devedor */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Saldo Devedor</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(selectedDebt.remainingAmount || selectedDebt.totalAmount, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Original:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {formatCurrency(selectedDebt.totalAmount, currency)}
            </span>
          </div>
        </div>

        {/* Juros Futuros Projetados */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Juros Projetados</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {formatCurrency(scheduleData.totalInterest, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Taxa:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {selectedDebt.interestRate || 8.5}% a.a. {selectedDebt.indexer ? `+ ${selectedDebt.indexer}` : ''}
            </span>
          </div>
        </div>

        {/* Eficiência da Parcela */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Eficiência Parcela</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {scheduleData.averageEfficiency.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Média de amortização real do principal
          </div>
        </div>

        {/* Previsão de Término */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Quitação Prevista</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
            {scheduleData.estimatedEndDate ? formatDate(scheduleData.estimatedEndDate) : `${remainingMonths} meses`}
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Restam <strong className="text-gray-800 dark:text-gray-200">{remainingMonths}</strong> parcelas
          </div>
        </div>
      </div>

      {/* Gráficos em Grade Bento ou Modo Focado */}
      <div className={`grid ${isBento ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 gap-6'} gap-6`}>
        {/* Gráfico 1: Curva de Amortização e Evolução do Saldo Devedor */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Curva de Decaimento do Saldo Devedor
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Projeção matemática da redução do saldo até a quitação final
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Projeção Mensal</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.15} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value), currency), 'Saldo Devedor']}
                  contentStyle={{
                    backgroundColor: '#1E1E24',
                    borderColor: '#374151',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                  name="Saldo Devedor"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Decomposição das Parcelas (Amortização vs Juros vs Encargos) */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Composição das Parcelas (Amortização vs. Juros)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Veja para onde vai cada real pago: amortização de saldo vs juros e taxas
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Principal
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-2"></span> Juros
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.15} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `R$ ${v}`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [formatCurrency(Number(value), currency), name]}
                  contentStyle={{
                    backgroundColor: '#1E1E24',
                    borderColor: '#374151',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconType="circle"
                />
                <Bar dataKey="amortizacao" stackId="a" fill="#10b981" name="Amortização Real" radius={[0, 0, 0, 0]} />
                <Bar dataKey="juros" stackId="a" fill="#f59e0b" name="Juros do Período" radius={[0, 0, 0, 0]} />
                <Bar dataKey="encargos" stackId="a" fill="#6366f1" name="Seguros / Taxas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Seção Interativa de Amortização Extraordinária */}
      <div className="bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-transparent border border-indigo-500/20 dark:border-indigo-500/30 rounded-3xl p-5 sm:p-7 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Simulador de Impacto da Amortização Extraordinária
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Descubra quanto você economiza em juros abatendo valores diretamente no saldo devedor
              </p>
            </div>
          </div>

          {/* Botões Rápidos de Aporte Extra */}
          <div className="flex flex-wrap items-center gap-2">
            {[1000, 3000, 5000, 10000, 20000].map((val) => (
              <button
                key={val}
                onClick={() => setExtraAmount(val)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  extraAmount === val
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30'
                    : 'bg-white dark:bg-[#202026] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-indigo-500/50'
                }`}
              >
                + {formatCurrency(val, currency)}
              </button>
            ))}
          </div>
        </div>

        {simulationData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cenário 1: Redução de Prazo (Mais recomendada financeiramente) */}
            <div className="bg-white/80 dark:bg-[#1C1C22]/90 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden shadow-sm">
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wide">
                <Zap className="w-3 h-3" /> Recomendado
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Opção 1: Redução de Prazo
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Mantém o valor da parcela atual e elimina as últimas prestações da fila.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Juros Economizados</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(simulationData.reduceTerm.interestSaved, currency)}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Tempo Adiantado</span>
                  <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {simulationData.reduceTerm.monthsSaved} meses
                    {simulationData.reduceTerm.yearsSaved > 0 && ` (${simulationData.reduceTerm.yearsSaved.toFixed(1)} anos)`}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Nova data estimada de término:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(simulationData.reduceTerm.newEstimatedEndDate)}
                </span>
              </div>
            </div>

            {/* Cenário 2: Redução do Valor da Parcela */}
            <div className="bg-white/80 dark:bg-[#1C1C22]/90 border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-purple-500" />
                Opção 2: Alívio de Parcela Mensal
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Mantém o prazo contratual intacto e diminui o valor pago todo mês.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Economia Mensal</span>
                  <span className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                    -{formatCurrency(simulationData.reduceInstallment.monthlyReduction, currency)}/mês
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Juros Economizados</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(simulationData.reduceInstallment.interestSaved, currency)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Nova parcela mensal estimada:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(simulationData.reduceInstallment.newInstallment, currency)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-gray-400">
            Digite ou selecione um valor acima de R$ 0 para simular a amortização.
          </div>
        )}
      </div>
    </div>
  );
};
