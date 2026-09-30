import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

export interface OptionPickerItem<T = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface OptionPickerProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: OptionPickerItem<T>[];
  title?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  searchable?: boolean;
  accentColor?: 'purple' | 'emerald';
}

const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function OptionPicker<T extends string | number = string>({
  value,
  onChange,
  options = [],
  title = 'Selecione uma opção',
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  disabled = false,
  className = '',
  searchable,
  accentColor = 'purple',
}: OptionPickerProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const selectedOption = useMemo(
    () => options.find(opt => String(opt.value) === String(value)),
    [options, value]
  );

  const shouldShowSearch = searchable !== undefined ? searchable : options.length > 5;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    if (!normalizedQuery) return options;
    return options.filter(opt => {
      const matchLabel = normalizeSearch(opt.label).includes(normalizedQuery);
      const matchSublabel = opt.sublabel ? normalizeSearch(opt.sublabel).includes(normalizedQuery) : false;
      return matchLabel || matchSublabel;
    });
  }, [options, query]);

  const openPicker = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const closePicker = () => {
    setIsOpen(false);
    setQuery('');
  };

  const handleSelect = (val: T) => {
    onChange(val);
    closePicker();
  };

  // Trava scroll da tela de fundo quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      // Foca na busca se disponível
      const timer = setTimeout(() => {
        if (shouldShowSearch && searchInputRef.current) {
          searchInputRef.current.focus();
        } else if (selectedItemRef.current) {
          selectedItemRef.current.scrollIntoView({ block: 'nearest' });
        }
      }, 100);

      return () => {
        document.body.style.overflow = originalStyle;
        clearTimeout(timer);
      };
    }
  }, [isOpen, shouldShowSearch]);

  // Fecha no Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePicker();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const activeRadioClasses =
    accentColor === 'emerald'
      ? 'border-emerald-500 bg-emerald-500/10'
      : 'border-purple-500 bg-purple-500/10';

  const activeDotClasses =
    accentColor === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500';

  const activeItemBorder =
    accentColor === 'emerald'
      ? 'border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30'
      : 'border-purple-500/40 bg-purple-50/70 dark:bg-purple-950/30';

  return (
    <>
      {/* Botão de Disparo Integrado ao Formulário */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={openPicker}
        className={`w-full min-h-11 px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 ${
          isOpen
            ? 'border-purple-500 ring-2 ring-purple-500/15 bg-white dark:bg-slate-800'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
        } ${
          disabled
            ? 'opacity-55 cursor-not-allowed'
            : 'cursor-pointer hover:border-purple-400 dark:hover:border-purple-600'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-sm bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              {selectedOption.icon}
            </span>
          )}
          <div className="min-w-0 flex-1 truncate">
            {selectedOption ? (
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                <span className="truncate">{selectedOption.label}</span>
                {selectedOption.sublabel && (
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-400 shrink-0">
                    {selectedOption.sublabel}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-purple-500' : ''
          }`}
        />
      </button>

      {/* Modal / Bottom Sheet renderizado no DOM do App */}
      {isOpen &&
        !disabled &&
        createPortal(
          <div className="fixed inset-0 z-[230] flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop com desfoque */}
            <button
              type="button"
              aria-label="Fechar seletor"
              onClick={closePicker}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
            />

            {/* Container Bottom Sheet no Mobile / Modal central no Desktop */}
            <div className="relative w-full sm:max-w-md max-h-[82dvh] bg-white dark:bg-[#18181B] rounded-t-[28px] sm:rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
              {/* Cabeçalho */}
              <div className="px-4 pt-3 pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                {/* Puxador touch (mobile) */}
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto mb-3 sm:hidden" />

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {options.length} {options.length === 1 ? 'opção disponível' : 'opções disponíveis'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closePicker}
                    aria-label="Fechar"
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Campo de Busca Rápida */}
                {shouldShowSearch && (
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full h-10 pl-9 pr-9 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 transition-all"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        aria-label="Limpar busca"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Lista de Opções Estilizada */}
              <div
                role="listbox"
                aria-label={title}
                data-scrollable
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1.5 bg-slate-50/70 dark:bg-slate-950/30 scrollbar-thin"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
              >
                {filteredOptions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    Nenhuma opção encontrada para "{query}".
                  </div>
                ) : (
                  filteredOptions.map(opt => {
                    const isSelected = String(opt.value) === String(value);

                    return (
                      <button
                        key={String(opt.value)}
                        ref={isSelected ? selectedItemRef : null}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={opt.disabled}
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 text-left border transition-all cursor-pointer ${
                          isSelected
                            ? `${activeItemBorder} shadow-sm`
                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-white/60 dark:bg-slate-900/50'
                        } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {opt.icon && (
                            <span className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-base bg-slate-100 dark:bg-slate-800">
                              {opt.icon}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <span
                              className={`block text-sm font-semibold truncate ${
                                isSelected
                                  ? 'text-purple-600 dark:text-purple-300'
                                  : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {opt.label}
                            </span>
                            {opt.sublabel && (
                              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {opt.sublabel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Indicador de Rádio Estilizado no Design System */}
                        <div className="shrink-0 pl-2">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? activeRadioClasses
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && (
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${activeDotClasses} animate-in zoom-in-50 duration-150`}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
