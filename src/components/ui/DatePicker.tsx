import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  min?: string;
  showPresets?: boolean;
  className?: string;
}

const MONTH_NAMES_FULL = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const MONTH_NAMES_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

// Exact Portuguese Weekday headers matching the user's reference screenshot:
// Do, 2ª, 3ª, 4ª, 5ª, 6ª, Sá
const WEEK_DAYS_HEADER = ['Do', '2ª', '3ª', '4ª', '5ª', '6ª', 'Sá'];

const WEEK_DAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  required,
  min,
  showPresets = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'calendar' | 'month' | 'year'>('calendar');

  // Initial parsed date
  const parsedDate = value ? new Date(value + 'T12:00:00') : new Date();
  const initialYear = !isNaN(parsedDate.getFullYear()) ? parsedDate.getFullYear() : new Date().getFullYear();
  const initialMonth = !isNaN(parsedDate.getMonth()) ? parsedDate.getMonth() : new Date().getMonth();
  const initialDay = !isNaN(parsedDate.getDate()) ? parsedDate.getDate() : new Date().getDate();

  // Temporary selection inside dialog
  const [tempYear, setTempYear] = useState(initialYear);
  const [tempMonth, setTempMonth] = useState(initialMonth);
  const [tempDay, setTempDay] = useState(initialDay);

  // Sync with value prop
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        setTempYear(d.getFullYear());
        setTempMonth(d.getMonth());
        setTempDay(d.getDate());
      }
    }
  }, [value, isOpen]);

  // Open modal handler
  const handleOpen = () => {
    const d = value ? new Date(value + 'T12:00:00') : new Date();
    if (!isNaN(d.getTime())) {
      setTempYear(d.getFullYear());
      setTempMonth(d.getMonth());
      setTempDay(d.getDate());
    }
    setPickerMode('calendar');
    setIsOpen(true);
  };

  // Format header display: "qui, out 1"
  const getHeaderDateText = () => {
    const d = new Date(tempYear, tempMonth, tempDay, 12);
    const dayOfWeek = WEEK_DAYS_SHORT[d.getDay()];
    const monthShort = MONTH_NAMES_SHORT[tempMonth];
    return `${dayOfWeek}, ${monthShort} ${tempDay}`;
  };

  // Format trigger input display: "01 outubro 2026"
  const formatInputDisplay = (isoStr: string) => {
    if (!isoStr) return 'Selecione a data limite';
    const [y, m, d] = isoStr.split('-');
    if (!y || !m || !d) return isoStr;
    const monthIndex = parseInt(m, 10) - 1;
    const monthName = MONTH_NAMES_FULL[monthIndex] || m;
    const formattedDay = String(parseInt(d, 10)).padStart(2, '0');
    return `${formattedDay} ${monthName} ${y}`;
  };

  // Calendar Calculation for tempYear and tempMonth
  const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(tempYear, tempMonth, 1).getDay(); // 0 = Sun, 6 = Sat

  const prevMonth = () => {
    if (tempMonth === 0) {
      setTempMonth(11);
      setTempYear(prev => prev - 1);
    } else {
      setTempMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (tempMonth === 11) {
      setTempMonth(0);
      setTempYear(prev => prev + 1);
    } else {
      setTempMonth(prev => prev + 1);
    }
  };

  // When clicking a day in the calendar grid
  const handleSelectDay = (day: number) => {
    setTempDay(day);
  };

  // Confirm dialog selection
  const handleConfirm = () => {
    const formattedMonth = String(tempMonth + 1).padStart(2, '0');
    const formattedDay = String(tempDay).padStart(2, '0');
    const isoString = `${tempYear}-${formattedMonth}-${formattedDay}`;
    onChange(isoString);
    setIsOpen(false);
  };

  // Cancel dialog
  const handleCancel = () => {
    setIsOpen(false);
  };

  // Generate Year list for Year view (1990 - 2045)
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 45 }, (_, idx) => currentYear - 15 + idx);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* TRIGGER BUTTON (Matching Reference Input Field) */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121214] text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between hover:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer group select-none shadow-xs"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span className={value ? 'text-slate-900 dark:text-white capitalize' : 'text-slate-400'}>
            {formatInputDisplay(value)}
          </span>
        </div>
        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-800/40">
          Alterar
        </span>
      </button>

      {/* MATERIAL DESIGN DATEPICKER DIALOG MODAL */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleCancel}
        >
          <div
            className="w-full max-w-[320px] rounded-3xl bg-[#1c1c1e] text-white shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 select-none"
            onClick={e => e.stopPropagation()}
          >
            {/* 1. TOP HEADER (Year + Weekday / Month / Day) */}
            <div className="p-5 bg-[#252528] border-b border-white/5 space-y-1">
              <button
                type="button"
                onClick={() => setPickerMode(pickerMode === 'year' ? 'calendar' : 'year')}
                className={`text-xs font-bold transition-colors cursor-pointer block ${
                  pickerMode === 'year' ? 'text-purple-400 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tempYear}
              </button>

              <button
                type="button"
                onClick={() => setPickerMode('calendar')}
                className="text-2xl sm:text-3xl font-black text-white tracking-tight cursor-pointer block hover:text-purple-300 transition-colors capitalize"
              >
                {getHeaderDateText()}
              </button>
            </div>

            {/* 2. BODY CONTENT DEPENDING ON MODE */}
            <div className="p-4">
              {/* --- MODE: YEAR PICKER --- */}
              {pickerMode === 'year' && (
                <div className="h-64 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
                  <div className="grid grid-cols-3 gap-2">
                    {yearsList.map(yr => {
                      const isCurrYear = yr === tempYear;
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            setTempYear(yr);
                            setPickerMode('calendar');
                          }}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrYear
                              ? 'bg-purple-600 text-white font-black shadow-md scale-105'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- MODE: MONTH PICKER --- */}
              {pickerMode === 'month' && (
                <div className="h-64 flex flex-col justify-center">
                  <div className="grid grid-cols-3 gap-2">
                    {MONTH_NAMES_FULL.map((mName, idx) => {
                      const isCurrMonth = idx === tempMonth;
                      return (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => {
                            setTempMonth(idx);
                            setPickerMode('calendar');
                          }}
                          className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                            isCurrMonth
                              ? 'bg-purple-600 text-white font-black shadow-md scale-105'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {MONTH_NAMES_SHORT[idx]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- MODE: CALENDAR GRID --- */}
              {pickerMode === 'calendar' && (
                <div className="space-y-3">
                  {/* Month Navigation Bar: < outubro 2026 > */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Mês anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPickerMode('month')}
                      className="text-xs font-extrabold text-slate-200 hover:text-purple-400 transition-colors cursor-pointer capitalize flex items-center gap-1.5"
                    >
                      <span>{MONTH_NAMES_FULL[tempMonth]} {tempYear}</span>
                    </button>

                    <button
                      type="button"
                      onClick={nextMonth}
                      className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Próximo mês"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekday Names Header (Do, 2ª, 3ª, 4ª, 5ª, 6ª, Sá) */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEK_DAYS_HEADER.map((wd, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-bold text-slate-400 uppercase py-0.5"
                      >
                        {wd}
                      </span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty padding before day 1 */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-8 w-8" />
                    ))}

                    {/* Actual month days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const isSelected = dayNum === tempDay;
                      const now = new Date();
                      const isCurrentToday =
                        now.getDate() === dayNum &&
                        now.getMonth() === tempMonth &&
                        now.getFullYear() === tempYear;

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => handleSelectDay(dayNum)}
                          className={`h-8 w-8 mx-auto rounded-full text-xs font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                            isSelected
                              ? 'bg-purple-600 text-white font-black shadow-md scale-105'
                              : isCurrentToday
                              ? 'border border-purple-400 text-purple-400 font-black'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. BOTTOM ACTIONS (CANCELAR / OK) */}
            <div className="p-4 pt-2 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-xs font-black text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-xs font-black text-white transition-all uppercase tracking-wider shadow-sm cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
