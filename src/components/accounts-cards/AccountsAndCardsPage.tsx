import React, { useState, useEffect, useMemo } from 'react';
import { Building2, CreditCard, Receipt } from 'lucide-react';
import { AccountsPage } from '../accounts/AccountsPage';
import { CreditTab } from '../dashboard/CreditTab';
import { InvoicesTab } from '../invoices/InvoicesTab';
import { TabNavigation, TabItem } from '../common/TabNavigation';
import { useTranslation } from '../../utils/i18n';
import { useFinancial } from '../../context/FinancialContext';
import { isCardInvoicePaid, getCardTransactionInvoiceMonth } from '../../utils/invoiceCalculator';

interface AccountsAndCardsPageProps {
  initialSubTab?: 'faturas' | 'cartoes' | 'contas';
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
  const { cards, transactions } = useFinancial();

  const getCardIdFromUrl = (): string | null => {
    if (initialCardDetailId) return initialCardDetailId;
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('cardId') || null;
  };

  const [cardDetailId, setCardDetailId] = useState<string | null>(getCardIdFromUrl);
  const [invoiceOriginSubTab, setInvoiceOriginSubTab] = useState<'faturas' | 'cartoes' | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    const cardIdParam = params.get('cardId');
    if (cardIdParam && (tabParam === 'cartoes' || tabParam === 'cartao' || tabParam === 'cards')) {
      return 'cartoes';
    }
    return null;
  });

  const getSubTabFromUrl = (): 'faturas' | 'cartoes' | 'contas' => {
    if (initialSubTab) return initialSubTab;
    if (typeof window === 'undefined') return 'faturas';
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();
    if (tabParam === 'cartoes' || tabParam === 'cartao' || tabParam === 'cards') return 'cartoes';
    if (tabParam === 'contas' || tabParam === 'conta' || tabParam === 'accounts') return 'contas';
    if (tabParam === 'faturas' || tabParam === 'fatura' || tabParam === 'invoices') return 'faturas';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/contas') && !path.includes('/contas-cartoes') && !path.includes('/cartoes')) return 'contas';
    if (path.includes('/cartoes')) return 'cartoes';
    return 'faturas';
  };

  const [activeSubTab, setActiveSubTab] = useState<'faturas' | 'cartoes' | 'contas'>(getSubTabFromUrl);

  useEffect(() => {
    if (initialSubTab && initialSubTab !== activeSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (initialCardDetailId !== undefined) {
      setCardDetailId(initialCardDetailId);
      if (initialCardDetailId) {
        if (activeSubTab === 'cartoes' || getSubTabFromUrl() === 'cartoes') {
          setInvoiceOriginSubTab('cartoes');
        }
        // Ao abrir detalhe de fatura, vai para a aba faturas exibindo a fatura do cartão selecionado
        setActiveSubTab('faturas');
      }
    }
  }, [initialCardDetailId]);

  useEffect(() => {
    const handlePopState = () => {
      const currentSubTab = getSubTabFromUrl();
      const currentCardId = getCardIdFromUrl();
      setActiveSubTab(currentSubTab);
      setCardDetailId(currentCardId);
      if (!currentCardId) {
        setInvoiceOriginSubTab(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId === 'faturas' ? 'faturas' : tabId === 'cartoes' ? 'cartoes' : 'contas';
    setActiveSubTab(nextTab);
    setCardDetailId(null);
    setInvoiceOriginSubTab(null);
    const targetUrl = `/contas-cartoes?tab=${nextTab}`;
    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== targetUrl) {
      window.history.replaceState({ tab: 'contas-cartoes', subTab: nextTab }, '', targetUrl);
    }
  };

  const handleNavigateToInvoiceDetail = (id: string) => {
    setInvoiceOriginSubTab('cartoes');
    setCardDetailId(id);
    setActiveSubTab('faturas');
    const targetUrl = `/contas-cartoes?tab=cartoes&cardId=${id}`;
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'contas-cartoes', subTab: 'cartoes', cardId: id }, '', targetUrl);
    }
  };

  const handleCloseCardDetail = () => {
    const returnTab = invoiceOriginSubTab || 'faturas';
    setCardDetailId(null);
    setInvoiceOriginSubTab(null);
    setActiveSubTab(returnTab);
    if (typeof window !== 'undefined') {
      const targetUrl = `/contas-cartoes?tab=${returnTab}`;
      window.history.replaceState({ tab: 'contas-cartoes', subTab: returnTab }, '', targetUrl);
    }
  };

  // Bonus: Selo vermelho de alerta quando houver fatura vencida ou vencendo em até 3 dias
  const overdueOrDueSoonCount = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    return cards.filter(card => {
      const cardExpenses = transactions.filter(
        t => t.cardId === card.id && t.type === 'expense' && getCardTransactionInvoiceMonth(t, card) === currentMonthPrefix
      );
      const invoiceTotal = cardExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
      if (invoiceTotal <= 0) return false;

      const isPaid = isCardInvoicePaid(card, currentMonthPrefix, transactions);
      if (isPaid) return false;

      const dueDay = card.dueDay || 5;
      const isOverdue = currentDay > dueDay;
      const isDueSoon = !isOverdue && (dueDay - currentDay >= 0 && dueDay - currentDay <= 3);

      return isOverdue || isDueSoon;
    }).length;
  }, [cards, transactions]);

  const tabs: TabItem[] = [
    {
      id: 'faturas',
      label: t('tab.invoices', 'Faturas'),
      icon: <Receipt className="w-4 h-4" />,
      badge: overdueOrDueSoonCount > 0 ? overdueOrDueSoonCount : undefined,
      badgeVariant: 'danger',
    },
    {
      id: 'cartoes',
      label: t('tab.cards', 'Cartões'),
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
      {/* Top Floating Tab Switcher - Proporcional e Centralizado */}
      <div className="flex items-center justify-center pb-2 border-b border-slate-200/60 dark:border-white/[0.06] w-full max-w-2xl mx-auto">
        <TabNavigation
          tabs={tabs}
          activeTab={activeSubTab}
          onChange={handleTabChange}
          size="md"
        />
      </div>

      {/* Tab Content */}
      <div key={activeSubTab} className="animate-in fade-in duration-200">
        {activeSubTab === 'faturas' ? (
          <InvoicesTab
            onOpenNewCard={onOpenNewCard}
            initialCardId={cardDetailId}
            onClearCardDetail={handleCloseCardDetail}
            returnSubTab={invoiceOriginSubTab || 'faturas'}
          />
        ) : activeSubTab === 'cartoes' ? (
          <CreditTab
            onOpenNewCard={onOpenNewCard || (() => {})}
            onNavigateToInvoices={handleNavigateToInvoiceDetail}
          />
        ) : (
          <AccountsPage setActiveTab={setActiveTab} />
        )}
      </div>
    </div>
  );
};