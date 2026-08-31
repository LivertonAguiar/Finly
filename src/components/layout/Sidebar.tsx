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
        className={`fixed top-0 left-0 h-full bg-white dark:bg-[#1C1C1E] border-r border-slate-200 dark:border-slate-800/80 z-50 transition-all duration-300 flex flex-col justify-between ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand & Toggle */}
        <div>
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20 shrink-0">F</div>
              {!collapsed && (
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tight truncate">
                  Fin<span className="text-emerald-500">ly</span>
                </span>
              )}
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#2C2C2E]'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quick Action */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <button
            onClick={onOpenNewTransaction}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {!collapsed && <span>Novo Lançamento</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
