import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  min?: string;
  showPresets?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  required,
  min,
  showPresets = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial or fallback date
  const parsedDate = value ? new Date(value + 'T12:00:00') : new Date();
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear() || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth() ?? new Date().getMonth());

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Synchronize view state when value prop changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Format display text
  const formatDisplayDate = (isoStr: string) => {
    if (!isoStr) return 'Selecione a data limite';
    const [y, m, d] = isoStr.split('-');
    if (!y || !m || !d) return isoStr;
    const monthName = MONTH_NAMES[parseInt(m, 10) - 1];
    return `${parseInt(d, 10)} de ${monthName} de ${y}`;
  };

  // Calendar Calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 6 = Sat

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

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const isoString = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(isoString);
    setIsOpen(false);
  };

  // Quick Preset Handlers
  const currentYear = new Date().getFullYear();
  const setPreset = (type: 'end_year' | '6_months' | '1_year' | '2_years' | 'today') => {
    const today = new Date();
    let target = new Date();

    if (type === 'today') {
      target = today;
    } else if (type === 'end_year') {
      target = new Date(currentYear, 11, 31);
    } else if (type === '6_months') {
      target.setMonth(today.getMonth() + 6);
    } else if (type === '1_year') {
      target.setFullYear(today.getFullYear() + 1);
    } else if (type === '2_years') {
      target.setFullYear(today.getFullYear() + 2);
    }

    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    onChange(iso);
    setViewYear(y);
    setViewMonth(target.getMonth());
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return value === `${viewYear}-${formattedMonth}-${formattedDay}`;
  };

  const isToday = (day: number) => {
    const now = new Date();
    return (
      now.getDate() === day &&
      now.getMonth() === viewMonth &&
      now.getFullYear() === viewYear
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121214] text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all cursor-pointer group select-none shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span className={value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
            {formatDisplayDate(value)}
          </span>
        </div>
        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800/40">
          Alterar
        </span>
      </button>

      {/* Quick Presets Bar */}
      {showPresets && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setPreset('end_year')}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-[#18181B] hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 transition-all shrink-0 cursor-pointer"
          >
            Fim de {currentYear}
          </button>
          <button
            type="button"
            onClick={() => setPreset('6_months')}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-[#18181B] hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 transition-all shrink-0 cursor-pointer"
          >
            Em 6 Meses
          </button>
          <button
            type="button"
            onClick={() => setPreset('1_year')}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-[#18181B] hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 transition-all shrink-0 cursor-pointer"
          >
            Em 1 Ano
          </button>
          <button
            type="button"
            onClick={() => setPreset('2_years')}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-[#18181B] hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 transition-all shrink-0 cursor-pointer"
          >
            Em 2 Anos
          </button>
        </div>
      )}

      {/* Popover Custom Dark Calendar */}
      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 left-0 right-0 sm:right-auto sm:w-80 p-4 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center font-black text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEK_DAYS.map((wd, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400 uppercase py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                    selected
                      ? 'bg-purple-600 text-white font-black shadow-md scale-105'
                      : today
                      ? 'border border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
                      : 'hover:bg-slate-100 dark:hover:bg-[#202024] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer with Today / Close */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setPreset('today')}
              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
