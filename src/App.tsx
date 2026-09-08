import { CalendarPage } from './components/calendario/CalendarPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ReportsPage } from './components/relatorios/ReportsPage';
import { AccountsPage } from './components/accounts/AccountsPage';
import { MorePage } from './components/more/MorePage';
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UndoToastProvider } from './context/UndoToastContext';
import { FinancialProvider, useFinancial } from './context/FinancialContext';
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
import { checkAndTriggerScheduledAlerts } from './utils/notificationEngine';
import { checkForAppUpdates } from './utils/appUpdateService';
import { PullToRefresh } from './components/mobile/PullToRefresh';
import { UpdateNoticeCard } from './components/common/UpdateNoticeCard';
import { InAppNotificationToast } from './components/common/InAppNotificationToast';
import { AppUpdateModal } from './components/common/AppUpdateModal';
import { WebWhatsNewModal } from './components/common/WebWhatsNewModal';
import { HelpCenterPage } from './components/help/HelpCenterPage';
import { setRootBackHandler } from './utils/backButtonManager';
import { PinLockScreen } from './components/common/PinLockScreen';
import {
  isSecurityLockEnabled,
  isAppLocked,
  lockApp,
  unlockApp,
  recordActivity,
  shouldLockDueToInactivity,
} from './utils/securityManager';

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
  sobre: '/mais',
  metas: '/metas',
  dividas: '/dividas',
  investimentos: '/investimentos',
  whatsapp: '/whatsapp',
  skills: '/skills',
  familia: '/familia',
  cadastro: '/cadastro',
  perfil: '/perfil',
  ajuda: '/ajuda',
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
  if (path === 'perfil' || path === 'profile' || path === 'seguranca' || path === 'security') return 'perfil';
  if (path === 'ajuda' || path === 'help') return 'ajuda';
  return 'dashboard';
};

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const { transactions, cards, budgets, goals, refreshData } = useFinancial();
  const [activeTab, setActiveTab] = useState<string>(getInitialTabFromPath);
  const [cardsNavKey, setCardsNavKey] = useState<number>(0);
  const [selectedCardIdForDetail, setSelectedCardIdForDetail] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(() => isSecurityLockEnabled() && isAppLocked());

  // Security Lock Monitor (Visibility, Inactivity, Activity recording)
  useEffect(() => {
    if (!currentUser || !isSecurityLockEnabled()) return;

    // Check on mount
    if (shouldLockDueToInactivity()) {
      lockApp();
      setIsLocked(true);
    }

    const handleLockStateChanged = (e: CustomEvent) => {
      setIsLocked(e.detail.locked);
    };
    window.addEventListener('finly_lock_state_changed' as any, handleLockStateChanged);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordActivity();
      } else {
        if (shouldLockDueToInactivity()) {
          lockApp();
          setIsLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Throttled activity recorder
    let lastRecorded = Date.now();
    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastRecorded > 15000) { // Record at most every 15s
        lastRecorded = now;
        recordActivity();
      }
    };

    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('finly_lock_state_changed' as any, handleLockStateChanged);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [currentUser]);

  // Background Financial Alerts Checker
  useEffect(() => {
    if (currentUser) {
      checkAndTriggerScheduledAlerts({ transactions, cards, budgets, goals });

      // Run periodically every 30 minutes
      const interval = setInterval(() => {
        checkAndTriggerScheduledAlerts({ transactions, cards, budgets, goals });
      }, 30 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [currentUser, transactions, cards, budgets, goals]);

  // Proactive App Update Checker on Entry, Resume and Periodic Interval
  useEffect(() => {
    if (!currentUser) return;
    let isCancelled = false;

    const runAutoCheck = async () => {
      try {
        await new Promise(r => setTimeout(r, 2500));
        if (isCancelled) return;

        const result = await checkForAppUpdates({ notifyIfFound: true, isManualCheck: false });
        if (result && result.hasUpdate && !isCancelled) {
          const sessionPrompted = sessionStorage.getItem(`finly_update_prompted_${result.latestVersion}`);
          if (!sessionPrompted) {
            sessionStorage.setItem(`finly_update_prompted_${result.latestVersion}`, 'true');
            setIsUpdateModalOpen(true);
          }
        }
      } catch (e) {
        console.warn('Auto update check error:', e);
      }
    };

    runAutoCheck();

    // Periodic check every 1 hour
    const interval = setInterval(runAutoCheck, 60 * 60 * 1000);

    // Re-check when app returns from background
    const handleVisibility = () => {
      if (!document.hidden) {
        runAutoCheck();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser]);

  // Fullscreen configuration for Native Android with Notch / Cutout compensation
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      import('@capacitor/status-bar').then(({ StatusBar }) => {
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        StatusBar.hide().catch(() => {});
      }).catch(() => {});

      // Fallback safe-area notch compensation if native listener hasn't set it yet
      const currentSat = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top');
      if (!currentSat || currentSat.trim() === '' || currentSat === '0px') {
        document.documentElement.style.setProperty('--safe-area-inset-top', '28px');
        document.documentElement.style.setProperty('--sat', '28px');
      }
    }
  }, []);

  const handleSelectTab = useCallback((tab: string) => {
    if (tab === 'sobre') {
      setActiveTab('mais');
      const targetPath = '/mais';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab: 'mais' }, '', targetPath);
      }
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('finly_open_sobre'));
      }, 50);
      return;
    }

    if (tab === 'cartoes') {
      setSelectedCardIdForDetail(null);
      setCardsNavKey(prev => prev + 1);
    }
    setActiveTab(tab);
    const targetPath = TAB_TO_PATH[tab] || `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  }, []);

  const handleGoToUpdate = useCallback(() => {
    setIsUpdateModalOpen(true);
  }, []);

  const handleOpenCardDetail = useCallback((cardId: string) => {
    setSelectedCardIdForDetail(cardId);
    setCardsNavKey(prev => prev + 1);
    setActiveTab('cartoes');
    const targetPath = TAB_TO_PATH['cartoes'] || '/cartoes';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: 'cartoes' }, '', targetPath);
    }
  }, []);

  // Sync URL with browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If back gesture or popstate was for dismissing a modal, don't change tabs!
      if (e.state?.modalStateId) {
        return;
      }
      const tab = getInitialTabFromPath();
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle Android back button navigation when no modal/drawer is open
  useEffect(() => {
    setRootBackHandler(() => {
      // If user is on any other tab than dashboard, back goes to dashboard
      if (activeTab !== 'dashboard') {
        handleSelectTab('dashboard');
        return true;
      }
      // If already on dashboard, returning false allows double-tap exit toast
      return false;
    });

    return () => {
      setRootBackHandler(null);
    };
  }, [activeTab, handleSelectTab]);

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
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);


  // Global listener to trigger AppUpdateModal
  useEffect(() => {
    const handleOpenUpdate = () => setIsUpdateModalOpen(true);
    window.addEventListener('finly_open_update_modal', handleOpenUpdate);
    return () => window.removeEventListener('finly_open_update_modal', handleOpenUpdate);
  }, []);

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

  if (!currentUser) {
    return <AuthPage onLoginSuccess={() => handleSelectTab('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-transparent text-slate-900 dark:text-slate-100 flex flex-row">
      {/* Sidebar with Mobile Drawer & Unified Top-Right Toggle */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        onOpenNewTransaction={() => setIsNewTxOpen(true)}
      />

      {/* Main Column (Header + Content) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Floating In-App Update Notice Popup on Entry */}
        <UpdateNoticeCard onGoToUpdate={handleGoToUpdate} />

        {/* Real-time In-App Notification Toast */}
        <InAppNotificationToast />

        {/* Main Top Header with Mobile Hamburger & Desktop Sidebar Toggle */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          onOpenNewTransaction={() => setIsNewTxOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Main Content Area with Mobile Pull-to-Refresh */}
        <PullToRefresh onRefresh={refreshData}>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
            <div className="w-full max-w-[1600px] mx-auto overflow-x-hidden">
            {activeTab === 'dashboard' && (
              <DashboardPage
                onOpenNewTransaction={() => setIsNewTxOpen(true)}
                onOpenNewCard={() => setIsNewCardOpen(true)}
                setActiveTab={handleSelectTab}
                onOpenCardDetail={handleOpenCardDetail}
              />
            )}
            {activeTab === 'transacoes' && <TransactionsPage />}
            {activeTab === 'cartoes' && (
              <CreditTab
                key={cardsNavKey}
                initialCardDetailId={selectedCardIdForDetail}
                onOpenNewCard={() => setIsNewCardOpen(true)}
              />
            )}
            {activeTab === 'contas' && <AccountsPage setActiveTab={handleSelectTab} />}
            {(activeTab === 'planejamento' || activeTab === 'orcamento') && <BudgetPage />}
            {activeTab === 'relatorios' && <ReportsPage />}
            {activeTab === 'calendario' && <CalendarPage />}
            {activeTab === 'settings' && <SettingsPage />}
            {(activeTab === 'mais' || activeTab === 'sobre') && (
              <MorePage
                setActiveTab={handleSelectTab}
                initialSubTab={activeTab === 'sobre' ? 'SOBRE' : undefined}
              />
            )}
            {activeTab === 'metas' && <GoalsPage />}
            {activeTab === 'dividas' && <DebtsPage />}
            {activeTab === 'investimentos' && <InvestmentsTab />}
            {activeTab === 'whatsapp' && <WhatsAppPage />}
            {activeTab === 'skills' && <FinancialSkillsPage />}
            {activeTab === 'familia' && <FamilyPage />}
            {activeTab === 'cadastro' && <CadastrosPage />}
            {activeTab === 'perfil' && <ProfilePage />}
            {activeTab === 'ajuda' && <HelpCenterPage onNavigateToTab={handleSelectTab} />}
          </div>
        </main>
        </PullToRefresh>
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
        key={`tx-modal-${newTxInitialType}-${newTxPaymentMethod}`}
        isOpen={isNewTxOpen}
        onClose={() => setIsNewTxOpen(false)}
        initialType={newTxInitialType}
        initialPaymentMethod={newTxPaymentMethod}
        onNavigateToTab={handleSelectTab}
        onOpenNewCard={() => setIsNewCardOpen(true)}
      />

      <CardModal
        isOpen={isNewCardOpen}
        onClose={() => setIsNewCardOpen(false)}
      />

      {/* App Version & Update Modal (Android Native) */}
      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

      {/* Web First-Access What's New Modal */}
      <WebWhatsNewModal
        onNavigateToSobre={() => handleSelectTab('sobre')}
      />

      {/* Security Vault PIN / Biometric Lock Screen */}
      {isLocked && (
        <PinLockScreen onUnlock={() => setIsLocked(false)} />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <UndoToastProvider>
        <FinancialProvider>
          <ConfirmProvider>
            <AppContent />
          </ConfirmProvider>
        </FinancialProvider>
      </UndoToastProvider>
    </AuthProvider>
  );
};

export default App;
