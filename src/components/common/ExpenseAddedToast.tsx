import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X, ArrowRight, Layers, Repeat, Sparkles } from 'lucide-react';
import {
  ExpenseAddedToastData,
  formatExpenseConfirmationSummary,
} from '../../utils/expenseToastEmitter';

interface ActiveToastItem {
  id: string;
  data: ExpenseAddedToastData;
}

export const ExpenseAddedToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<ActiveToastItem | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveToast(null);
      setIsClosing(false);
    }, 200);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleExpenseAdded = (e: Event) => {
      const customEvent = e as CustomEvent<ExpenseAddedToastData>;
      const detail = customEvent.detail;
      if (!detail) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      setIsClosing(false);
      setActiveToast({
        id: detail.id || String(Date.now()),
        data: detail,
      });

      // Auto dismiss após 4.5 segundos
      timerRef.current = setTimeout(() => {
        dismiss();
      }, 4500);
    };

    window.addEventListener('finly_expense_added', handleExpenseAdded);
    return () => {
      window.removeEventListener('finly_expense_added', handleExpenseAdded);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss]);

  if (!activeToast) return null;

  const { data } = activeToast;
  const summary = formatExpenseConfirmationSummary(data);
  const isInstallment = Boolean(data.installmentCount && data.installmentCount > 1);
  const isRecurring = Boolean(data.isRecurring);

  const handleNavigateToTransactions = () => {
    window.dispatchEvent(
      new CustomEvent('finly_navigate_tab', {
        detail: { tab: 'transacoes' },
      })
    );
    dismiss();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      // Arrastar para cima fecha o toast
      if (deltaY < -30) {
        dismiss();
      }
      touchStartY.current = null;
    }
  };

  return (
    <aside
      aria-label="Notificação de despesa"
      className="fixed left-1/2 -translate-x-1/2 z-[140] w-[calc(100%-1.5rem)] max-w-md pointer-events-auto select-none transition-all"
      style={{ top: 'calc(14px + var(--safe-area-inset-top, 0px))' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-slate-900/95 dark:bg-[#1E222D]/95 text-white shadow-2xl border border-emerald-500/40 backdrop-blur-2xl p-3.5 transition-all duration-200 ${
          isClosing
            ? 'opacity-0 -translate-y-4 scale-95'
            : 'animate-in fade-in slide-in-from-top-4 duration-300'
        }`}
      >
        {/* Glow de fundo */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          {/* Ícone à esquerda: Emoji da categoria com badge de check */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl shadow-inner select-none">
              {data.categoryIcon || '💸'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs">
              <Check className="w-2.5 h-2.5 stroke-[3.5]" />
            </div>
          </div>

          {/* Conteúdo Central */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9.5px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {summary.badgeTitle}
              </span>

              {isInstallment && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9.5px] font-bold">
                  <Layers className="w-2.5 h-2.5" />
                  Cartão
                </span>
              )}

              {isRecurring && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[9.5px] font-bold">
                  <Repeat className="w-2.5 h-2.5" />
                  Fixa
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-bold text-white truncate mt-1 leading-snug">
              {data.description}
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate mt-0.5">
              <span className="font-black text-emerald-400">
                {summary.formattedAmount}
              </span>
              {summary.detailsLine && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 truncate">{summary.detailsLine}</span>
                </>
              )}
            </div>
          </div>

          {/* Ações à direita */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleNavigateToTransactions}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              title="Ver no extrato de transações"
            >
              <span>Ver</span>
              <ArrowRight className="w-3 h-3 stroke-[3]" />
            </button>

            <button
              type="button"
              onClick={dismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linha de progresso visual de fechamento automático */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden rounded-b-2xl">
          <div
            className="h-full bg-emerald-400/80 transition-all duration-[4500ms] ease-linear w-full animate-[shrink_4.5s_linear_forwards]"
            style={{
              animation: 'finly-progress-shrink 4.5s linear forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes finly-progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </aside>
  );
};
