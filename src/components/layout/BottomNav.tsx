import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  Target,
  MoreHorizontal,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-around px-2 z-40 md:hidden shadow-2xl transition-all"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        height: 'calc(3.8rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. Principal */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
          activeTab === 'dashboard' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-bold tracking-tight">Principal</span>
      </button>

      {/* 2. Transações */}
      <button
        onClick={() => setActiveTab('transacoes')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
          activeTab === 'transacoes' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5" />
        <span className="text-[10px] font-bold tracking-tight">Transações</span>
      </button>

      {/* 3. Central Big + Floating Action Button (Thumb Zone Optimized) */}
      <div className="flex-1 flex items-center justify-center -mt-6">
        <button
          onClick={onOpenNewTransaction}
          className="w-13 h-13 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 active:scale-90 transition-transform cursor-pointer border-4 border-white dark:border-[#1C1C1E]"
          title="Nova Transação"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* 4. Planejamento */}
      <button
        onClick={() => setActiveTab('planejamento')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
          activeTab === 'planejamento' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        <Target className="w-5 h-5" />
        <span className="text-[10px] font-bold tracking-tight">Planejar</span>
      </button>

      {/* 5. Mais */}
      <button
        onClick={() => setActiveTab('mais')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 cursor-pointer ${
          activeTab === 'mais' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] font-bold tracking-tight">Mais</span>
      </button>
    </nav>
  );
};
