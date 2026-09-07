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
  CloudOff,
  Sparkles,
  LifeBuoy,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { FinlyLogo } from '../ui/FinlyLogo';
import { useTranslation } from '../../utils/i18n';
import { isNativeCapacitor } from '../../utils/appUpdateService';

interface HeaderProps {
  activeTab?: string;
  onOpenNewTransaction: () => void;
  onOpenMobileMenu?: () => void;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNewTransaction,
  onOpenMobileMenu,
  setActiveTab,
  collapsed,
  onToggleCollapse,
}) => {
  const {
    user,
    toggleHideValues,
    toggleTheme,
    notifications,
    markAllNotificationsRead,
    exportBackupJSON,
  } = useFinancial();

  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  return (
    <header
      className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between transition-all"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px))',
        height: 'calc(4rem + max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px)))',
      }}
    >
      {/* Left: Mobile Hamburger + Desktop Sidebar Toggle + Brand / Section Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 -ml-1.5 rounded-xl text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 -ml-1.5 rounded-xl text-slate-400 hover:text-purple-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer items-center justify-center"
            title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-purple-500" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        )}

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

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors cursor-pointer"
            title="Notificações"
            aria-label="Abrir Notificações"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <>
              {/* Backdrop para fechar ao clicar/tocar fora em qualquer dispositivo */}
              <div
                className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
                onClick={() => setShowNotifications(false)}
                onTouchStart={() => setShowNotifications(false)}
              />

              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-purple-500" />
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Notificações</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Marcar lidas
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      title="Fechar"
                    >
                      <span className="text-xs font-bold leading-none px-1">✕</span>
                    </button>
                  </div>
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
            </>
          )}
        </div>

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
            <>
              {/* Backdrop para fechar ao clicar/tocar fora em qualquer dispositivo */}
              <div
                className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
                onClick={() => setShowUserMenu(false)}
                onTouchStart={() => setShowUserMenu(false)}
              />

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
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Meu Perfil</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Configurações</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('ajuda');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <LifeBuoy className="w-4 h-4 text-purple-500" />
                <span>Central de Ajuda & Tutoriais</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('sobre');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors text-left cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>{isNativeCapacitor() ? 'Atualizações do App (Sobre)' : 'Sobre o Finly (Novidades)'}</span>
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
          </>
          )}
        </div>
      </div>
    </header>
  );
};
