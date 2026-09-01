import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface MonthPickerPopoverProps {
  selectedDate: Date;
  onChangeMonth: (targetDate: Date) => void;
  className?: string;
}

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const MONTH_ABBRS = [
  'JAN', 'FEV', 'MAR', 'ABR',
  'MAI', 'JUN', 'JUL', 'AGO',
  'SET', 'OUT', 'NOV', 'DEZ'
];

export const MonthPickerPopover: React.FC<MonthPickerPopoverProps> = ({
  selectedDate,
  onChangeMonth,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(selectedDate.getFullYear());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync internal year when selectedDate changes
  useEffect(() => {
    setPickerYear(selectedDate.getFullYear());
  }, [selectedDate, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentMonthName = MONTH_NAMES[selectedDate.getMonth()] || 'mês';

  const handleSelectMonth = (monthIndex: number) => {
    const newDate = new Date(pickerYear, monthIndex, 1);
    onChangeMonth(newDate);
    setIsOpen(false);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setPickerYear(now.getFullYear());
    onChangeMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setIsOpen(false);
  };

  const isSelected = (monthIndex: number) => {
    return (
      selectedDate.getFullYear() === pickerYear &&
      selectedDate.getMonth() === monthIndex
    );
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-2 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm flex items-center gap-2.5 shadow-sm dark:shadow-md hover:bg-slate-50 dark:hover:bg-[#343437] hover:border-purple-500/40 transition-all cursor-pointer active:scale-95 group"
      >
        <span className="lowercase font-bold tracking-wide">{currentMonthName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''
          }`}
        />
      </button>

      {/* Popover Content */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 w-72 sm:w-80 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {/* Header with Purple Background and Year Navigation */}
          <div className="bg-purple-600 px-6 py-3.5 flex items-center justify-between select-none">
            <button
              type="button"
              onClick={() => setPickerYear(prev => prev - 1)}
              className="p-1 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors cursor-pointer active:scale-90"
              title="Ano anterior"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <span className="text-base font-black text-white tracking-widest">
              {pickerYear}
            </span>

            <button
              type="button"
              onClick={() => setPickerYear(prev => prev + 1)}
              className="p-1 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors cursor-pointer active:scale-90"
              title="Próximo ano"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Month Grid (4 columns x 3 rows) */}
          <div className="p-6 pb-3 grid grid-cols-4 gap-y-5 gap-x-2">
            {MONTH_ABBRS.map((abbr, index) => {
              const active = isSelected(index);
              return (
                <button
                  key={abbr}
                  type="button"
                  onClick={() => handleSelectMonth(index)}
                  className={`py-2 rounded-xl text-xs font-black tracking-wider transition-all duration-150 cursor-pointer ${
                    active
                      ? 'text-purple-600 dark:text-purple-400 font-black scale-105'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {abbr}
                </button>
              );
            })}
          </div>

          {/* Seamless Unified Footer with Actions */}
          <div className="px-6 pt-2 pb-5 flex items-center justify-between select-none">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-xs font-black tracking-wider uppercase transition-colors cursor-pointer active:scale-95"
            >
              CANCELAR
            </button>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-xs font-black tracking-wider uppercase transition-colors cursor-pointer active:scale-95"
            >
              MÊS ATUAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
