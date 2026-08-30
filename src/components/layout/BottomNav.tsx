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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#151821]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40 md:hidden shadow-lg">
      {/* 1. Principal */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
          activeTab === 'dashboard' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Principal</span>
      </button>

      {/* 2. Transações */}
      <button
        onClick={() => setActiveTab('transacoes')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
          activeTab === 'transacoes' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5" />
        <span>Transações</span>
      </button>

      {/* 3. Central Big + Floating Action Button */}
      <button
        onClick={onOpenNewTransaction}
        className="w-12 h-12 -mt-5 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-xl shadow-purple-600/40 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* 4. Planejamento */}
      <button
        onClick={() => setActiveTab('planejamento')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
          activeTab === 'planejamento' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Target className="w-5 h-5" />
        <span>Planejamento</span>
      </button>

      {/* 5. Mais */}
      <button
        onClick={() => setActiveTab('mais')}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
          activeTab === 'mais' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <MoreHorizontal className="w-5 h-5" />
        <span>Mais</span>
      </button>
    </nav>
  );
};
