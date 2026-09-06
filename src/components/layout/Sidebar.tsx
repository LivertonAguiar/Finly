import React, { useState, useEffect } from 'react';
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
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
  const { user } = useFinancial();
  const { lang, t } = useTranslation();
  const [activeItemIds, setActiveItemIds] = useState<string[]>(getStoredSidebarItems);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [accentColor, setAccentColor] = useState<string>(() => user.accentColor || localStorage.getItem('plannerfin_accent_color') || '#7C4DFF');

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
        const saved = localStorage.getItem('plannerfin_accent_color');
        if (saved) setAccentColor(saved);
      }
    };
    window.addEventListener('plannerfin_theme_changed', handleThemeChange);
    return () => window.removeEventListener('plannerfin_theme_changed', handleThemeChange);
  }, [user.accentColor]);

  // Listen to sidebar changes from customizer or other tabs
  useEffect(() => {
    const handleSidebarChange = () => {
      setActiveItemIds(getStoredSidebarItems());
    };
    window.addEventListener('plannerfin_sidebar_changed', handleSidebarChange);
    return () => window.removeEventListener('plannerfin_sidebar_changed', handleSidebarChange);
  }, []);

  const itemMap = new Map(ALL_SIDEBAR_ITEMS.map(item => [item.id, item]));

  // Build the list of active navigation items in user-defined order
  const customNavItems: SidebarItemDef[] = activeItemIds
    .map(id => itemMap.get(id))
    .filter((item): item is SidebarItemDef => !!item);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-[#1C1C1E] border-r border-slate-200 dark:border-slate-800/80 z-50 md:z-30 transition-[width,transform] duration-300 ease-in-out flex flex-col justify-between shrink-0 overflow-x-hidden ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Top Section */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Brand & Toggle */}
          <div
            className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 transition-all"
            style={{
              paddingTop: 'max(1rem, calc(1rem + max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px))))',
              height: 'calc(4rem + max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px)))',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 overflow-hidden cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <FinlyLogo size="md" showText={!collapsed} />
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Action: Novo (Positioned above Dashboard) */}
          <div className="p-3 pb-1.5">
            <button
              onClick={onOpenNewTransaction}
              title={collapsed ? t('action.new_transaction', 'Novo') : undefined}
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 14px 0 ${accentColor}35`,
              }}
              className={`w-full py-3 rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all duration-300 cursor-pointer hover:brightness-110 active:scale-[0.98] overflow-hidden ${
                collapsed ? 'px-0' : 'px-3.5 gap-2'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                  collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-xs opacity-100'
                }`}
              >
                {t('action.new_transaction', 'Novo')}
              </span>
            </button>
          </div>

          {/* Nav Items (Customized Order & Reactive Localization) */}
          <nav className="p-3 pt-1 space-y-1">
            {customNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const translatedLabel = getSidebarItemLabel(item.id, lang);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  title={collapsed ? translatedLabel : undefined}
                  style={
                    isActive
                      ? {
                          color: accentColor,
                          backgroundColor: `${accentColor}1A`,
                          borderColor: `${accentColor}33`,
                        }
                      : undefined
                  }
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-0' : 'justify-start px-3.5'
                  } py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden group border border-transparent ${
                    isActive
                      ? 'shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#2C2C2E]'
                  }`}
                >
                  <Icon
                    style={isActive ? { color: accentColor } : undefined}
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? '' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                      collapsed
                        ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none'
                        : 'max-w-xs opacity-100 translate-x-0 ml-3'
                    }`}
                  >
                    {translatedLabel}
                  </span>
                </button>
              );
            })}

            {/* Always accessible: Mais Opções */}
            <button
              onClick={() => {
                setActiveTab('mais');
                setMobileOpen(false);
              }}
              title={collapsed ? t('nav.more', 'Mais opções') : undefined}
              style={
                activeTab === 'mais'
                  ? {
                      color: accentColor,
                      backgroundColor: `${accentColor}1A`,
                      borderColor: `${accentColor}33`,
                    }
                  : undefined
              }
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-0' : 'justify-start px-3.5'
              } py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden group border border-transparent ${
                activeTab === 'mais'
                  ? 'shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#2C2C2E]'
              }`}
            >
              <MoreHorizontal
                style={activeTab === 'mais' ? { color: accentColor } : undefined}
                className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  activeTab === 'mais' ? '' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                  collapsed
                    ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none'
                    : 'max-w-xs opacity-100 translate-x-0 ml-3'
                }`}
              >
                {t('nav.more', 'Mais opções')}
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Customizer Quick Trigger */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            title={collapsed ? t('nav.customize_menu', 'Personalizar menu') : undefined}
            className="w-full flex items-center justify-start px-3.5 py-2.5 rounded-2xl text-[11px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0 transition-transform group-hover:rotate-45" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                collapsed
                  ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none'
                  : 'max-w-xs opacity-100 translate-x-0 ml-3'
              }`}
            >
              {t('nav.customize_menu', 'Personalizar menu')}
            </span>
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


