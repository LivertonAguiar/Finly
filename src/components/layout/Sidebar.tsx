import React, { useState, useEffect, useMemo } from 'react';
import {
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { FinlyLogo } from '../ui/FinlyLogo';
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
  mobileOpen,
  setMobileOpen,
  onOpenNewTransaction,
}) => {
  const { user, notifications } = useFinancial();
  const { lang, t } = useTranslation();
  const [activeItemIds, setActiveItemIds] = useState<string[]>(getStoredSidebarItems);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [accentColor, setAccentColor] = useState<string>(() => user.accentColor || localStorage.getItem('finly_accent_color') || '#7C4DFF');

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
    return activeItemIds
      .map(id => itemMap.get(id))
      .filter((item): item is SidebarItemDef => !!item);
  }, [activeItemIds, itemMap]);

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
        {/* 1. Brand Logo Section */}
        <div
          className="brand"
          onClick={() => {
            setActiveTab('dashboard');
            setMobileOpen(false);
          }}
          title="Finly Dashboard"
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
            <FinlyLogo size="md" showText={false} />
          </div>
          <span className="brand-title">
            Finly
          </span>
        </div>

        {/* 2. Quick New Transaction Button */}
        <button
          type="button"
          onClick={() => {
            onOpenNewTransaction();
            setMobileOpen(false);
          }}
          style={{
            backgroundColor: accentColor,
            color: 'var(--primary-accent-foreground, #FFFFFF)',
            boxShadow: `0 4px 14px 0 ${accentColor}35`,
          }}
          className="quick-new-btn"
          title={t('action.new_transaction', 'Novo Lançamento')}
        >
          <div className="btn-icon">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="btn-label">
            {t('action.new_transaction', 'Novo')}
          </span>
        </button>

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

        {/* 4. Footer Action: Customize Menu */}
        <button
          type="button"
          onClick={() => setIsCustomizerOpen(true)}
          className="footer-action-btn"
          title={t('nav.customize_menu', 'Personalizar menu')}
        >
          <div className="btn-icon">
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </div>
          <span className="btn-label">
            {t('nav.customize_menu', 'Personalizar menu')}
          </span>
        </button>
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
