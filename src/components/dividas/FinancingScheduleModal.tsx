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

export const FinancingScheduleModal: React.FC<FinancingScheduleModalProps> = ({
  isOpen,
  onClose,
  debt,
  currency = 'BRL',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 24; // Mostra 24 meses por página

  // Cálculo do cronograma completo
  const scheduleResult = useMemo(() => {
    const isFixed = debt.indexer === 'FIXED';
    const rate = isFixed ? 0 : (debt.indexerRate ?? 0);
    return generateAmortizationSchedule({
      principal: debt.remainingAmount || debt.totalAmount,
      nominalAnnualRate: debt.interestRate || 4.25,
      remainingMonths: debt.totalInstallments - (debt.paidInstallments || 0),
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

  const filteredSchedule = useMemo(() => {
    if (!searchTerm.trim()) return scheduleResult.schedule;
    const term = searchTerm.toLowerCase();
    return scheduleResult.schedule.filter(
      row =>
        String(row.installmentNumber).includes(term) ||
        row.dueDate.toLowerCase().includes(term) ||
        row.totalInstallment.toFixed(2).includes(term)
    );
  }, [scheduleResult, searchTerm]);

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
              {debt.totalInstallments - (debt.paidInstallments || 0)} meses restantes
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

        {/* Search & Metadata Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por parcela ou data..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1C1C20] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="pill-tag-mint">
              {debt.indexer === 'FIXED'
                ? 'Prefixado (Sem correção)'
                : debt.indexer === 'IPCA'
                ? `IPCA Ref: ${debt.indexerRate ?? 0}% a.m. (Estimada)`
                : `TR Ref: ${debt.indexerRate ?? 0}% a.m. (Estimada)`}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Exibindo {paginatedRows.length} de {filteredSchedule.length} parcelas
            </span>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#141418]">
          <div className="overflow-x-auto max-h-[460px] scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-[#1C1C22] text-[11px] font-mono text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-white/[0.08]">
                <tr>
                  <th className="py-3 px-3.5 text-center">Nº</th>
                  <th className="py-3 px-3.5">Vencimento</th>
                  <th className="py-3 px-3.5 text-right">Saldo Devedor</th>
                  <th className="py-3 px-3.5 text-right">Amortização</th>
                  <th className="py-3 px-3.5 text-right">Juros</th>
                  <th className="py-3 px-3.5 text-right">Seguro</th>
                  <th className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white">Parcela Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] font-mono">
                {paginatedRows.map(row => (
                  <tr
                    key={row.installmentNumber}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#1A1A22] transition-colors"
                  >
                    <td className="py-2.5 px-3.5 text-center font-bold text-slate-500 dark:text-slate-400">
                      {row.installmentNumber}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-300">
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
                    <td className="py-2.5 px-3.5 text-right font-black text-slate-900 dark:text-white text-[12.5px]">
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
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1E1E24] text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 cursor-pointer"
            >
              ← Anterior
            </button>
            <span className="text-xs font-mono text-slate-400">
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1E1E24] text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 cursor-pointer"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
