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
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex flex-col justify-end items-center pb-20 sm:pb-24 animate-in fade-in duration-200"
          onClick={() => setIsSpeedDialOpen(false)}
        >
          {/* Radial / Arc Action Buttons Container */}
          <div
            className="relative w-72 h-44 flex items-center justify-center select-none"
            onClick={e => e.stopPropagation()}
          >
            {/* 1. Receita (Top-Left) */}
            <div className="absolute left-10 top-0 flex flex-col items-center animate-in zoom-in-50 duration-250">
              <button
                type="button"
                onClick={() => handleAction('income')}
                className="w-15 h-15 rounded-full bg-[#343438] hover:bg-[#3F3F44] active:scale-95 shadow-xl flex items-center justify-center text-emerald-400 border border-slate-700/60 transition-transform cursor-pointer"
              >
                <TrendingUp className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[11px] font-bold text-white mt-1.5 text-center drop-shadow-sm">
                {t('action.new_income', 'Receita')}
              </span>
            </div>

            {/* 2. Despesa (Top-Right) */}
            <div className="absolute right-10 top-0 flex flex-col items-center animate-in zoom-in-50 duration-250">
              <button
                type="button"
                onClick={() => handleAction('expense')}
                className="w-15 h-15 rounded-full bg-[#343438] hover:bg-[#3F3F44] active:scale-95 shadow-xl flex items-center justify-center text-rose-400 border border-slate-700/60 transition-transform cursor-pointer"
              >
                <TrendingDown className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[11px] font-bold text-white mt-1.5 text-center drop-shadow-sm">
                {t('action.new_expense', 'Despesa')}
              </span>
            </div>

            {/* 3. Despesa Cartão (Bottom-Left) */}
            <div className="absolute left-1 bottom-4 flex flex-col items-center animate-in zoom-in-50 duration-200">
              <button
                type="button"
                onClick={() => handleAction('card_expense')}
                className="w-15 h-15 rounded-full bg-[#343438] hover:bg-[#3F3F44] active:scale-95 shadow-xl flex items-center justify-center text-teal-400 border border-slate-700/60 transition-transform cursor-pointer"
              >
                <CreditCard className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[11px] font-bold text-white mt-1.5 text-center leading-tight drop-shadow-sm">
                {t('action.card_expense', 'Despesa Cartão')}
              </span>
            </div>

            {/* 4. Transferência (Bottom-Right) */}
            <div className="absolute right-1 bottom-4 flex flex-col items-center animate-in zoom-in-50 duration-200">
              <button
                type="button"
                onClick={() => handleAction('transfer')}
                className="w-15 h-15 rounded-full bg-[#343438] hover:bg-[#3F3F44] active:scale-95 shadow-xl flex items-center justify-center text-purple-400 border border-slate-700/60 transition-transform cursor-pointer"
              >
                <ArrowLeftRight className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[11px] font-bold text-white mt-1.5 text-center drop-shadow-sm">
                {t('action.transfer', 'Transferência')}
              </span>
            </div>
          </div>

          {/* Quick Entity Pills below Arc (Metas, Dívidas, Investimentos, Cartões) */}
          <div className="mt-6 flex items-center gap-2 flex-wrap justify-center max-w-xs px-2 animate-in fade-in duration-300">
            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('metas');
              }}
              className="px-3 py-1.5 rounded-full bg-[#2C2C30] hover:bg-purple-900/50 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>🎯</span> {t('nav.goals', 'Metas')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('dividas');
              }}
              className="px-3 py-1.5 rounded-full bg-[#2C2C30] hover:bg-rose-900/50 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>📉</span> {t('nav.debts', 'Dívidas')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('investimentos');
              }}
              className="px-3 py-1.5 rounded-full bg-[#2C2C30] hover:bg-emerald-900/50 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>📈</span> {t('nav.investments', 'Investimentos')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeedDialOpen(false);
                setActiveTab('cartoes');
              }}
              className="px-3 py-1.5 rounded-full bg-[#2C2C30] hover:bg-teal-900/50 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>💳</span> {t('nav.cards', 'Cartões')}
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar - Micro Pílula Fina (Opção B: 44px) */}
      <nav
        className="fixed left-0 right-0 z-50 flex justify-center items-center px-4 pointer-events-none md:hidden select-none transition-all duration-300"
        style={{
          bottom: 'max(env(safe-area-inset-bottom, 0px) + 8px, 12px)',
        }}
        aria-label="Navegação Mobile"
      >
        <div className="pointer-events-auto flex items-center justify-between px-2 h-11 w-full max-w-[310px] rounded-full bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-2xl border border-slate-300/90 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
          {/* 1. Principal / Dashboard */}
          <button
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              setActiveTab('dashboard');
            }}
            style={activeTab === 'dashboard' ? { color: accentColor } : undefined}
            className={`relative flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={t('nav.dashboard', 'Principal')}
            aria-label={t('nav.dashboard', 'Principal')}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
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
            className={`relative flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90 cursor-pointer ${
              activeTab === 'transacoes'
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={t('nav.transactions', 'Transações')}
            aria-label={t('nav.transactions', 'Transações')}
          >
            <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
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
              boxShadow: `0 2px 10px ${accentColor}66`,
            }}
            className={`w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 shadow-md active:scale-85 transition-transform duration-200 cursor-pointer hover:brightness-110 ${
              isSpeedDialOpen ? 'rotate-90 brightness-95' : ''
            }`}
            title="Ações Rápidas"
            aria-label="Ações Rápidas"
          >
            {isSpeedDialOpen ? (
              <X className="w-4 h-4 stroke-[3]" />
            ) : (
              <Plus className="w-4 h-4 stroke-[3]" />
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
            className={`relative flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90 cursor-pointer ${
              activeTab === 'cartoes'
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={t('nav.cards_short', 'Cartões')}
            aria-label={t('nav.cards_short', 'Cartões')}
          >
            <CreditCard className="w-5 h-5 stroke-[2.2]" />
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
            className={`relative flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90 cursor-pointer ${
              activeTab === 'mais'
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={t('nav.more', 'Mais')}
            aria-label={t('nav.more', 'Mais')}
          >
            <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
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

