import { CalendarPage } from './components/calendario/CalendarPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ReportsPage } from './components/relatorios/ReportsPage';
import { AccountsPage } from './components/accounts/AccountsPage';
import { MorePage } from './components/more/MorePage';
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { CreditTab } from './components/dashboard/CreditTab';
import { TransactionsPage } from './components/transactions/TransactionsPage';
import { CadastrosPage } from './components/cadastros/CadastrosPage';
import { BudgetPage } from './components/orcamento/BudgetPage';
import { GoalsPage } from './components/metas/GoalsPage';
import { DebtsPage } from './components/dividas/DebtsPage';
import { InvestmentsTab } from './components/dashboard/InvestmentsTab';
import { ProfilePage } from './components/perfil/ProfilePage';
import { FamilyPage } from './components/familia/FamilyPage';
import { WhatsAppPage } from './components/whatsapp/WhatsAppPage';
import { FinancialSkillsPage } from './components/skills/FinancialSkillsPage';
import { AuthPage } from './components/auth/AuthPage';
import { TransactionModal } from './components/transactions/TransactionModal';
import { CardModal } from './components/cadastros/CardModal';
import { PwaInstallModal } from './components/pwa/PwaInstallModal';

const TAB_TO_PATH: Record<string, string> = {
  dashboard: '/dashboard',
  transacoes: '/transacoes',
  contas: '/contas',
  cartoes: '/cartoes',
  planejamento: '/planejamento',
  orcamento: '/planejamento',
  relatorios: '/relatorios',
  calendario: '/calendario',
  settings: '/settings',
  mais: '/mais',
  metas: '/metas',
  dividas: '/dividas',
  investimentos: '/investimentos',
  whatsapp: '/whatsapp',
  skills: '/skills',
  familia: '/familia',
  cadastro: '/cadastro',
  perfil: '/perfil',
};

