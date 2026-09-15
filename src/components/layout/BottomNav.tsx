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
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenAction,
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

      {/* Máscara de gradiente suave no rodapé para ocultar cards scrolláveis por trás da pílula */}
      <div
        className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-40 md:hidden bg-gradient-to-t from-[#F1F5F9] via-[#F1F5F9]/85 to-transparent dark:from-[var(--app-bg,#121214)] dark:via-[var(--app-bg,#121214)]/85 transition-all duration-200"
        aria-hidden="true"
      />

      {/* Main Bottom Navigation Bar - Pílula ampliada para toque confortável */}
      <nav
        className="bottom-nav-container fixed left-0 right-0 z-50 flex justify-center items-center px-4 pointer-events-none md:hidden select-none bg-transparent transition-all duration-300"
        style={{
          bottom: 'max(calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px), 12px)',
        }}
        aria-label="Navegação Mobile"
      >
        <div data-testid="mobile-bottom-navbar" className="pointer-events-auto flex items-center justify-between px-2 h-[52px] w-full max-w-[336px] rounded-full bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-2xl border border-slate-300/90 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
          {/* 1. Principal / Dashboard */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('dashboard');
            }}
            style={activeTab === 'dashboard' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={t('nav.dashboard', 'Principal')}
            aria-label={t('nav.dashboard', 'Principal')}
          >
            <Home className="w-[22px] h-[22px] stroke-[2.2]" />
            {activeTab === 'dashboard' && (
              <span
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full transition-all animate-in zoom-in duration-200"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 6px ${accentColor}`,
                }}
              />
            )}
          </button>

          {/* 2. Transações / Extrato */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('transacoes');
            }}
            style={activeTab === 'transacoes' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90 cursor-pointer ${
              activeTab === 'transacoes'
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={t('nav.transactions', 'Transações')}
            aria-label={t('nav.transactions', 'Transações')}
          >
            <ArrowLeftRight className="w-[22px] h-[22px] stroke-[2.2]" />
            {activeTab === 'transacoes' && (
              <span
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full transition-all animate-in zoom-in duration-200"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 6px ${accentColor}`,
                }}
              />
            )}
          </button>

          {/* 3. Botão Central '+' (Ações Rápidas) */}
          <button
            type="button"
            onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
            style={{
              backgroundColor: accentColor,
              color: 'var(--primary-accent-foreground, #FFFFFF)',
              boxShadow: `0 4px 14px ${accentColor}80`,
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-lg active:scale-85 transition-transform duration-200 cursor-pointer hover:brightness-110 ${
              isSpeedDialOpen ? 'rotate-90 brightness-95' : ''
            }`}
            title="Ações Rápidas"
            aria-label="Ações Rápidas"
          >
            {isSpeedDialOpen ? (
              <X className="w-6 h-6 stroke-[3]" style={{ stroke: 'currentColor' }} />
            ) : (
              <Plus className="w-6 h-6 stroke-[3]" style={{ stroke: 'currentColor' }} />
            )}
          </button>

          {/* 4. Cartões */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('cartoes');
            }}
            style={activeTab === 'cartoes' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90 cursor-pointer ${
              activeTab === 'cartoes'
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={t('nav.cards_short', 'Cartões')}
            aria-label={t('nav.cards_short', 'Cartões')}
          >
            <CreditCard className="w-[22px] h-[22px] stroke-[2.2]" />
            {activeTab === 'cartoes' && (
              <span
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full transition-all animate-in zoom-in duration-200"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 6px ${accentColor}`,
                }}
              />
            )}
          </button>

          {/* 5. Mais */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('mais');
            }}
            style={activeTab === 'mais' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center w-11 h-11 rounded-full transition-all active:scale-90 cursor-pointer ${
              activeTab === 'mais'
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={t('nav.more', 'Mais')}
            aria-label={t('nav.more', 'Mais')}
          >
            <MoreHorizontal className="w-[22px] h-[22px] stroke-[2.2]" />
            {activeTab === 'mais' && (
              <span
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full transition-all animate-in zoom-in duration-200"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 6px ${accentColor}`,
                }}
              />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};

