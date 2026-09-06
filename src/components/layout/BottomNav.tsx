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
  const [accentColor, setAccentColor] = useState<string>(() => user.accentColor || localStorage.getItem('plannerfin_accent_color') || '#7C4DFF');

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
        const saved = localStorage.getItem('plannerfin_accent_color');
        if (saved) setAccentColor(saved);
      }
    };
    window.addEventListener('plannerfin_theme_changed', handleThemeChange);
    return () => window.removeEventListener('plannerfin_theme_changed', handleThemeChange);
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
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end items-center pb-24 animate-in fade-in duration-200"
          onClick={() => setIsSpeedDialOpen(false)}
        >
          {/* Radial / Arc Action Buttons Container */}
          <div
            className="relative w-72 h-44 flex items-center justify-center select-none"
            onClick={e => e.stopPropagation()}
          >
            {/* 1. Transferência (Bottom-Left) */}
            <div className="absolute left-1 bottom-4 flex flex-col items-center animate-in zoom-in-50 duration-200">
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

            {/* 2. Receita (Top-Left) */}
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

            {/* 3. Despesa Cartão (Top-Right) */}
            <div className="absolute right-10 top-0 flex flex-col items-center animate-in zoom-in-50 duration-250">
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

            {/* 4. Despesa (Bottom-Right) */}
            <div className="absolute right-1 bottom-4 flex flex-col items-center animate-in zoom-in-50 duration-200">
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

      {/* Main Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-around px-2 z-40 md:hidden shadow-2xl transition-all select-none"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px), 8px)',
          height: 'calc(3.8rem + max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px)))',
        }}
      >
        {/* 1. Principal / Dashboard */}
        <button
          onClick={() => {
            setIsSpeedDialOpen(false);
            setActiveTab('dashboard');
          }}
          style={activeTab === 'dashboard' ? { color: accentColor } : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === 'dashboard' ? 'font-black' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{t('nav.dashboard', 'Principal')}</span>
        </button>

        {/* 2. Transações */}
        <button
          onClick={() => {
            setIsSpeedDialOpen(false);
            setActiveTab('transacoes');
          }}
          style={activeTab === 'transacoes' ? { color: accentColor } : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === 'transacoes' ? 'font-black' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{t('nav.transactions', 'Transações')}</span>
        </button>

        {/* 3. Central FAB Button (Toggles Speed Dial) */}
        <div className="flex-1 flex items-center justify-center -mt-6 z-40">
          <button
            type="button"
            onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 14px 0 ${accentColor}40`,
            }}
            className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer border-4 border-white dark:border-[#121214] hover:brightness-110 ${
              isSpeedDialOpen ? 'rotate-90 brightness-90' : ''
            }`}
            title="Ações Rápidas"
          >
            {isSpeedDialOpen ? (
              <X className="w-6 h-6 stroke-[3]" />
            ) : (
              <Plus className="w-6 h-6 stroke-[3]" />
            )}
          </button>
        </div>

        {/* 4. Planejamento */}
        <button
          onClick={() => {
            setIsSpeedDialOpen(false);
            setActiveTab('planejamento');
          }}
          style={activeTab === 'planejamento' || activeTab === 'orcamento' ? { color: accentColor } : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === 'planejamento' || activeTab === 'orcamento' ? 'font-black' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Flag className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{t('nav.planning', 'Planejamento')}</span>
        </button>

        {/* 5. Mais */}
        <button
          onClick={() => {
            setIsSpeedDialOpen(false);
            setActiveTab('mais');
          }}
          style={activeTab === 'mais' ? { color: accentColor } : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === 'mais' ? 'font-black' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">{t('nav.more', 'Mais')}</span>
        </button>
      </nav>
    </>
  );
};

