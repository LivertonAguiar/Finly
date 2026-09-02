import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Settings,
  User as UserIcon,
  Menu,
  Eye,
  EyeOff,
  Sun,
  Moon,
  LogOut,
  Download,
  ShieldCheck,
  Crown,
  Cloud,
  CheckCircle2,
  RefreshCw,
  CloudOff,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { apiSync, SyncStatus } from '../../utils/apiSync';
import { FinlyLogo } from '../ui/FinlyLogo';
import { useTranslation } from '../../utils/i18n';

interface HeaderProps {
  activeTab?: string;
  onOpenNewTransaction: () => void;
  onOpenMobileMenu?: () => void;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNewTransaction,
  onOpenMobileMenu,
  setActiveTab,
  collapsed,
}) => {
  const {
    user,
    toggleHideValues,
    toggleTheme,
    notifications,
    markAllNotificationsRead,
    exportBackupJSON,
    refreshData,
  } = useFinancial();

  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  useEffect(() => {
    return apiSync.subscribeStatus(setSyncStatus);
  }, []);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Hamburger + User Profile Badge / Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 -ml-1.5 rounded-xl text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand / Avatar */}
        <div className="flex md:hidden items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <FinlyLogo size="sm" />
        </div>

        {/* Desktop Active Section Title */}
        <div className="hidden md:flex items-center gap-2">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 capitalize">
            {t(
              activeTab === 'settings'
                ? 'nav.settings'
                : activeTab === 'orcamento' || activeTab === 'planejamento'
                ? 'nav.planning'
                : activeTab === 'metas'
                ? 'nav.goals'
                : activeTab === 'cartoes'
                ? 'nav.cards'
                : activeTab === 'transacoes'
                ? 'nav.transactions'
                : activeTab === 'contas'
                ? 'nav.accounts'
                : activeTab === 'relatorios'
                ? 'nav.reports'
                : activeTab === 'calendario'
                ? 'nav.calendar'
                : activeTab === 'mais'
                ? 'nav.more'
                : activeTab === 'dividas'
                ? 'nav.debts'
                : activeTab === 'investimentos'
                ? 'nav.investments'
                : activeTab === 'whatsapp'
                ? 'nav.whatsapp'
                : activeTab === 'skills'
                ? 'nav.skills'
                : activeTab === 'cadastro'
                ? 'nav.categories'
                : activeTab === 'familia'
                ? 'nav.family'
                : `nav.${activeTab}`,
              activeTab || 'Dashboard'
            )}
          </h2>
        </div>
      </div>

      {/* Right: Hide Values, Theme, Notifications, Settings, User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2">

        {/* Hide Values Toggle */}
        <button
          onClick={toggleHideValues}
          title={user.showValues ? t('common.hide_values', 'Ocultar valores') : t('common.hide_values', 'Mostrar valores')}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {user.showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-purple-500" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Alternar tema"
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {user.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Quick Data Sync Button */}
        <button
          onClick={async () => {
            setIsManualSyncing(true);
            try {
              if ('vibrate' in navigator) navigator.vibrate(18);
            } catch (_) {}
            await refreshData();
            setTimeout(() => setIsManualSyncing(false), 600);
          }}
          title={isManualSyncing ? 'Sincronizando dados...' : 'Sincronizar e Atualizar Dados'}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-purple-500 ${isManualSyncing ? 'animate-spin' : ''}`} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors cursor-pointer"
            title="Notificações"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Notificações</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllNotificationsRead} className="text-[10px] text-emerald-600 font-bold hover:underline">
                    Marcar lidas
                  </button>
                )}
              </div>
              <div className="py-2 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-64 overflow-y-auto text-xs">
                {notifications.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">Sem notificações.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="py-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setActiveTab('perfil')}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Configurações"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>

        {/* User Profile Avatar */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform shrink-0 font-black text-xs cursor-pointer"
            title={currentUser?.name || user.name}
          >
            {(currentUser?.name || user.name || 'U').charAt(0).toUpperCase()}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                  {currentUser?.name || user.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {currentUser?.email || user.email}
                </p>
                <span className="inline-block mt-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Membro'}
                </span>
              </div>

              <button
                onClick={() => {
                  setActiveTab('perfil');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Meu Perfil</span>
              </button>

              <button
                onClick={() => {
                  exportBackupJSON();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Baixar Backup (.JSON)</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('sobre');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors text-left"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Atualizações do App (Sobre)</span>
              </button>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sair da Conta (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
