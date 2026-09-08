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
  Trash2,
  CheckCheck,
  BellOff,
  Clock,
  CreditCard,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { FinlyLogo } from '../ui/FinlyLogo';
import { useTranslation } from '../../utils/i18n';
import { isNativeCapacitor } from '../../utils/appUpdateService';
import { formatNotificationTimestamp } from '../../utils/formatters';

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
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
    exportBackupJSON,
  } = useFinancial();

  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = filterTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  useEffect(() => {
    const handleOpenNotifs = () => setShowNotifications(true);
    window.addEventListener('finly_open_notifications', handleOpenNotifs);
    return () => window.removeEventListener('finly_open_notifications', handleOpenNotifs);
  }, []);

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
                className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
                onClick={() => setShowNotifications(false)}
                onTouchStart={() => setShowNotifications(false)}
              />

              <div
                className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 w-auto sm:w-96 max-w-sm mx-auto sm:mx-0 bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-slate-200/90 dark:border-white/10 p-3.5 z-50 animate-in fade-in-50 zoom-in-95 backdrop-blur-xl"
                style={{ backgroundColor: 'var(--app-card-bg, #18181B)' }}
              >
                {/* Header Bar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    <h4 className="font-black text-xs text-slate-900 dark:text-white">Notificações</h4>
                    {notifications.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/10 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold border border-purple-500/20 dark:border-purple-800/60">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Marcar todas como lidas"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Lidas</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        className="text-[10.5px] text-rose-500 hover:text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Limpar todo o histórico de notificações"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Limpar</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Fechar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                {notifications.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-2 pb-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFilterTab('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        filterTab === 'all'
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      Todas ({notifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('unread')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        filterTab === 'unread'
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      Não lidas ({unreadCount})
                    </button>
                  </div>
                )}

                {/* Notifications List */}
                <div className="py-2 space-y-1.5 max-h-72 overflow-y-auto pr-0.5 divide-y divide-slate-100 dark:divide-white/5">
                  {displayedNotifications.length === 0 ? (
                    <div className="py-7 text-center space-y-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-purple-500/10 dark:bg-purple-950/40 text-purple-500 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20 dark:border-purple-800/40 shadow-xs">
                        <BellOff className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {filterTab === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                      </p>
                    </div>
                  ) : (
                    displayedNotifications.map(n => {
                      let IconComponent = Bell;
                      let badgeColor = 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30';
                      const lower = (n.title + ' ' + (n.message || '')).toLowerCase();
                      if (n.type === 'alert' || lower.includes('🚨') || lower.includes('⚠️') || lower.includes('limite')) {
                        IconComponent = AlertTriangle;
                        badgeColor = 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30';
                      } else if (n.type === 'success' || lower.includes('🎯') || lower.includes('🎉') || lower.includes('concluída')) {
                        IconComponent = CheckCircle2;
                        badgeColor = 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30';
                      } else if (lower.includes('💳') || lower.includes('cartão')) {
                        IconComponent = CreditCard;
                        badgeColor = 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30';
                      } else if (lower.includes('⏰') || lower.includes('vence') || n.type === 'reminder') {
                        IconComponent = Clock;
                        badgeColor = 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30';
                      } else if (n.tag === 'app_update' || lower.includes('🚀')) {
                        IconComponent = Sparkles;
                        badgeColor = 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30';
                      }

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.tag === 'app_update') {
                              window.dispatchEvent(new CustomEvent('finly_open_update_modal'));
                              setShowNotifications(false);
                            }
                          }}
                          className={`group relative pt-2 pb-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                            n.read
                              ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-75 hover:opacity-100 border border-transparent'
                              : 'bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/30 border border-purple-200/50 dark:border-purple-800/40'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${badgeColor}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                                {n.title}
                              </h5>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5 leading-snug break-words">
                              {n.message}
                            </p>
                            <span className="inline-block text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                              {formatNotificationTimestamp(n.date)}
                            </span>
                          </div>

                          {/* Individual delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="absolute top-2 right-2 p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Apagar notificação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
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

              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-slate-200 dark:border-white/10 p-2 z-50 animate-in fade-in zoom-in-95 space-y-1"
                style={{ backgroundColor: 'var(--app-card-bg, #18181B)' }}
              >
                <div className="p-2.5 border-b border-slate-100 dark:border-white/10">
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
