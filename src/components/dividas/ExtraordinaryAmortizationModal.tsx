import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingDown,
  Clock,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Debt } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { simulateExtraordinaryAmortization } from '../../utils/financingCalculations';

interface ExtraordinaryAmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt;
  currency?: string;
}

export const ExtraordinaryAmortizationModal: React.FC<ExtraordinaryAmortizationModalProps> = ({
  isOpen,
  onClose,
  debt,
  currency = 'BRL',
}) => {
  const [lumpSumStr, setLumpSumStr] = useState('5000');
  const [monthlyExtraStr, setMonthlyExtraStr] = useState('0');
  const [timing, setTiming] = useState<'today' | 'due_date'>('today');

  const lumpSum = parseFloat(lumpSumStr) || 0;
  const monthlyExtra = parseFloat(monthlyExtraStr) || 0;

  const simulation = useMemo(() => {
    const isFixed = debt.indexer === 'FIXED';
    const rate = isFixed ? 0 : (debt.indexerRate ?? 0);
    return simulateExtraordinaryAmortization({
      currentBalance: debt.remainingAmount || debt.totalAmount,
      nominalAnnualRate: debt.interestRate || 4.25,
      remainingMonths: debt.totalInstallments - (debt.paidInstallments || 0),
      system: debt.amortizationSystem || 'PRICE',
      indexer: debt.indexer || (debt.contractType === 'loan' ? 'FIXED' : 'TR'),
      monthlyIndexerRate: rate,
      monthlyTR: debt.indexer === 'TR' ? rate : 0,
      monthlyInsurance: debt.insuranceMonthly || 0,
      adminFee: debt.adminFeeMonthly || 0,
      extraLumpSum: lumpSum,
      extraMonthlyPayment: monthlyExtra,
      contractInstallmentAmount: debt.installmentAmount,
      amortizationTiming: timing,
      dueDay: debt.dueDay,
    });
  }, [debt, lumpSum, monthlyExtra, timing]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulador de Amortização Extraordinária"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Description Pill */}
        <div className="p-4 rounded-[22px] bg-purple-500/[0.06] dark:bg-purple-950/20 border border-purple-500/20 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">
              Acelere a quitação do seu financiamento ({debt.title})
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              No crédito imobiliário bancário (Caixa SFH/Price), cada real de amortização efetiva abate diretamente do saldo devedor,
              eliminando os juros compostos que incidiriam sobre ele ao longo do contrato.
            </p>
          </div>
        </div>

        {/* Inputs Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Aporte Único */}
          <div className="p-4 rounded-[22px] bg-slate-50 dark:bg-[#18181C] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Valor a Amortizar (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                min="0"
                step="500"
                value={lumpSumStr}
                onChange={e => setLumpSumStr(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#101014] border border-slate-200 dark:border-white/[0.12] text-sm font-black text-slate-900 dark:text-white mono-metric focus:outline-none focus:border-purple-500"
                placeholder="Ex: 5000"
              />
            </div>
            {/* Quick Chips */}
            <div className="flex gap-1.5 pt-1">
              {[1000, 2000, 5000, 10000, 20000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLumpSumStr(String(val))}
                  className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-[#222228] text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-purple-500/20 hover:text-purple-400 transition-colors cursor-pointer"
                >
                  +{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Aporte Mensal Extra Recorrente */}
          <div className="p-4 rounded-[22px] bg-slate-50 dark:bg-[#18181C] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Aporte Mensal Extra Recorrente (R$/mês)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={monthlyExtraStr}
                onChange={e => setMonthlyExtraStr(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#101014] border border-slate-200 dark:border-white/[0.12] text-sm font-black text-slate-900 dark:text-white mono-metric focus:outline-none focus:border-purple-500"
                placeholder="Ex: 300"
              />
            </div>
            {/* Quick Chips */}
            <div className="flex gap-1.5 pt-1">
              {[100, 250, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMonthlyExtraStr(String(val))}
                  className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-[#222228] text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-purple-500/20 hover:text-purple-400 transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MODO DA AMORTIZAÇÃO (NOVO RECURSO: PRO-RATA BANCÁRIO / CAIXA) */}
        <div className="p-4 rounded-[22px] bg-slate-50 dark:bg-[#18181C] border border-slate-200/80 dark:border-white/[0.08] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Momento do Pagamento da Amortização
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                O aplicativo do banco ajusta o abatimento com base no dia em que o boleto é pago
              </span>
            </div>

            {/* Alternador de Modo de Timing */}
            <div className="p-1 rounded-full bg-white dark:bg-[#222228] border border-slate-200 dark:border-white/[0.1] flex items-center text-xs font-bold shadow-xs">
              <button
                type="button"
                onClick={() => setTiming('today')}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  timing === 'today'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>⚡ Amortizar Hoje</span>
                <span className="text-[10px] opacity-80">(com Pro-rata Caixa)</span>
              </button>

              <button
                type="button"
                onClick={() => setTiming('due_date')}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  timing === 'due_date'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🎯 No Vencimento</span>
                <span className="text-[10px] opacity-80">(100% Efetivo)</span>
              </button>
            </div>
          </div>

          {/* DETALHES DA AMORTIZAÇÃO EFETIVA (ESPELHO DO APP DA CAIXA) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-[#121216] border border-slate-200/70 dark:border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Amortização Efetiva
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mono-metric">
                {formatCurrency(simulation.effectiveAmortization, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                abate direto do saldo
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#121216] border border-slate-200/70 dark:border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Juros Diários / Corridos
              </span>
              <span className="text-sm sm:text-base font-black text-rose-500 mono-metric">
                {formatCurrency(simulation.accruedDailyInterest, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {simulation.dailyInterestRateAmount > 0
                  ? `~${formatCurrency(simulation.dailyInterestRateAmount, currency)}/dia`
                  : 'R$ 0,00 no vencimento'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#121216] border border-slate-200/70 dark:border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Novo Saldo Devedor
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mono-metric">
                {formatCurrency(simulation.newBalance, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                saldo contratual pós-pagamento
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#121216] border border-slate-200/70 dark:border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Novo Prazo Restante
              </span>
              <span className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-400 mono-metric">
                {simulation.reduceTerm.newRemainingMonths} MESES
              </span>
              <span className="text-[10px] text-emerald-500 font-bold block">
                -{simulation.reduceTerm.monthsSaved} meses eliminados
              </span>
            </div>
          </div>

          {/* Dica de Ouro Bancária */}
          {timing === 'today' && simulation.accruedDailyInterest > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                <strong>Dica Finly:</strong> Se você pagar a amortização no <strong>dia do vencimento da sua parcela</strong>,
                o banco zera os juros diários e todos os <strong>{formatCurrency(lumpSum, currency)}</strong> viram amortização pura do saldo devedor!
              </span>
            </div>
          )}
        </div>

        {/* COMPARATIVO LADO A LADO: REDUZIR PRAZO VS REDUZIR PARCELA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* 1. OPÇÃO A: REDUZIR PRAZO (RECOMENDADO) */}
          <div className="p-5 rounded-[26px] bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.02] border-2 border-emerald-500/30 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="pill-tag-mint">RECOMENDADO</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Opção 1 (Caixa)
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Redução de Prazo
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mantém o valor da prestação e corta as parcelas do final do contrato.
              </p>
            </div>

            {/* Grande Métrica de Economia de Juros */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#121216]/90 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Economia em Juros Futuros
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-[#5eead4] mono-metric block">
                {formatCurrency(simulation.reduceTerm.interestSaved, currency)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                dinheiro que deixará de ir para o banco
              </span>
            </div>

            {/* Métricas de Tempo Ganho */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-emerald-500/10">
                <span className="text-slate-400">Parcelas Eliminadas:</span>
                <span className="font-bold text-emerald-500">
                  -{simulation.reduceTerm.monthsSaved} meses (~{simulation.reduceTerm.yearsSaved} anos)
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-emerald-500/10">
                <span className="text-slate-400">Novo Prazo Restante:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {simulation.reduceTerm.newRemainingMonths} meses
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-emerald-500/10">
                <span className="text-slate-400">Novo Valor Prestação:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(
                    simulation.reduceTerm.newInstallmentWithRecalculatedInsurance || simulation.reduceTerm.installmentAmount,
                    currency
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Quitação Estimada:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatDate(simulation.reduceTerm.newEstimatedEndDate)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. OPÇÃO B: REDUZIR PARCELA */}
          <div className="p-5 rounded-[26px] bg-slate-50 dark:bg-[#18181C] border border-slate-200/80 dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <span className="pill-tag-purple">ALÍVIO MENSAL</span>
              <span className="text-[11px] font-mono text-slate-400 font-bold">
                Opção 2 (Caixa)
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Redução de Parcela
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mantém o prazo original e alivia o valor da sua prestação mensal.
              </p>
            </div>

            {/* Métrica da Nova Parcela */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/[0.08] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Nova Prestação Mensal
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-300 mono-metric">
                  {formatCurrency(simulation.reduceInstallment.newInstallment, currency)}
                </span>
                <span className="text-xs text-emerald-500 font-mono font-bold">
                  (-{formatCurrency(simulation.reduceInstallment.monthlyReduction, currency)}/mês)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                de {formatCurrency(simulation.reduceInstallment.originalInstallment, currency)}
              </span>
            </div>

            {/* Detalhes de Juros da Redução de Parcela */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-white/[0.05]">
                <span className="text-slate-400">Economia em Juros:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(simulation.reduceInstallment.interestSaved, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-white/[0.05]">
                <span className="text-slate-400">Prazo Mantido:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {simulation.reduceInstallment.remainingMonths} meses
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Alívio no Orçamento:</span>
                <span className="font-bold text-purple-400">
                  +{formatCurrency(simulation.reduceInstallment.monthlyReduction * 12, currency)} / ano
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
