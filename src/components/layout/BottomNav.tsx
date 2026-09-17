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
} from 'lucide-react';
import { useTranslation } from '../../utils/i18n';
import { useFinancial } from '../../context/FinancialContext';
import { useBackButton } from '../../hooks/useBackButton';

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
            paddingBottom: 'max(calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 76px), 84px)',
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

          {/* Atalhos de módulos abaixo da grade */}
          <div className="mt-4 w-full max-w-[360px] grid grid-cols-2 gap-2 px-4 animate-in fade-in duration-300">
            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('metas');
              }}
              className="min-h-11 px-3 py-2 rounded-2xl bg-[#2C2C30] hover:bg-purple-900/50 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>🎯</span> {t('nav.goals', 'Metas')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('dividas');
              }}
              className="min-h-11 px-3 py-2 rounded-2xl bg-[#2C2C30] hover:bg-rose-900/50 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>📉</span> {t('nav.debts', 'Dívidas')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('investimentos');
              }}
              className="min-h-11 px-3 py-2 rounded-2xl bg-[#2C2C30] hover:bg-emerald-900/50 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>📈</span> {t('nav.investments', 'Investimentos')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('cartoes');
              }}
              className="min-h-11 px-3 py-2 rounded-2xl bg-[#2C2C30] hover:bg-teal-900/50 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>💳</span> {t('nav.cards', 'Cartões')}
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) Discreto no canto inferior direito para Ações Rápidas */}
      <button
        type="button"
        data-testid="bottom-nav-fab-action"
        onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
        style={{
          backgroundColor: accentColor,
          color: '#FFFFFF',
          bottom: 'calc(68px + max(var(--sab, env(safe-area-inset-bottom, 0px)), 4px))',
        }}
        className={`fixed right-4 z-50 md:hidden w-12 h-12 rounded-full shadow-md active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer ${
          isHidden ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100'
        }`}
        title="Nova Transação / Ação Rápida"
        aria-label="Nova Transação / Ação Rápida"
      >
        {isSpeedDialOpen ? (
          <X className="w-6 h-6 stroke-[2.5]" />
        ) : (
          <Plus className="w-6 h-6 stroke-[2.5]" />
        )}
      </button>

      {/* Main Bottom Navigation Bar - Tab Bar Bancária Sóbria Borda a Borda */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden select-none bg-white dark:bg-[#121316] border-t border-slate-200 dark:border-[#222328] transition-transform duration-200 ${
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
            title={t('nav.dashboard', 'Início')}
            aria-label={t('nav.dashboard', 'Início')}
          >
            {activeTab === 'dashboard' && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
            <Home className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] leading-none tracking-tight">
              {t('nav.dashboard', 'Início')}
            </span>
          </button>

          {/* 2. Extrato */}
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
            title={t('nav.transactions', 'Extrato')}
            aria-label={t('nav.transactions', 'Extrato')}
          >
            {activeTab === 'transacoes' && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
            <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] leading-none tracking-tight">
              {t('nav.transactions', 'Extrato')}
            </span>
          </button>

          {/* 3. Cartões */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('cartoes');
            }}
            style={activeTab === 'cartoes' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'cartoes'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={t('nav.cards_short', 'Cartões')}
            aria-label={t('nav.cards_short', 'Cartões')}
          >
            {activeTab === 'cartoes' && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
            <CreditCard className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] leading-none tracking-tight">
              {t('nav.cards_short', 'Cartões')}
            </span>
          </button>

          {/* 4. Planejamento / Metas */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('metas');
            }}
            style={activeTab === 'metas' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'metas'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={t('nav.goals', 'Planejar')}
            aria-label={t('nav.goals', 'Planejar')}
          >
            {activeTab === 'metas' && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
            <TrendingUp className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] leading-none tracking-tight">
              {t('nav.planning', 'Planejar')}
            </span>
          </button>

          {/* 5. Mais / Menu */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('mais');
            }}
            style={activeTab === 'mais' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'mais'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={t('nav.more', 'Mais')}
            aria-label={t('nav.more', 'Mais')}
          >
            {activeTab === 'mais' && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
            <MoreHorizontal className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] leading-none tracking-tight">
              {t('nav.more', 'Mais')}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

