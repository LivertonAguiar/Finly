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
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

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
                Transferência
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
                Receita
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
                Despesa<br />cartão
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
                Despesa
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-around px-2 z-50 md:hidden shadow-2xl transition-all select-none"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          height: 'calc(3.8rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* 1. Principal */}
        <button
          onClick={() => {
            setIsSpeedDialOpen(false);
            setActiveTab('dashboard');
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Principal</span>
        </button>

        {/* 2. Transações */}
        <button
          onClick={() => {
            setIsSpeedDialOpen(false);
            setActiveTab('transacoes');
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === 'transacoes' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Transações</span>
        </button>

        {/* 3. Central FAB Button (Toggles Speed Dial) */}
        <div className="flex-1 flex items-center justify-center -mt-6 z-50">
          <button
            type="button"
            onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
            className={`w-14 h-14 rounded-full bg-[#9333ea] hover:bg-[#8b5cf6] text-white flex items-center justify-center shadow-lg shadow-purple-600/40 active:scale-90 transition-all cursor-pointer border-4 border-white dark:border-[#1C1C1E] ${
              isSpeedDialOpen ? 'rotate-90 bg-purple-500 shadow-purple-500/60' : ''
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
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === 'planejamento' || activeTab === 'orcamento' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Flag className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Planejamento</span>
        </button>

        {/* 5. Mais */}
        <button
          onClick={() => {
            setIsSpeedDialOpen(false);
            setActiveTab('mais');
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeTab === 'mais' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Mais</span>
        </button>
      </nav>
    </>
  );
};
