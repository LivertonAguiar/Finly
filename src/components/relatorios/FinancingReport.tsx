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
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileText,
  DollarSign,
  Landmark,
} from 'lucide-react';
import { Debt, DebtPayment } from '../../types';
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
  const [showHistoricalList, setShowHistoricalList] = useState<boolean>(false);

  // Geração do cronograma e métricas do contrato selecionado
  const scheduleData = useMemo(() => {
    if (!selectedDebt) return null;
    const isFixed = selectedDebt.indexer === 'FIXED';
    const rate = isFixed ? 0 : (selectedDebt.indexerRate ?? 0);
    const remainingMonths = Math.max(1, selectedDebt.totalInstallments - (selectedDebt.paidInstallments || 0));

    const result = generateAmortizationSchedule({
      principal: selectedDebt.remainingAmount || selectedDebt.totalAmount,
      nominalAnnualRate: selectedDebt.interestRate || 4.25,
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
      nominalAnnualRate: selectedDebt.interestRate || 4.25,
      remainingMonths,
      system: selectedDebt.amortizationSystem || 'PRICE',
      indexer: selectedDebt.indexer || (selectedDebt.contractType === 'loan' ? 'FIXED' : 'TR'),
      monthlyIndexerRate: rate,
      monthlyTR: selectedDebt.indexer === 'TR' ? rate : 0,
      monthlyInsurance: selectedDebt.insuranceMonthly || 0,
      adminFee: selectedDebt.adminFeeMonthly || 0,
      startDate: selectedDebt.nextDueDate ? new Date(selectedDebt.nextDueDate) : new Date(),
      extraLumpSum: extraAmount,
      extraMonthlyPayment: 0,
    });
  }, [selectedDebt, extraAmount]);

  // Totais consolidados das parcelas históricas pagas antes do Finly
  const historicalStats = useMemo(() => {
    if (!selectedDebt?.payments || selectedDebt.payments.length === 0) return null;

    const payments = selectedDebt.payments.filter(
      p => p.installmentNumber <= (selectedDebt.paidInstallments || 0)
    );

    if (payments.length === 0) return null;

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalAmortized = payments.reduce((sum, p) => sum + (p.amortizationAmount || 0), 0);
    const totalInterest = payments.reduce((sum, p) => sum + (p.interestAmount || 0), 0);
    const totalInsurance = payments.reduce((sum, p) => sum + (p.insuranceAmount || 0), 0);
    const totalCorrection = payments.reduce((sum, p) => sum + (p.correctionAmount || 0), 0);

    return {
      count: payments.length,
      totalPaid,
      totalAmortized,
      totalInterest,
      totalInsurance,
      totalCorrection,
      payments: [...payments].sort((a, b) => a.installmentNumber - b.installmentNumber),
    };
  }, [selectedDebt]);

  // Amostragem para gráficos (combinando histórico e projeção futura)
  const chartData = useMemo(() => {
    if (!scheduleData?.schedule) return [];

    const result: Array<{
      month: string;
      saldo: number;
      amortizacao: number;
      juros: number;
      encargos: number;
      parcela: number;
    }> = [];

    // 1. Incluir pontos históricos se existirem
    if (historicalStats && historicalStats.payments.length > 0) {
      historicalStats.payments.forEach(p => {
        result.push({
          month: `P.${p.installmentNumber} (Paga)`,
          saldo: Math.round(p.remainingBalanceAfter || 0),
          amortizacao: Math.round(p.amortizationAmount || 0),
          juros: Math.round(p.interestAmount || 0),
          encargos: Math.round(p.insuranceAmount || 0),
          parcela: Math.round(p.amount),
        });
      });
    }

    // 2. Incluir amostra das parcelas futuras
    const totalRows = scheduleData.schedule.length;
    const step = Math.max(1, Math.ceil(totalRows / 25));

    for (let i = 0; i < totalRows; i += step) {
      const row = scheduleData.schedule[i];
      result.push({
        month: `P.${row.installmentNumber}`,
        saldo: Math.round(row.finalBalance),
        amortizacao: Math.round(row.amortizationAmount),
        juros: Math.round(row.interestAmount),
        encargos: Math.round(row.insuranceAmount + row.adminFeeAmount),
        parcela: Math.round(row.totalInstallment),
      });
    }

    // Garantir inclusão da última parcela
    if (totalRows > 0) {
      const lastRow = scheduleData.schedule[totalRows - 1];
      const lastLabel = `P.${lastRow.installmentNumber}`;
      if (result[result.length - 1]?.month !== lastLabel) {
        result.push({
          month: lastLabel,
          saldo: Math.round(lastRow.finalBalance),
          amortizacao: Math.round(lastRow.amortizationAmount),
          juros: Math.round(lastRow.interestAmount),
          encargos: Math.round(lastRow.insuranceAmount + lastRow.adminFeeAmount),
          parcela: Math.round(lastRow.totalInstallment),
        });
      }
    }

    return result;
  }, [scheduleData, historicalStats]);

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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {selectedDebt.title}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 uppercase">
                {selectedDebt.amortizationSystem || 'PRICE'}
              </span>
              {selectedDebt.indexer && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                  {selectedDebt.indexer}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Saldo Devedor Atual</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(selectedDebt.remainingAmount || selectedDebt.totalAmount, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Original Financiado:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {formatCurrency(selectedDebt.totalAmount, currency)}
            </span>
          </div>
        </div>

        {/* Juros Futuros Projetados */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Juros Futuros</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {formatCurrency(scheduleData.totalInterest, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Taxa Contratual:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {selectedDebt.interestRate || 4.25}% a.a. {selectedDebt.indexer ? `+ ${selectedDebt.indexer}` : ''}
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
            Restam <strong className="text-gray-800 dark:text-gray-200">{remainingMonths}</strong> de {selectedDebt.totalInstallments} parcelas
          </div>
        </div>
      </div>

      {/* NOVO: Card Especial - Dados Iniciais do Contrato & Histórico de Parcelas Pagas antes do Finly */}
      <div className="bg-white dark:bg-[#18181C] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Dados Iniciais do Contrato & Histórico de Parcelas Pagas</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  {selectedDebt.paidInstallments || 0} parcelas pagas antes do Finly
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informações oficiais registradas na assinatura e demonstrativos bancários da Caixa Econômica Federal
              </p>
            </div>
          </div>

          {historicalStats && (
            <button
              onClick={() => setShowHistoricalList(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#222228] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2a2a32] text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
            >
              <span>{showHistoricalList ? 'Ocultar Lançamentos' : 'Ver 20 Comprovantes'}</span>
              {showHistoricalList ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Grade com os Dados Iniciais do Contrato */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C22] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Data de Assinatura
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
              17/01/2025
            </span>
            <span className="text-[11px] text-slate-500">Início da vigência Caixa SFH</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C22] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Valor Financiado
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block font-mono">
              {formatCurrency(selectedDebt.totalAmount, currency)}
            </span>
            <span className="text-[11px] text-slate-500">Prazo de 420 meses</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C22] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Avaliação do Imóvel
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block font-mono">
              {formatCurrency(213450.00, currency)}
            </span>
            <span className="text-[11px] text-slate-500">Garantia fiduciária</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C22] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              FGTS na Entrada
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block font-mono">
              {formatCurrency(2899.00, currency)}
            </span>
            <span className="text-[11px] text-slate-500">Abatimento inicial</span>
          </div>
        </div>

        {/* Consolidação do que já foi pago no histórico (P1 a P20) */}
        {historicalStats && (
          <div className="p-4 rounded-2xl bg-emerald-500/[0.03] dark:bg-emerald-950/15 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Consolidação das 20 Parcelas Pagas no Histórico (Fev/2025 a Set/2026)
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Total Pago: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(historicalStats.totalPaid, currency)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16161A] border border-slate-200/70 dark:border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">Amortização do Principal</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {formatCurrency(historicalStats.totalAmortized, currency)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16161A] border border-slate-200/70 dark:border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">Juros Pagos no Período</span>
                <span className="font-bold text-rose-500 font-mono text-sm">
                  {formatCurrency(historicalStats.totalInterest, currency)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16161A] border border-slate-200/70 dark:border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">Seguros MIP/DFI Pagos</span>
                <span className="font-bold text-purple-500 font-mono text-sm">
                  {formatCurrency(historicalStats.totalInsurance, currency)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16161A] border border-slate-200/70 dark:border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">Correção TR Acumulada</span>
                <span className="font-bold text-amber-500 font-mono text-sm">
                  +{formatCurrency(historicalStats.totalCorrection, currency)}
                </span>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
              * Conforme solicitado, essas 20 parcelas constam exclusivamente no registro de evolução da dívida e nos relatórios de patrimônio, <strong>sem poluir os lançamentos do extrato bancário dos meses anteriores</strong>. As transações ativas iniciam a partir de outubro/2026 com a Parcela 21.
            </p>
          </div>
        )}

        {/* Tabela expansível dos 20 comprovantes */}
        {showHistoricalList && historicalStats && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#141418] mt-3">
            <div className="overflow-x-auto max-h-[360px] scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-[#1C1C22] text-[11px] font-mono text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-white/[0.08]">
                  <tr>
                    <th className="py-2.5 px-3 text-center">Nº</th>
                    <th className="py-2.5 px-3">Vencimento</th>
                    <th className="py-2.5 px-3 text-right">Amortização</th>
                    <th className="py-2.5 px-3 text-right">Juros</th>
                    <th className="py-2.5 px-3 text-right">Seguro</th>
                    <th className="py-2.5 px-3 text-right">Correção TR</th>
                    <th className="py-2.5 px-3 text-right">Saldo Devedor</th>
                    <th className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">Valor Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] font-mono">
                  {historicalStats.payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1A1A22]">
                      <td className="py-2 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                        {p.installmentNumber}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(p.date)}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(p.amortizationAmount || 0, currency)}
                      </td>
                      <td className="py-2 px-3 text-right text-rose-500 font-medium">
                        {formatCurrency(p.interestAmount || 0, currency)}
                      </td>
                      <td className="py-2 px-3 text-right text-purple-400 font-medium">
                        {formatCurrency(p.insuranceAmount || 0, currency)}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-500 font-medium">
                        +{formatCurrency(p.correctionAmount || 0, currency)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-800 dark:text-slate-200 font-medium">
                        {formatCurrency(p.remainingBalanceAfter || 0, currency)}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(p.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                Histórico real (P1 a P20) seguido da projeção Price + TR até a quitação final
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Histórico + Projeção</span>
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

          {/* Botões Rápidos e Campo Personalizado de Aporte Extra */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-xs font-bold text-gray-400">R$</span>
              <input
                type="number"
                min="0"
                step="500"
                value={extraAmount || ''}
                onChange={(e) => setExtraAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="Outro valor..."
                className="w-28 sm:w-32 pl-8 pr-2 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202026] text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            {[1000, 3000, 5000, 10000, 20000].map((val) => (
              <button
                key={val}
                onClick={() => setExtraAmount(val)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
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
