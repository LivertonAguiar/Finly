import React, { useState } from 'react';
import { OverviewTab } from './OverviewTab';
import { CreditTab } from './CreditTab';
import { InvestmentsTab } from './InvestmentsTab';

interface DashboardPageProps {
  onOpenNewTransaction: () => void;
  onOpenNewCard: () => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewTransaction,
  onOpenNewCard,
  setActiveTab,
}) => {
  const [subTab, setSubTab] = useState<'conta' | 'credito' | 'investimentos'>('conta');

  return (
    <div className="space-y-6">
      {/* 3 Main Tabs: Conta, Crédito, Investimentos */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <button
          onClick={() => setSubTab('conta')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'conta'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Conta
        </button>

        <button
          onClick={() => setSubTab('credito')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'credito'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Crédito
        </button>

        <button
          onClick={() => setSubTab('investimentos')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'investimentos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Investimentos
        </button>
      </div>

      {/* Render active sub-tab */}
      {subTab === 'conta' && (
        <OverviewTab onOpenNewTransaction={onOpenNewTransaction} setActiveTab={setActiveTab} />
      )}
      {subTab === 'credito' && <CreditTab onOpenNewCard={onOpenNewCard} />}
      {subTab === 'investimentos' && <InvestmentsTab />}
    </div>
  );
};