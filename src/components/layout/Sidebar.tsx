import React, { useState, useEffect, useMemo } from 'react';
import {
  MoreHorizontal,
  ChevronDown,
  Plus,
  SlidersHorizontal,
  Search,
  Moon,
  Sun,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import {
  ALL_SIDEBAR_ITEMS,
  getStoredSidebarItems,
  getSidebarItemLabel,
  SidebarItemDef,
} from '../../utils/sidebarConfig';
import { SidebarCustomizerModal } from './SidebarCustomizerModal';
import { useTranslation } from '../../utils/i18n';
import { useBackButton } from '../../hooks/useBackButton';
import './ModernSidebar.css';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenNewTransaction: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onOpenNewTransaction,
}) => {
  const { user, toggleTheme, toggleHideValues, notifications } = useFinancial();
  const { currentUser } = useAuth();
  const { lang, t } = useTranslation();
  const [activeItemIds, setActiveItemIds] = useState<string[]>(getStoredSidebarItems);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accentColor, setAccentColor] = useState<string>(() => user.accentColor || localStorage.getItem('finly_accent_color') || '#7C4DFF');

  // Detect dark theme
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Close mobile sidebar drawer on Android back gesture
  useBackButton(mobileOpen, () => setMobileOpen(false));

  // Sync accent color when user changes or theme updates
  useEffect(() => {
    if (user.accentColor) {
      setAccentColor(user.accentColor);
    }
    const handleThemeChange = (e: any) => {
      if (e?.detail?.accentColor) {
        setAccentColor(e.detail.accentColor);
      } else {
        const saved = localStorage.getItem('finly_accent_color');
        if (saved) setAccentColor(saved);
      }
    };
    window.addEventListener('finly_theme_changed', handleThemeChange);
    return () => window.removeEventListener('finly_theme_changed', handleThemeChange);
  }, [user.accentColor]);

  // Listen to sidebar changes from customizer or other tabs
  useEffect(() => {
    const handleSidebarChange = () => {
      setActiveItemIds(getStoredSidebarItems());
    };
    window.addEventListener('finly_sidebar_changed', handleSidebarChange);
    return () => window.removeEventListener('finly_sidebar_changed', handleSidebarChange);
  }, []);

  const itemMap = useMemo(() => new Map(ALL_SIDEBAR_ITEMS.map(item => [item.id, item])), []);

  // Build the list of active navigation items in user-defined order
  const customNavItems: SidebarItemDef[] = useMemo(() => {
    const list = activeItemIds
      .map(id => itemMap.get(id))
      .filter((item): item is SidebarItemDef => !!item);

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(item => {
      const label = getSidebarItemLabel(item.id, lang).toLowerCase();
      return label.includes(q) || item.id.toLowerCase().includes(q);
    });
  }, [activeItemIds, itemMap, searchQuery, lang]);

  // User details for profile widget
  const userName = user.name || currentUser?.name || currentUser?.email?.split('@')[0] || 'Finly User';
  const userRole = currentUser?.role === 'admin' ? 'Admin' : 'Finly Pro';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('') || 'F';

  // Badge count for pending notifications
  const unreadNotifs = notifications ? notifications.filter(n => !n.read).length : 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Floating Modern Expandable Sidebar */}
      <aside
        className={`finly-modern-sidebar ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } transition-transform duration-300 md:transition-[width,box-shadow]`}
        style={
          accentColor
            ? ({
                '--finly-accent': accentColor,
                '--finly-active': `${accentColor}1F`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {/* 1. Profile Section */}
        <div
          className="profile"
          onClick={() => {
            setActiveTab('perfil');
            setMobileOpen(false);
          }}
          title={t('nav.profile', 'Perfil do Usuário')}
        >
          {user.avatarUrl ? (
            <img className="avatar" src={user.avatarUrl} alt={userName} />
          ) : (
            <div className="avatar">{userInitials}</div>
          )}
          <div className="details">
            <p className="name">{userName}</p>
            <p className="role">{userRole}</p>
          </div>
          <ChevronDown className="chevron" />
        </div>

        {/* 2. Search Section */}
        <div className="search">
          <input
            type="text"
            placeholder={t('search.placeholder', 'Buscar menu...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <Search className="icon" />
        </div>

        {/* 3. Navigation List */}
        <nav>
          {customNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const translatedLabel = getSidebarItemLabel(item.id, lang);
            const showBadge = item.id === 'transacoes' && unreadNotifs > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`nav-item ${isActive ? 'is-active' : ''}`}
                title={translatedLabel}
              >
                <Icon className="icon" />
                <p>{translatedLabel}</p>
                {showBadge && <span className="badge">{unreadNotifs}</span>}
              </button>
            );
          })}

          <hr />

          {/* Always accessible: Mais Opções */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('mais');
              setMobileOpen(false);
            }}
            className={`nav-item ${activeTab === 'mais' ? 'is-active' : ''}`}
            title={t('nav.more', 'Mais opções')}
          >
            <MoreHorizontal className="icon" />
            <p>{t('nav.more', 'Mais opções')}</p>
          </button>
        </nav>

        {/* 4. Sliding Horizontal Actions Footer */}
        <div className="actions">
          {/* Action 1: Theme Toggle (Sun / Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="action"
            title={isDark ? t('theme.light', 'Alternar para Modo Claro') : t('theme.dark', 'Alternar para Modo Escuro')}
          >
            {isDark ? (
              <Sun className="icon text-amber-400" />
            ) : (
              <Moon className="icon text-indigo-500" />
            )}
          </button>

          {/* Action 2: Quick New Transaction */}
          <button
            type="button"
            onClick={() => {
              onOpenNewTransaction();
              setMobileOpen(false);
            }}
            className="action"
            title={t('action.new_transaction', 'Novo Lançamento')}
          >
            <Plus className="icon text-emerald-500 stroke-[2.5]" />
          </button>

          {/* Action 3: Customize Menu */}
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            className="action"
            title={t('nav.customize_menu', 'Personalizar menu lateral')}
          >
            <SlidersHorizontal className="icon text-purple-500" />
          </button>

          {/* Action 4: Eye / EyeOff Toggle Values */}
          <button
            type="button"
            onClick={toggleHideValues}
            className="action"
            title={user.showValues ? t('action.hide_values', 'Ocultar valores') : t('action.show_values', 'Mostrar valores')}
          >
            {user.showValues ? (
              <Eye className="icon text-sky-400" />
            ) : (
              <EyeOff className="icon text-rose-400" />
            )}
          </button>
        </div>
      </aside>

      {/* Sidebar Customizer Modal */}
      <SidebarCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onItemsChange={items => setActiveItemIds(items)}
      />
    </>
  );
};
