import React, { useState, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Search,
  Download,
  Info,
  CheckCircle2,
  Percent,
  Clock,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Debt } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateAmortizationSchedule } from '../../utils/financingCalculations';

interface FinancingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt;
  currency?: string;
}

export interface ScheduleRowView {
  installmentNumber: number;
  dueDate: string;
  correctedBalance: number;
  amortizationAmount: number;
  interestAmount: number;
  insuranceAmount: number;
  trCorrection: number;
  installmentEfficiency: number;
  netBalanceVariation: number;
  isBalanceIncreasing: boolean;
  totalInstallment: number;
  status: 'historical_paid' | 'completed' | 'future';
}

export const FinancingScheduleModal: React.FC<FinancingScheduleModalProps> = ({
  isOpen,
  onClose,
  debt,
  currency = 'BRL',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'historical' | 'future'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 24; // Mostra 24 meses por página

  // Cálculo do cronograma futuro projetado
  const scheduleResult = useMemo(() => {
    const isFixed = debt.indexer === 'FIXED';
    const rate = isFixed ? 0 : (debt.indexerRate ?? 0);
    return generateAmortizationSchedule({
      principal: debt.remainingAmount || debt.totalAmount,
      nominalAnnualRate: debt.interestRate || 4.25,
      remainingMonths: Math.max(0, debt.totalInstallments - (debt.paidInstallments || 0)),
      paidInstallments: debt.paidInstallments || 0,
      system: debt.amortizationSystem || 'PRICE',
      indexer: debt.indexer || (debt.contractType === 'loan' ? 'FIXED' : 'TR'),
      monthlyIndexerRate: rate,
      monthlyTR: debt.indexer === 'TR' ? rate : 0,
      monthlyInsurance: debt.insuranceMonthly || 0,
      adminFee: debt.adminFeeMonthly || 0,
      startDate: debt.nextDueDate ? new Date(debt.nextDueDate) : new Date(),
    });
  }, [debt]);

  // Linhas históricas (pagas antes do Finly)
  const historicalRows: ScheduleRowView[] = useMemo(() => {
    if (!debt.payments || debt.payments.length === 0) return [];

    const sorted = [...debt.payments]
      .filter(p => p.installmentNumber <= (debt.paidInstallments || 0))
      .sort((a, b) => a.installmentNumber - b.installmentNumber);

    return sorted.map(p => {
      const amort = p.amortizationAmount ?? 0;
      const interest = p.interestAmount ?? 0;
      const insurance = p.insuranceAmount ?? 0;
      const correction = p.correctionAmount ?? 0;
      const total = p.amount;
      const remAfter = p.remainingBalanceAfter ?? 0;
      const correctedBalance = remAfter + amort;
      const netVariation = Math.round((correction - amort) * 100) / 100;
      const efficiency = total > 0 ? Math.round((amort / total) * 10000) / 100 : 0;

      const isHistorical = p.isHistorical ?? true;
      const status: 'historical_paid' | 'completed' = isHistorical ? 'historical_paid' : 'completed';

      return {
        installmentNumber: p.installmentNumber,
        dueDate: p.date,
        correctedBalance,
        amortizationAmount: amort,
        interestAmount: interest,
        insuranceAmount: insurance,
        trCorrection: correction,
        installmentEfficiency: efficiency,
        netBalanceVariation: netVariation,
        isBalanceIncreasing: netVariation > 0,
        totalInstallment: total,
        status,
      };
    });
  }, [debt.payments, debt.paidInstallments]);

  // Linhas futuras calculadas
  const futureRows: ScheduleRowView[] = useMemo(() => {
    return scheduleResult.schedule.map(row => ({
      installmentNumber: row.installmentNumber,
      dueDate: row.dueDate,
      correctedBalance: row.correctedBalance,
      amortizationAmount: row.amortizationAmount,
      interestAmount: row.interestAmount,
      insuranceAmount: row.insuranceAmount,
      trCorrection: row.trCorrection,
      installmentEfficiency: row.installmentEfficiency,
      netBalanceVariation: row.netBalanceVariation,
      isBalanceIncreasing: row.isBalanceIncreasing,
      totalInstallment: row.totalInstallment,
      status: 'future' as const,
    }));
  }, [scheduleResult]);

  // Junção de todas as parcelas (históricas + futuras)
  const allRows: ScheduleRowView[] = useMemo(() => {
    return [...historicalRows, ...futureRows];
  }, [historicalRows, futureRows]);

  // Filtragem combinada por busca e status
  const filteredSchedule = useMemo(() => {
    let rows = allRows;

    if (statusFilter === 'historical') {
      rows = rows.filter(r => r.status === 'historical_paid' || r.status === 'completed');
    } else if (statusFilter === 'future') {
      rows = rows.filter(r => r.status === 'future');
    }

    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(
      row =>
        String(row.installmentNumber).includes(term) ||
        row.dueDate.toLowerCase().includes(term) ||
        row.totalInstallment.toFixed(2).includes(term)
    );
  }, [allRows, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredSchedule.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSchedule.slice(start, start + pageSize);
  }, [filteredSchedule, page, pageSize]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cronograma de Amortização • ${debt.title}`}
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Bento Summary Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Saldo Devedor Atual */}
          <div className="p-4 rounded-[20px] bg-slate-50 dark:bg-[#18181C] border border-slate-200/80 dark:border-white/[0.08] space-y-1">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Saldo Devedor
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white mono-metric block truncate">
              {formatCurrency(debt.remainingAmount, currency)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {debt.totalInstallments - (debt.paidInstallments || 0)} de {debt.totalInstallments} restantes
            </span>
          </div>

          {/* Juros Futuros Projetados */}
          <div className="p-4 rounded-[20px] bg-rose-500/[0.04] dark:bg-rose-950/20 border border-rose-500/20 space-y-1">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-rose-500 dark:text-rose-400/80 font-bold block">
              Total Juros Futuros
            </span>
            <span className="text-lg font-black text-rose-600 dark:text-[#fb7185] mono-metric block truncate">
              {formatCurrency(scheduleResult.totalInterest, currency)}
            </span>
            <span className="text-[11px] text-rose-500/80 font-medium">
              Taxa {debt.interestRate || 4.25}% a.a.
            </span>
          </div>

          {/* Seguros Totais */}
          <div className="p-4 rounded-[20px] bg-purple-500/[0.04] dark:bg-purple-950/20 border border-purple-500/20 space-y-1">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-purple-500 dark:text-purple-400/80 font-bold block">
              Seguros (MIP/DFI)
            </span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-300 mono-metric block truncate">
              {formatCurrency(scheduleResult.totalInsurance, currency)}
            </span>
            <span className="text-[11px] text-purple-400/80 font-medium">
              {formatCurrency(debt.insuranceMonthly || 0, currency)} / mês
            </span>
          </div>

          {/* Término Estimado */}
          <div className="p-4 rounded-[20px] bg-emerald-500/[0.04] dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-emerald-500 dark:text-emerald-400/80 font-bold block">
              Término Estimado
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-[#5eead4] mono-metric block truncate">
              {formatDate(scheduleResult.estimatedEndDate)}
            </span>
            <span className="text-[11px] text-emerald-500/80 font-medium">
              Sistema {debt.amortizationSystem || 'PRICE (TP)'}
            </span>
          </div>
        </div>

        {/* Diagnostic Insights: Eficiência da Parcela & Fenômeno Price + TR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Eficiência da Próxima Parcela */}
          <div className="p-4 rounded-[20px] bg-slate-50 dark:bg-[#18181C] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Eficiência da Próxima Parcela (P{(debt.paidInstallments || 0) + 1})
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {scheduleResult.firstInstallmentEfficiency.toFixed(1)}% do valor pago
              </span>
            </div>

            {/* Progress bar visualizing Amortization vs Interest/Fees */}
            <div className="space-y-1">
              <div className="w-full bg-rose-500/20 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, scheduleResult.firstInstallmentEfficiency))}%` }}
                  title={`Amortização: ${scheduleResult.firstInstallmentEfficiency.toFixed(1)}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="text-emerald-600 dark:text-[#5eead4] font-semibold">
                  ● Abate a dívida: {scheduleResult.firstInstallmentEfficiency.toFixed(1)}%
                </span>
                <span className="text-rose-500 font-semibold">
                  ● Juros, seguro e taxas: {(100 - scheduleResult.firstInstallmentEfficiency).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Média projetada no contrato: <strong className="text-slate-700 dark:text-slate-300 font-mono">{scheduleResult.averageEfficiency.toFixed(1)}%</strong> de amortização.
            </p>
          </div>

          {/* Diagnóstico de Variação da Dívida pela TR */}
          <div className={`p-4 rounded-[20px] border space-y-2 ${
            scheduleResult.firstMonthBalanceVariation > 0
              ? 'bg-amber-500/[0.04] dark:bg-amber-950/20 border-amber-500/30'
              : 'bg-emerald-500/[0.04] dark:bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingDown className={`w-4 h-4 ${
                  scheduleResult.firstMonthBalanceVariation > 0 ? 'text-amber-500' : 'text-emerald-500'
                }`} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Variação Real do Saldo (TR vs Amortização)
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                scheduleResult.firstMonthBalanceVariation > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-[#5eead4]'
              }`}>
                {scheduleResult.firstMonthBalanceVariation > 0 ? '+' : ''}
                {formatCurrency(scheduleResult.firstMonthBalanceVariation, currency)} / mês
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {scheduleResult.firstMonthBalanceVariation > 0 ? (
                <>
                  <strong className="text-amber-600 dark:text-amber-400 font-bold">Aviso Caixa:</strong> Neste início, a correção pela TR supera a amortização em <strong className="font-mono text-slate-900 dark:text-white">{scheduleResult.monthsWithBalanceIncrease} meses</strong>, fazendo a dívida nominal crescer ligeiramente mesmo em dia.
                </>
              ) : (
                <>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Redução Efetiva:</strong> A amortização supera os encargos de correção, garantindo que sua dívida diminui a cada prestação paga.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1A1A20] border border-slate-200/80 dark:border-white/[0.08]">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-[#282830] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Todas ({allRows.length})
              </button>

              {historicalRows.length > 0 && (
                <button
                  onClick={() => {
                    setStatusFilter('historical');
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'historical'
                      ? 'bg-white dark:bg-[#282830] text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Pagas antes do Finly ({historicalRows.length})
                </button>
              )}

              <button
                onClick={() => {
                  setStatusFilter('future');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'future'
                    ? 'bg-white dark:bg-[#282830] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Futuras ({futureRows.length})
              </button>
            </div>

            {/* Metadata Badges */}
            <div className="flex items-center gap-2">
              <span className="pill-tag-mint">
                {debt.indexer === 'FIXED'
                  ? 'Prefixado (Sem correção)'
                  : debt.indexer === 'IPCA'
                  ? `IPCA Ref: ${debt.indexerRate ?? 0}% a.m.`
                  : `TR Ref: ${debt.indexerRate ?? 0}% a.m.`}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Exibindo {paginatedRows.length} de {filteredSchedule.length}
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por número da parcela, data de vencimento ou valor..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#141418]">
          <div className="overflow-x-auto max-h-[460px] scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-[#1C1C22] text-[11px] font-mono text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-white/[0.08]">
                <tr>
                  <th className="py-3 px-3.5 text-center">Nº</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Vencimento</th>
                  <th className="py-3 px-3.5 text-right">Saldo Corrigido</th>
                  <th className="py-3 px-3.5 text-right">Amortização</th>
                  <th className="py-3 px-3.5 text-right">Juros</th>
                  <th className="py-3 px-3.5 text-right">Seguro</th>
                  <th className="py-3 px-3.5 text-right">TR / Índice</th>
                  <th className="py-3 px-3.5 text-right">Eficiência</th>
                  <th className="py-3 px-3.5 text-right">Impacto Dívida</th>
                  <th className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white">Parcela Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] font-mono">
                {paginatedRows.map(row => (
                  <tr
                    key={row.installmentNumber}
                    className={`transition-colors ${
                      row.status === 'historical_paid'
                        ? 'bg-slate-50/40 dark:bg-[#16161B]/50 hover:bg-slate-50/80 dark:hover:bg-[#1C1C22]'
                        : 'hover:bg-slate-50/80 dark:hover:bg-[#1A1A22]'
                    }`}
                  >
                    <td className="py-2.5 px-3.5 text-center font-bold text-slate-500 dark:text-slate-400">
                      {row.installmentNumber}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {row.status === 'historical_paid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Antes do Finly
                        </span>
                      ) : row.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#5eead4] border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Paga
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          Prevista
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(row.dueDate)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(row.correctedBalance, currency)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-emerald-600 dark:text-[#5eead4] font-semibold">
                      {formatCurrency(row.amortizationAmount, currency)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-rose-500 font-semibold">
                      {formatCurrency(row.interestAmount, currency)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-purple-400 font-medium">
                      {formatCurrency(row.insuranceAmount, currency)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-400 font-medium">
                      {row.trCorrection > 0 ? `+${formatCurrency(row.trCorrection, currency)}` : 'R$ 0,00'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-semibold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        row.installmentEfficiency >= 50
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#5eead4]'
                          : row.installmentEfficiency >= 25
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {row.installmentEfficiency.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold whitespace-nowrap text-[11px]">
                      {row.isBalanceIncreasing ? (
                        <span className="text-amber-500 dark:text-amber-400 inline-flex items-center gap-1" title="A correção pela TR superou a amortização, aumentando a dívida">
                          +{formatCurrency(row.netBalanceVariation, currency)} <span className="text-[10px]">⚠️</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-[#5eead4]">
                          -{formatCurrency(Math.abs(row.netBalanceVariation), currency)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black text-slate-900 dark:text-white text-[12.5px] whitespace-nowrap">
                      {formatCurrency(row.totalInstallment, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.08]">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1E1E24] text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 cursor-pointer transition-all"
            >
              ← Anterior
            </button>
            <span className="text-xs font-mono text-slate-400">
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1E1E24] text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 cursor-pointer transition-all"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