const getInitialTabFromPath = (): string => {
  if (typeof window === 'undefined') return 'dashboard';
  const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
  if (!path || path === 'dashboard' || path === 'principal') return 'dashboard';
  if (path === 'transacoes' || path === 'transacoes' || path === 'transactions') return 'transacoes';
  if (path === 'contas' || path === 'accounts') return 'contas';
  if (path === 'cartoes' || path === 'cartoescredito' || path === 'cards') return 'cartoes';
  if (path === 'planejamento' || path === 'orcamentos' || path === 'criarnovoplanejamento' || path === 'budgets') return 'planejamento';
  if (path === 'relatorios' || path === 'reports') return 'relatorios';
  if (path === 'calendario' || path === 'calendar') return 'calendario';
  if (path === 'settings' || path === 'configuracoes' || path === 'config') return 'settings';
  if (path === 'mais' || path === 'more') return 'mais';
  if (path === 'metas' || path === 'objetivos' || path === 'goals') return 'metas';
  if (path === 'dividas' || path === 'debts') return 'dividas';
  if (path === 'investimentos' || path === 'investments') return 'investimentos';
  if (path === 'whatsapp') return 'whatsapp';
  if (path === 'skills') return 'skills';
  if (path === 'familia' || path === 'family') return 'familia';
  if (path === 'cadastro') return 'cadastro';
  if (path === 'perfil' || path === 'profile') return 'perfil';
  return 'dashboard';
};

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(getInitialTabFromPath);
  const [cardsNavKey, setCardsNavKey] = useState<number>(0);

  const handleSelectTab = useCallback((tab: string) => {
    if (tab === 'cartoes') {
      setCardsNavKey(prev => prev + 1);
    }
    setActiveTab(tab);
    const targetPath = TAB_TO_PATH[tab] || `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  }, []);

  // Sync URL with browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const tab = getInitialTabFromPath();
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Ensure /login URL when unauthenticated, and /dashboard when authenticated
  useEffect(() => {
    if (!currentUser) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/cadastro') {
        window.history.replaceState({ tab: 'login' }, '', '/login');
      }
    } else {
      if (window.location.pathname === '/login' || window.location.pathname === '/' || window.location.pathname === '') {
        handleSelectTab('dashboard');
      }
    }
  }, [currentUser, handleSelectTab]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [newTxInitialType, setNewTxInitialType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [newTxPaymentMethod, setNewTxPaymentMethod] = useState<'account' | 'card'>('account');
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const handleOpenSpeedDialAction = (actionType: 'income' | 'expense' | 'transfer' | 'card_expense') => {
    if (actionType === 'income') {
      setNewTxInitialType('income');
      setNewTxPaymentMethod('account');
    } else if (actionType === 'transfer') {
      setNewTxInitialType('transfer');
      setNewTxPaymentMethod('account');
    } else if (actionType === 'card_expense') {
      setNewTxInitialType('expense');
      setNewTxPaymentMethod('card');
    } else {
      setNewTxInitialType('expense');
      setNewTxPaymentMethod('account');
    }
    setIsNewTxOpen(true);
  };

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!currentUser) {
    return <AuthPage onLoginSuccess={() => handleSelectTab('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121214] text-slate-900 dark:text-slate-100 flex flex-row">
      {/* Sidebar with Mobile Drawer & Unified Top-Right Toggle */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        onOpenNewTransaction={() => setIsNewTxOpen(true)}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
      />

      {/* Main Column (Header + Content) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Main Top Header with Mobile Hamburger */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          collapsed={sidebarCollapsed}
          onOpenNewTransaction={() => setIsNewTxOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 w-full">
          <div className="w-full max-w-[1600px] mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onOpenNewTransaction={() => setIsNewTxOpen(true)}
              onOpenNewCard={() => setIsNewCardOpen(true)}
              setActiveTab={handleSelectTab}
            />
          )}
          {activeTab === 'transacoes' && <TransactionsPage />}
          {activeTab === 'cartoes' && <CreditTab key={cardsNavKey} onOpenNewCard={() => setIsNewCardOpen(true)} />}
          {activeTab === 'contas' && <AccountsPage />}
          {(activeTab === 'planejamento' || activeTab === 'orcamento') && <BudgetPage />}
          {activeTab === 'relatorios' && <ReportsPage />}
          {activeTab === 'calendario' && <CalendarPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'mais' && <MorePage setActiveTab={handleSelectTab} onOpenPwaModal={() => setIsPwaModalOpen(true)} />}
          {activeTab === 'metas' && <GoalsPage />}
          {activeTab === 'dividas' && <DebtsPage />}
          {activeTab === 'investimentos' && <InvestmentsTab />}
          {activeTab === 'whatsapp' && <WhatsAppPage />}
          {activeTab === 'skills' && <FinancialSkillsPage />}
          {activeTab === 'familia' && <FamilyPage />}
          {activeTab === 'cadastro' && <CadastrosPage />}
          {activeTab === 'perfil' && <ProfilePage />}
        </div>
      </main>
      </div>

      {/* Mobile Bottom Navigation with Speed Dial Arc FAB */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenNewTransaction={() => handleOpenSpeedDialAction('expense')}
        onOpenAction={handleOpenSpeedDialAction}
      />

      {/* Global Modals */}
      <TransactionModal
        key={`tx-modal-${newTxInitialType}-${newTxPaymentMethod}-${isNewTxOpen}`}
        isOpen={isNewTxOpen}
        onClose={() => setIsNewTxOpen(false)}
        initialType={newTxInitialType}
        initialPaymentMethod={newTxPaymentMethod}
      />

      <CardModal
        isOpen={isNewCardOpen}
        onClose={() => setIsNewCardOpen(false)}
      />

      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <FinancialProvider>
        <ConfirmProvider>
          <AppContent />
        </ConfirmProvider>
      </FinancialProvider>
    </AuthProvider>
  );
};

export default App;
