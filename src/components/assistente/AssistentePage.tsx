import React, { useState, useEffect } from 'react';
import { MessageSquare, Bot } from 'lucide-react';
import { WhatsAppPage } from '../whatsapp/WhatsAppPage';
import { FinancialSkillsPage } from '../skills/FinancialSkillsPage';
import { TabNavigation, TabItem } from '../common/TabNavigation';
import { useTranslation } from '../../utils/i18n';

interface AssistentePageProps {
  initialSubTab?: 'whatsapp' | 'skills';
}

export const AssistentePage: React.FC<AssistentePageProps> = ({ initialSubTab }) => {
  const { t } = useTranslation();

  const getSubTabFromUrl = (): 'whatsapp' | 'skills' => {
    if (initialSubTab) return initialSubTab;
    if (typeof window === 'undefined') return 'whatsapp';
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    if (tabParam === 'skills' || tabParam === 'habilidades') return 'skills';
    if (tabParam === 'whatsapp' || tabParam === 'chat' || tabParam === 'zap') return 'whatsapp';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/skills')) return 'skills';
    return 'whatsapp';
  };

  const [activeSubTab, setActiveSubTab] = useState<'whatsapp' | 'skills'>(getSubTabFromUrl);

  useEffect(() => {
    if (initialSubTab && initialSubTab !== activeSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId === 'skills' ? 'skills' : 'whatsapp';
    setActiveSubTab(nextTab);
    const targetUrl = `/assistente?tab=${nextTab}`;
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.replaceState({ tab: 'assistente', subTab: nextTab }, '', targetUrl);
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'whatsapp',
      label: t('nav.whatsapp', 'WhatsApp'),
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'skills',
      label: t('nav.skills', 'Skills & Agentes'),
      icon: <Bot className="w-4 h-4" />,
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
        {activeSubTab === 'whatsapp' ? <WhatsAppPage /> : <FinancialSkillsPage />}
      </div>
    </div>
  );
};
