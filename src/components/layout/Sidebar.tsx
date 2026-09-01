import React from 'react';
import {
  Calendar as CalendarIcon,
  Home,
  Building2,
  List,
  CreditCard,
  Flag,
  BarChart3,
  Settings,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { FinlyLogo } from '../ui/FinlyLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenNewTransaction: () => void;
  onOpenPwaModal: () => void;
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'contas', label: 'Contas', icon: Building2 },
    { id: 'transacoes', label: 'Transações', icon: List },
    { id: 'cartoes', label: 'Cartões de crédito', icon: CreditCard },
    { id: 'planejamento', label: 'Planejamento', icon: Flag },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'calendario', label: 'Calendário', icon: CalendarIcon },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'mais', label: 'Mais opções', icon: MoreHorizontal },
  ];

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
        {/* Brand & Toggle */}
        <div>
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 h-16">
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

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-0' : 'justify-start px-3.5'
                  } py-3 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer overflow-hidden group ${
                    isActive
                      ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#2C2C2E]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                      collapsed
                        ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none'
                        : 'max-w-xs opacity-100 translate-x-0 ml-3'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quick Action */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={onOpenNewTransaction}
            title={collapsed ? 'Novo Lançamento' : undefined}
            className={`w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/25 flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
              collapsed ? 'px-0' : 'px-3 gap-2'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3] shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-xs opacity-100'
              }`}
            >
              Novo Lançamento
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
