import React, { useState, useEffect } from 'react';
import { Flag, Target } from 'lucide-react';
import { BudgetPage } from '../orcamento/BudgetPage';
import { GoalsPage } from '../metas/GoalsPage';
import { TabNavigation, TabItem } from '../common/TabNavigation';
import { useTranslation } from '../../utils/i18n';

interface PlanejarPageProps {
  initialSubTab?: 'orcamento' | 'metas';
}

export const PlanejarPage: React.FC<PlanejarPageProps> = ({ initialSubTab }) => {
  const { t } = useTranslation();

  const getSubTabFromUrl = (): 'orcamento' | 'metas' => {
    if (initialSubTab) return initialSubTab;
    if (typeof window === 'undefined') return 'orcamento';
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    if (tabParam === 'metas' || tabParam === 'objetivos' || tabParam === 'goals') return 'metas';
    if (tabParam === 'orcamento' || tabParam === 'planejamento' || tabParam === 'budgets') return 'orcamento';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/metas')) return 'metas';
    return 'orcamento';
  };

  const [activeSubTab, setActiveSubTab] = useState<'orcamento' | 'metas'>(getSubTabFromUrl);

  useEffect(() => {
    if (initialSubTab && initialSubTab !== activeSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId === 'metas' ? 'metas' : 'orcamento';
    setActiveSubTab(nextTab);
    const targetUrl = `/planejar?tab=${nextTab}`;
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.replaceState({ tab: 'planejar', subTab: nextTab }, '', targetUrl);
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'orcamento',
      label: t('nav.planning', 'Orçamento'),
      icon: <Flag className="w-4 h-4" />,
    },
    {
      id: 'metas',
      label: t('nav.goals', 'Metas'),
      icon: <Target className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Floating Tab Switcher */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-white/[0.06]">
        <TabNavigation
          tabs={tabs}
          activeTab={activeSubTab}
          onChange={handleTabChange}
          size="md"
        />
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeSubTab === 'orcamento' ? <BudgetPage /> : <GoalsPage />}
      </div>
    </div>
  );
};
