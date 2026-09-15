import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { Subcategory } from '../../types';

interface SubcategoryPickerProps {
  value?: string;
  onChange: (value: string) => void;
  subcategories?: Subcategory[];
  disabled?: boolean;
  emptyLabel?: string;
}

const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const SubcategoryPicker: React.FC<SubcategoryPickerProps> = ({
  value = '',
  onChange,
  subcategories = [],
  disabled = false,
  emptyLabel = 'Nenhuma subcategoria',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = subcategories.find(subcategory => subcategory.id === value);

  const filteredSubcategories = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    if (!normalizedQuery) return subcategories;
    return subcategories.filter(subcategory =>
      normalizeSearch(`${subcategory.icon || ''} ${subcategory.name}`).includes(normalizedQuery),
    );
  }, [query, subcategories]);

  const closePicker = () => {
    setIsOpen(false);
    setQuery('');
  };

  const selectSubcategory = (subcategoryId: string) => {
    onChange(subcategoryId);
    closePicker();
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(open => !open)}
        className={`w-full min-h-11 px-3 py-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
          isOpen
            ? 'border-purple-500 ring-2 ring-purple-500/15 bg-white dark:bg-slate-800'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
        } ${disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer hover:border-purple-300 dark:hover:border-purple-700'}`}
      >
        <span className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-base ${
          selected
            ? 'bg-purple-100 dark:bg-purple-950/70'
            : 'bg-slate-100 dark:bg-slate-700/70 text-slate-400'
        }`}>
          {selected?.icon || '•'}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm leading-snug font-bold whitespace-normal ${
            selected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {disabled ? 'Selecione primeiro a categoria' : selected?.name || emptyLabel}
          </span>
          {!disabled && subcategories.length > 0 && (
            <span className="block mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {subcategories.length} {subcategories.length === 1 ? 'opção disponível' : 'opções disponíveis'}
            </span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && createPortal(
        <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center sm:p-4">
          <button
            type="button"
            aria-label="Fechar seletor de subcategoria"
            onClick={closePicker}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          />
          <div className="relative w-full sm:max-w-lg max-h-[82dvh] bg-white dark:bg-[#18181B] rounded-t-[28px] sm:rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="px-4 pt-3 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Escolher subcategoria</h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {subcategories.length} {subcategories.length === 1 ? 'opção disponível' : 'opções disponíveis'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePicker}
                  aria-label="Fechar"
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {subcategories.length > 6 && (
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Buscar subcategoria"
                    className="w-full h-11 pl-9 pr-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Limpar busca"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div
              role="listbox"
              aria-label="Subcategorias"
              data-scrollable
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1.5 bg-slate-50/80 dark:bg-slate-950/40 scrollbar-thin"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
              {!query && (
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={() => selectSubcategory('')}
                  className={`w-full min-h-[52px] px-3 py-2.5 rounded-xl flex items-center gap-3 text-left border transition-colors ${
                    !value
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/45 text-purple-700 dark:text-purple-300'
                      : 'border-transparent bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/70 flex items-center justify-center text-slate-400 shrink-0">—</span>
                  <span className="flex-1 text-sm font-bold">{emptyLabel}</span>
                  {!value && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />}
                </button>
              )}

              {filteredSubcategories.map(subcategory => {
                const isSelected = subcategory.id === value;
                return (
                  <button
                    key={subcategory.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectSubcategory(subcategory.id)}
                    className={`w-full min-h-[52px] px-3 py-2.5 rounded-xl flex items-center gap-3 text-left border transition-colors ${
                      isSelected
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/45 text-purple-800 dark:text-purple-200'
                        : 'border-transparent bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-purple-200 dark:hover:border-purple-900/70'
                    }`}
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      isSelected ? 'bg-purple-100 dark:bg-purple-900/60' : 'bg-slate-100 dark:bg-slate-700/70'
                    }`}>
                      {subcategory.icon || '•'}
                    </span>
                    <span className="min-w-0 flex-1 text-sm leading-snug font-bold whitespace-normal break-words">
                      {subcategory.name}
                    </span>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}

              {filteredSubcategories.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Nenhuma subcategoria encontrada</p>
                  <p className="mt-1 text-xs text-slate-400">Tente outro termo de busca.</p>
                </div>
              )}
            </div>

            <div className="px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom,12px))] border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#18181B] shrink-0 flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Exibindo {filteredSubcategories.length} de {subcategories.length}</span>
              <button type="button" onClick={closePicker} className="px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black">
                Concluir
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
