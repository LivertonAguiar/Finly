import React, { useState } from 'react';
import {
  Home,
  List,
  Plus,
  Flag,
  MoreHorizontal,
  X,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { useTranslation } from '../../utils/i18n';
import { useFinancial } from '../../context/FinancialContext';
import { useBackButton } from '../../hooks/useBackButton';

const isLightColor = (hex: string): boolean => {
  if (!hex || hex === '#FFFFFF' || hex === '#ffffff' || hex === 'white') return true;
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 175;
  }
  return false;
};

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
  onOpenAction?: (actionType: 'income' | 'expense' | 'transfer' | 'card_expense') => void;
  isHidden?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenAction,
  isHidden = false,
}) => {
  const { user } = useFinancial();
  const { t } = useTranslation();
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [accentColor, setAccentColor] = useState<string>(() => user.accentColor || localStorage.getItem('finly_accent_color') || '#7C4DFF');

  // Close speed dial on Android back gesture
  useBackButton(isSpeedDialOpen, () => setIsSpeedDialOpen(false));

  // Sync with theme changes
  React.useEffect(() => {
    if (user.accentColor) {
      setAccentColor(user.accentColor);
    }
    const handleThemeChange = (e: any) => {
      if (e?.detail?.accentColor) {
        setAccentColor(e.detail.accentColor);
      } else {
        const saved = localStorage.getItem('finly_accent_color');
        if (saved) setAccentColor(saved);
      }
    };
    window.addEventListener('finly_theme_changed', handleThemeChange);
    return () => window.removeEventListener('finly_theme_changed', handleThemeChange);
  }, [user.accentColor]);

  const handleAction = (actionType: 'income' | 'expense' | 'transfer' | 'card_expense') => {
    setIsSpeedDialOpen(false);
    if (onOpenAction) {
      onOpenAction(actionType);
    } else {
      onOpenNewTransaction();
    }
  };

  return (
    <>
      {/* Backdrop & Speed Dial Menu Overlay */}
      {isSpeedDialOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex flex-col justify-end items-center animate-in fade-in duration-200"
          style={{
            paddingBottom: 'max(calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 124px), 132px)',
          }}
          onClick={() => setIsSpeedDialOpen(false)}
        >
          {/* Grade de cartões das ações principais */}
          <div
            data-testid="quick-action-grid"
            className="w-full max-w-[360px] grid grid-cols-2 gap-3 px-4 select-none"
            onClick={e => e.stopPropagation()}
          >
            {/* 1. Receita (Top-Left) */}
            <button
              type="button"
              data-quick-action="income"
              onClick={() => handleAction('income')}
              className="min-h-[96px] rounded-3xl px-3.5 py-3 bg-gradient-to-br from-emerald-500/25 to-[#26262B]/95 hover:from-emerald-500/35 border border-emerald-400/35 shadow-xl flex flex-col items-center justify-center gap-2 text-emerald-300 active:scale-[0.97] transition-all cursor-pointer"
            >
              <span className="w-12 h-12 rounded-2xl bg-emerald-400/15 border border-emerald-300/30 flex items-center justify-center shadow-inner">
                <TrendingUp className="w-8 h-8 stroke-[2.4]" />
              </span>
              <span className="text-sm leading-tight font-black text-white text-center drop-shadow-sm">
                {t('action.new_income', 'Receita')}
              </span>
            </button>

            {/* 2. Despesa (Top-Right) */}
            <button
              type="button"
              data-quick-action="expense"
              onClick={() => handleAction('expense')}
              className="min-h-[96px] rounded-3xl px-3.5 py-3 bg-gradient-to-br from-rose-500/25 to-[#26262B]/95 hover:from-rose-500/35 border border-rose-400/35 shadow-xl flex flex-col items-center justify-center gap-2 text-rose-300 active:scale-[0.97] transition-all cursor-pointer"
            >
              <span className="w-12 h-12 rounded-2xl bg-rose-400/15 border border-rose-300/30 flex items-center justify-center shadow-inner">
                <TrendingDown className="w-8 h-8 stroke-[2.4]" />
              </span>
              <span className="text-sm leading-tight font-black text-white text-center drop-shadow-sm">
                {t('action.new_expense', 'Despesa')}
              </span>
            </button>

            {/* 3. Despesa Cartão (Bottom-Left) */}
            <button
              type="button"
              data-quick-action="card_expense"
              onClick={() => handleAction('card_expense')}
              className="min-h-[96px] rounded-3xl px-3.5 py-3 bg-gradient-to-br from-amber-500/25 to-[#26262B]/95 hover:from-amber-500/35 border border-amber-400/35 shadow-xl flex flex-col items-center justify-center gap-2 text-amber-300 active:scale-[0.97] transition-all cursor-pointer"
            >
              <span className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-300/30 flex items-center justify-center shadow-inner">
                <CreditCard className="w-8 h-8 stroke-[2.4]" />
              </span>
              <span className="text-sm leading-tight font-black text-white text-center drop-shadow-sm">
                {t('action.card_expense', 'Despesa Cartão')}
              </span>
            </button>

            {/* 4. Transferência (Bottom-Right) */}
            <button
              type="button"
              data-quick-action="transfer"
              onClick={() => handleAction('transfer')}
              className="min-h-[96px] rounded-3xl px-3.5 py-3 bg-gradient-to-br from-indigo-500/25 to-[#26262B]/95 hover:from-indigo-500/35 border border-indigo-400/35 shadow-xl flex flex-col items-center justify-center gap-2 text-indigo-300 active:scale-[0.97] transition-all cursor-pointer"
            >
              <span className="w-12 h-12 rounded-2xl bg-indigo-400/15 border border-indigo-300/30 flex items-center justify-center shadow-inner">
                <ArrowLeftRight className="w-8 h-8 stroke-[2.4]" />
              </span>
              <span className="text-sm leading-tight font-black text-white text-center drop-shadow-sm">
                {t('action.transfer', 'Transferência')}
              </span>
            </button>
          </div>

          {/* Ação Rápida: Pagar fatura */}
          <div className="mt-3 w-full max-w-[360px] px-4 select-none">
            <button
              type="button"
              data-invoice-action="pay_invoice"
              onClick={() => {
                setIsSpeedDialOpen(false);
                window.dispatchEvent(new CustomEvent('finly_open_pay_invoice', { detail: {} }));
              }}
              className="w-full min-h-[52px] rounded-2xl px-4 py-2.5 bg-gradient-to-r from-emerald-600/30 via-teal-600/20 to-emerald-600/30 hover:from-emerald-600/40 border border-emerald-400/40 shadow-xl flex items-center justify-between text-emerald-300 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-emerald-400/15 border border-emerald-300/30 flex items-center justify-center text-emerald-300 shadow-inner">
                  <Receipt className="w-5 h-5 stroke-[2.2]" />
                </span>
                <div className="text-left">
                  <span className="text-sm font-black text-white block leading-tight">
                    Pagar fatura
                  </span>
                  <span className="text-[10px] text-emerald-300/80 font-medium">
                    Liquidação rápida em 2 toques
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                2 toques
              </span>
            </button>
          </div>

          {/* Atalhos de módulos abaixo da grade */}
          <div className="mt-4 w-full max-w-[360px] grid grid-cols-2 gap-2 px-4 animate-in fade-in duration-300">
            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('metas');
              }}
              className="min-h-11 px-3 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 dark:bg-white/10 dark:hover:bg-white/20 border border-white/20 text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>🎯</span> {t('nav.goals', 'Metas')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('dividas');
              }}
              className="min-h-11 px-3 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 dark:bg-white/10 dark:hover:bg-white/20 border border-white/20 text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>📉</span> {t('nav.debts', 'Dívidas')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('investimentos');
              }}
              className="min-h-11 px-3 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 dark:bg-white/10 dark:hover:bg-white/20 border border-white/20 text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>📈</span> {t('nav.investments', 'Investimentos')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('cartoes');
              }}
              className="min-h-11 px-3 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 dark:bg-white/10 dark:hover:bg-white/20 border border-white/20 text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>💳</span> {t('nav.cards', 'Cartões')}
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar - Tab Bar Bancária Sóbria Borda a Borda */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden select-none finly-bottom-nav bg-white border-t border-slate-200 dark:border-white/[0.08] transition-transform duration-200 ${
          isHidden ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{
          paddingBottom: 'max(var(--sab, env(safe-area-inset-bottom, 0px)), 4px)',
        }}
        aria-label="Navegação Mobile"
      >
        <div
          data-testid="mobile-bottom-navbar"
          className="w-full grid grid-cols-5 h-[58px] items-stretch"
        >
          {/* 1. Início */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('dashboard');
            }}
            style={activeTab === 'dashboard' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Início"
            aria-label="Início"
          >
            {activeTab === 'dashboard' && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
            <Home className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] leading-none tracking-tight">Início</span>
          </button>

          {/* 2. Transações */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('transacoes');
            }}
            style={activeTab === 'transacoes' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'transacoes'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Transações"
            aria-label="Transações"
          >
            {activeTab === 'transacoes' && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
            <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] leading-none tracking-tight">Transações</span>
          </button>

          {/* 3. Botão Central FAB (+) */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              data-testid="bottom-nav-fab-center"
              onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
              style={{
                backgroundColor: accentColor,
                color: isLightColor(accentColor) ? '#121215' : 'var(--primary-accent-foreground, #FFFFFF)',
              }}
              className="w-11 h-11 rounded-full shadow-lg active:scale-90 transition-all flex items-center justify-center cursor-pointer -mt-4 border-2 border-white dark:border-[#1E1E22]"
              title="Ações Rápidas"
              aria-label="Ações Rápidas"
            >
              {isSpeedDialOpen ? (
                <X className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Plus className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* 4. Contas & Cartões */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('contas-cartoes');
            }}
            style={activeTab === 'contas-cartoes' || activeTab === 'contas' || activeTab === 'cartoes' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'contas-cartoes' || activeTab === 'contas' || activeTab === 'cartoes'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Contas & Cartões"
            aria-label="Contas & Cartões"
          >
            {(activeTab === 'contas-cartoes' || activeTab === 'contas' || activeTab === 'cartoes') && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
            <CreditCard className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] leading-none tracking-tight">Contas & Cartões</span>
          </button>

          {/* 5. Planejar */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('planejar');
            }}
            style={activeTab === 'planejar' || activeTab === 'planejamento' || activeTab === 'orcamento' || activeTab === 'metas' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'planejar' || activeTab === 'planejamento' || activeTab === 'orcamento' || activeTab === 'metas'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Planejar"
            aria-label="Planejar"
          >
            {(activeTab === 'planejar' || activeTab === 'planejamento' || activeTab === 'orcamento' || activeTab === 'metas') && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
            <TrendingUp className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] leading-none tracking-tight">{t('nav.plan', 'Planejar')}</span>
          </button>        </div>
      </nav>
    </>
  );
};

