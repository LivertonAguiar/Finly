import React, { useState, useEffect } from 'react';
import { TrendingUp, Landmark } from 'lucide-react';
import { InvestmentsTab } from '../dashboard/InvestmentsTab';
import { DebtsPage } from '../dividas/DebtsPage';
import { TabNavigation, TabItem } from '../common/TabNavigation';
import { useTranslation } from '../../utils/i18n';

interface PatrimonioPageProps {
  initialSubTab?: 'investimentos' | 'dividas';
}

export const PatrimonioPage: React.FC<PatrimonioPageProps> = ({ initialSubTab }) => {
  const { t } = useTranslation();

  const getSubTabFromUrl = (): 'investimentos' | 'dividas' => {
    if (initialSubTab) return initialSubTab;
    if (typeof window === 'undefined') return 'investimentos';
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    if (tabParam === 'dividas' || tabParam === 'debts') return 'dividas';
    if (tabParam === 'investimentos' || tabParam === 'investments') return 'investimentos';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/dividas')) return 'dividas';
    return 'investimentos';
  };

  const [activeSubTab, setActiveSubTab] = useState<'investimentos' | 'dividas'>(getSubTabFromUrl);

  useEffect(() => {
    if (initialSubTab && initialSubTab !== activeSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveSubTab(getSubTabFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId === 'dividas' ? 'dividas' : 'investimentos';
    setActiveSubTab(nextTab);
    const targetUrl = `/patrimonio?tab=${nextTab}`;
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.replaceState({ tab: 'patrimonio', subTab: nextTab }, '', targetUrl);
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'investimentos',
      label: t('tab.investments', 'Investimentos'),
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'dividas',
      label: t('tab.debts', 'Dívidas & Financiamentos'),
      icon: <Landmark className="w-4 h-4" />,
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
        {activeSubTab === 'investimentos' ? <InvestmentsTab /> : <DebtsPage />}
      </div>
    </div>
  );
};
