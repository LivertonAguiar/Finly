import React, { useState, useEffect } from 'react';
import { Building2, CreditCard } from 'lucide-react';
import { AccountsPage } from '../accounts/AccountsPage';
import { CreditTab } from '../dashboard/CreditTab';
import { TabNavigation, TabItem } from '../common/TabNavigation';
import { useTranslation } from '../../utils/i18n';

interface AccountsAndCardsPageProps {
  initialSubTab?: 'contas' | 'cartoes';
  onOpenNewCard?: () => void;
  initialCardDetailId?: string | null;
  setActiveTab?: (tab: string) => void;
}

export const AccountsAndCardsPage: React.FC<AccountsAndCardsPageProps> = ({
  initialSubTab,
  onOpenNewCard,
  initialCardDetailId,
  setActiveTab,
}) => {
  const { t } = useTranslation();

  const getSubTabFromUrl = (): 'contas' | 'cartoes' => {
    if (initialSubTab) return initialSubTab;
    if (typeof window === 'undefined') return 'cartoes';
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    if (tabParam === 'contas' || tabParam === 'conta' || tabParam === 'accounts') return 'contas';
    if (tabParam === 'cartoes' || tabParam === 'cartao' || tabParam === 'cards') return 'cartoes';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/contas') && !path.includes('/contas-cartoes') && !path.includes('/cartoes')) return 'contas';
    return 'cartoes';
  };

  const [activeSubTab, setActiveSubTab] = useState<'contas' | 'cartoes'>(getSubTabFromUrl);

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
    const nextTab = tabId === 'contas' ? 'contas' : 'cartoes';
    setActiveSubTab(nextTab);
    const targetUrl = `/contas-cartoes?tab=${nextTab}`;
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.replaceState({ tab: 'contas-cartoes', subTab: nextTab }, '', targetUrl);
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'cartoes',
      label: t('tab.cards', 'Cartões de Crédito'),
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'contas',
      label: t('tab.accounts', 'Contas'),
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Floating Tab Switcher */}
      <div className="flex items-center justify-center pb-1 border-b border-slate-200/60 dark:border-white/[0.06] w-full max-w-2xl mx-auto">
        <TabNavigation
          tabs={tabs}
          activeTab={activeSubTab}
          onChange={handleTabChange}
          size="md"
        />
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeSubTab === 'contas' ? (
          <AccountsPage setActiveTab={setActiveTab} />
        ) : (
          <CreditTab
            onOpenNewCard={onOpenNewCard || (() => {})}
            initialCardDetailId={initialCardDetailId}
          />
        )}
      </div>
    </div>
  );
};
