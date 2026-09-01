import React from 'react';

export type CardViewMode = 'grid' | 'list';

export const GridBlocksIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4.5" y="4" width="6" height="16" rx="2" />
    <rect x="13.5" y="4" width="6" height="16" rx="2" />
  </svg>
);

export const ListRowsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="4.5" width="16" height="6" rx="2" />
    <rect x="4" y="13.5" width="16" height="6" rx="2" />
  </svg>
);

interface ViewModeToggleProps {
  mode: CardViewMode;
  onChange: (mode: CardViewMode) => void;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  mode,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center p-1 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-xs shrink-0 select-none ${className}`}
      role="group"
      aria-label="Alternar modo de visualização"
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          mode === 'grid'
            ? 'bg-slate-100 dark:bg-[#27272A] text-purple-600 dark:text-purple-400 shadow-xs'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202024]'
        }`}
        title="Visualização em Blocos"
        aria-label="Visualização em Blocos"
      >
        <GridBlocksIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => onChange('list')}
        className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          mode === 'list'
            ? 'bg-slate-100 dark:bg-[#27272A] text-purple-600 dark:text-purple-400 shadow-xs'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202024]'
        }`}
        title="Visualização em Lista"
        aria-label="Visualização em Lista"
      >
        <ListRowsIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
