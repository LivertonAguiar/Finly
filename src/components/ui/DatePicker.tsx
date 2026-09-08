import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { formatLocalDateISO, getTodayString } from '../../utils/formatters';

export interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  min?: string;
  max?: string;
  showPresets?: boolean;
  variant?: 'compact' | 'modal';
  placeholder?: string;
  className?: string;
  customTrigger?: (toggle: () => void, isOpen: boolean) => React.ReactNode;
}

const MONTH_NAMES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const WEEK_DAYS_HEADER = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEK_DAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  required,
  min,
  max,
  showPresets = true,
  variant = 'compact',
  placeholder = 'Selecione a data',
  className = '',
  customTrigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'calendar' | 'month' | 'year'>('calendar');
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parsed active date
  const parsedDate = value ? new Date(value + 'T12:00:00') : new Date();
  const initialYear = !isNaN(parsedDate.getFullYear()) ? parsedDate.getFullYear() : new Date().getFullYear();
  const initialMonth = !isNaN(parsedDate.getMonth()) ? parsedDate.getMonth() : new Date().getMonth();
  const initialDay = !isNaN(parsedDate.getDate()) ? parsedDate.getDate() : new Date().getDate();

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  // Sync internal view when value prop updates
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen && variant === 'compact') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, variant]);

  // Escape key to close picker without bubbling to parent modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  // Format date display: "01/09/2026" or "01 de set de 2026"
  const formatDisplay = (isoStr: string) => {
    if (!isoStr) return placeholder;
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  };

  const getFullDisplay = (isoStr: string) => {
    if (!isoStr) return placeholder;
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const [y, m, d] = parts;
    const mIdx = parseInt(m, 10) - 1;
    return `${parseInt(d, 10)} de ${MONTH_NAMES_SHORT[mIdx]?.toLowerCase()} de ${y}`;
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDate = (year: number, month: number, day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const isoString = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const setPreset = (preset: 'today' | 'yesterday' | 'tomorrow') => {
    const d = new Date();
    if (preset === 'yesterday') d.setDate(d.getDate() - 1);
    if (preset === 'tomorrow') d.setDate(d.getDate() + 1);
    const iso = formatLocalDateISO(d);
    onChange(iso);
    setIsOpen(false);
  };

  const todayStr = getTodayString();
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 30 }, (_, idx) => currentYear - 10 + idx);

  // Render Calendar Grid
  const renderCalendarContent = () => (
    <div className="space-y-3 select-none">
      {/* 1. Header: < Mês Ano > & Mode Toggle */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPickerMode(pickerMode === 'month' ? 'calendar' : 'month')}
            className="px-2 py-1 rounded-lg text-xs font-black text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>{MONTH_NAMES_FULL[viewMonth]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setPickerMode(pickerMode === 'year' ? 'calendar' : 'year')}
            className="px-2 py-1 rounded-lg text-xs font-black text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>{viewYear}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Próximo mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Month Selector Mode */}
      {pickerMode === 'month' && (
        <div className="grid grid-cols-3 gap-1.5 py-2 animate-in fade-in">
          {MONTH_NAMES_SHORT.map((mName, idx) => {
            const isSelectedMonth = idx === viewMonth;
            return (
              <button
                key={mName}
                type="button"
                onClick={() => {
                  setViewMonth(idx);
                  setPickerMode('calendar');
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelectedMonth
                    ? 'bg-purple-600 text-white font-black shadow-sm shadow-purple-600/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                {mName}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Year Selector Mode */}
      {pickerMode === 'year' && (
        <div className="grid grid-cols-3 gap-1.5 py-2 max-h-48 overflow-y-auto pr-1 animate-in fade-in scrollbar-thin">
          {yearsList.map(yr => {
            const isSelectedYear = yr === viewYear;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setViewYear(yr);
                  setPickerMode('calendar');
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelectedYear
                    ? 'bg-purple-600 text-white font-black shadow-sm shadow-purple-600/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                {yr}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Days Grid Mode */}
      {pickerMode === 'calendar' && (
        <>
          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK_DAYS_HEADER.map((wd, i) => (
              <span
                key={i}
                className="text-[11px] font-black text-slate-400 dark:text-slate-500 py-0.5"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Prev month trailing days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const dayNum = daysInPrevMonth - firstDayOfWeek + i + 1;
              const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
              const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
              return (
                <button
                  key={`prev-${i}`}
                  type="button"
                  onClick={() => handleSelectDate(prevY, prevM, dayNum)}
                  className="h-8 w-8 mx-auto rounded-xl text-xs font-medium text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  {dayNum}
                </button>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDate(viewYear, viewMonth, dayNum)}
                  className={`h-8 w-8 mx-auto rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer relative ${
                    isSelected
                      ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/30 scale-105 z-10'
                      : isToday
                      ? 'border border-purple-500 text-purple-600 dark:text-purple-400 font-black hover:bg-purple-50 dark:hover:bg-purple-950/40'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300'
                  }`}
                >
                  <span>{dayNum}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-purple-500 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Presets Bar */}
          {showPresets && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPreset('today')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setPreset('yesterday')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
              >
                Ontem
              </button>
              <button
                type="button"
                onClick={() => setPreset('tomorrow')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
              >
                Amanhã
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* TRIGGER BUTTON (COMPACT FORM INPUT OR CUSTOM TRIGGER) */}
      {customTrigger ? (
        customTrigger(() => {
          setPickerMode('calendar');
          setIsOpen(previous => !previous);
        }, isOpen)
      ) : (
        <button
          type="button"
          onClick={() => {
            setPickerMode('calendar');
            setIsOpen(previous => !previous);
          }}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer select-none shadow-xs text-left ${
            isOpen
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white dark:bg-[#1E1E22]'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-400 dark:hover:border-purple-500'
          } text-slate-800 dark:text-slate-100`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors shrink-0" />
            <span className="truncate">{formatDisplay(value)}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
            {value === todayStr ? 'Hoje' : ''}
          </span>
        </button>
      )}

      {/* FLOATING POPOVER DROPDOWN (COMPACT VARIANT) */}
      {isOpen && variant === 'compact' && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Calendário"
          className="absolute z-50 left-0 sm:left-auto sm:right-0 mt-2 w-72 p-3.5 rounded-2xl bg-white dark:bg-[#1C1C20] border border-slate-200/90 dark:border-slate-700/80 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {renderCalendarContent()}
        </div>
      )}

      {/* MODAL DIALOG VARIANT (FOR FULLSCREEN / MODALS / MOBILE) */}
      {isOpen && variant === 'modal' && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            style={{
              paddingTop: 'max(16px, env(safe-area-inset-top, 16px), var(--safe-area-inset-top, 16px))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px), var(--safe-area-inset-bottom, 16px))',
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Selecionar data"
              className="w-full max-w-[340px] rounded-3xl bg-white dark:bg-[#1C1C20] text-slate-900 dark:text-white shadow-2xl border border-slate-200/90 dark:border-slate-700/80 overflow-hidden animate-in zoom-in-95 duration-200 p-4 select-none cursor-default"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-3 bg-slate-50 dark:bg-[#252528] rounded-2xl mb-3 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                    Data Selecionada
                  </span>
                  <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                    {formatDisplay(value)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                  aria-label="Fechar calendário"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {renderCalendarContent()}

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const d = getTodayString();
                    onChange(d);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all shadow-xs shadow-purple-600/30 cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
