import React, { useRef, useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  SYSTEM_COLORS,
  SystemColor,
  getContrastColor,
  isLightColor,
  isDarkColor,
} from '../../utils/colorPaletteCatalog';

interface ColorScrollPickerProps {
  selectedColor: string;
  onChange: (hex: string) => void;
  label?: string;
  showCustom?: boolean;
  compact?: boolean;
  className?: string;
}

export const ColorScrollPicker: React.FC<ColorScrollPickerProps> = ({
  selectedColor,
  onChange,
  label,
  showCustom = true,
  compact = false,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const groups = useMemo(() => {
    const list: string[] = ['all'];
    SYSTEM_COLORS.forEach(c => {
      if (!list.includes(c.group)) list.push(c.group);
    });
    return list;
  }, []);

  const filteredColors = useMemo(() => {
    if (selectedGroup === 'all') return SYSTEM_COLORS;
    return SYSTEM_COLORS.filter(c => c.group === selectedGroup);
  }, [selectedGroup]);

  const safeSelected = (selectedColor || '#7C4DFF').toLowerCase();

  const activeColorObj = useMemo(() => {
    const safeHex = selectedColor || '#7C4DFF';
    return (
      SYSTEM_COLORS.find(c => c.hex.toLowerCase() === safeHex.toLowerCase()) || {
        hex: safeHex,
        name: 'Personalizada',
        group: 'Personalizada',
      }
    );
  }, [selectedColor]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = compact ? 180 : 260;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  // Scroll to active color on initial render or when changing group
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedGroup]);

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {label && (
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
              {label}
            </span>
          )}

          {/* Active Color Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs">
            <span
              className={`w-3 h-3 rounded-full shrink-0 shadow-xs ${
                isLightColor(activeColorObj.hex)
                  ? 'border border-black/20'
                  : isDarkColor(activeColorObj.hex)
                  ? 'border border-white/40 ring-1 ring-white/10'
                  : 'border border-white/20'
              }`}
              style={{ backgroundColor: activeColorObj.hex }}
            />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {activeColorObj.name}
            </span>
            <span className="text-[9px] font-mono text-slate-400 uppercase">
              {activeColorObj.hex}
            </span>
          </div>
        </div>

        {/* Navigation Buttons (< / >) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Rolar para a esquerda"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Rolar para a direita"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      {!compact && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
          {groups.map(g => {
            const isAll = g === 'all';
            const isActive = selectedGroup === g;
            const labelText = isAll ? `Todas (${SYSTEM_COLORS.length})` : g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGroup(g)}
                style={isActive ? {
                  backgroundColor: 'var(--primary-accent, #7C4DFF)',
                  color: 'var(--primary-accent-foreground, #FFFFFF)',
                } : undefined}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'shadow-xs font-black ring-1 ring-white/20'
                    : 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold'
                }`}
              >
                {labelText}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Horizontal Scroll Picker Track */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 snap-x snap-mandatory no-scrollbar scroll-smooth"
      >
        {filteredColors.map(colorItem => {
          const isSelected = safeSelected === colorItem.hex.toLowerCase();
          const contrastText = getContrastColor(colorItem.hex);
          const isLight = isLightColor(colorItem.hex);
          const isDark = isDarkColor(colorItem.hex);

          return (
            <button
              key={colorItem.hex}
              type="button"
              data-selected={isSelected}
              onClick={() => onChange(colorItem.hex)}
              className={`snap-start shrink-0 flex items-center gap-2 rounded-2xl border-2 transition-all cursor-pointer ${
                compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
              } ${
                isSelected
                  ? 'border-purple-600 ring-2 ring-purple-600/30 shadow-xs bg-purple-50/20 dark:bg-purple-950/30 scale-[1.02]'
                  : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1E1E22] hover:border-slate-300 dark:hover:border-white/20'
              }`}
              title={`${colorItem.name} (${colorItem.hex}) - ${colorItem.group}`}
            >
              {/* Color Swatch with contrast border and checkmark */}
              <span
                className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center shadow-xs transition-transform ${
                  isLight
                    ? 'border border-black/25'
                    : isDark
                    ? 'border border-white/40 ring-1 ring-white/10'
                    : 'border border-white/20'
                }`}
                style={{ backgroundColor: colorItem.hex }}
              >
                {isSelected && (
                  <Check
                    className="w-3 h-3 stroke-[3]"
                    style={{ color: contrastText }}
                  />
                )}
              </span>

              {/* Color Metadata */}
              <div className="flex flex-col text-left min-w-[70px]">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {colorItem.name}
                </span>
                <span className="text-[9.5px] font-mono font-bold text-slate-500 dark:text-slate-300 uppercase leading-none mt-0.5">
                  {colorItem.hex}
                </span>
              </div>
            </button>
          );
        })}

        {/* Custom Color Native Picker */}
        {showCustom && (
          <div className="snap-start shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-white/[0.03]">
            <input
              type="color"
              value={selectedColor && selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#7C4DFF'}
              onChange={e => onChange(e.target.value)}
              className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-0 p-0"
              title="Personalizar cor via seletor nativo"
            />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
              Custom
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

