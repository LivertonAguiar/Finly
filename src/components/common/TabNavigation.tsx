import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}) => {
  // Abas com até 4 itens dividem a largura proporcionalmente (ex: 2 abas = 50% cada, 3 abas = 33.3% cada)
  const isProportional = tabs.length <= 4;

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`flex items-center justify-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] shadow-xs select-none ${
        isProportional ? 'w-full' : 'max-w-full overflow-x-auto no-scrollbar'
      } ${className}`}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={isActive ? { color: 'var(--primary-accent, #7C4DFF)' } : undefined}
            className={`flex items-center justify-center gap-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              isProportional ? 'flex-1 min-w-0 text-center' : 'shrink-0'
            } ${
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 sm:px-4 py-2 text-xs sm:text-sm'
            } ${
              isActive
                ? 'bg-white dark:bg-[#1E1E24] shadow-xs border border-slate-200/80 dark:border-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.02]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={
                  isActive
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--primary-accent, #7C4DFF) 15%, transparent)',
                        color: 'var(--primary-accent, #7C4DFF)',
                      }
                    : undefined
                }
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                  isActive
                    ? ''
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
