import React, { useState, useRef, useEffect } from 'react';
import {
  Filter,
  Calendar,
  Users,
  Building2,
  Tag,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  CheckCircle2,
  Clock,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { Category, Account, CreditCard as CreditCardType, UserProfile } from '../../types';
import { BankLogo, CardBrandLogo } from '../../utils/bankLogos';
import { DatePicker } from './DatePicker';

export interface FilterState {
  period?: string; // 'current_month' | 'today' | 'week' | 'last_30_days' | 'prev_month' | 'next_month' | 'current_year' | 'custom' | string;
  customStartDate?: string;
  customEndDate?: string;
  selectedUserIds?: string[];
  selectedAccountIds?: string[];
  selectedCardIds?: string[];
  selectedCategoryIds?: string[];
  status?: 'all' | 'completed' | 'pending' | 'ignored';
  type?: 'all' | 'expense' | 'income' | 'transfer';
  assetType?: 'all' | 'fixed' | 'stocks' | 'fiis' | 'crypto' | 'funds' | 'other';
}

interface FilterPopoverProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  categories?: Category[];
  accounts?: Account[];
  cards?: CreditCardType[];
  users?: Array<{ id: string; name: string; email?: string; avatarUrl?: string }>;
  currentUser?: UserProfile;
  showPeriod?: boolean;
  showUser?: boolean;
  showAccounts?: boolean;
  showCards?: boolean;
  showCategories?: boolean;
  showStatus?: boolean;
  showType?: boolean;
  showAssetType?: boolean;
  customPeriodLabel?: string;
  className?: string;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  filters,
  onFilterChange,
  categories = [],
  accounts = [],
  cards = [],
  users = [],
  currentUser,
  showPeriod = true,
  showUser = true,
  showAccounts = true,
  showCards = true,
  showCategories = true,
  showStatus = false,
  showType = false,
  showAssetType = false,
  customPeriodLabel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Accordion Sections State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    period: true,
    user: false,
    accounts: false,
    categories: false,
    status: false,
    type: false,
    assetType: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Close when clicking outside
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

  // Period Options
  const periodOptions = [
    { id: 'current_month', label: 'Este Mês' },
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'last_30_days', label: 'Últimos 30 dias' },
    { id: 'prev_month', label: 'Mês Anterior' },
    { id: 'next_month', label: 'Próximo Mês' },
    { id: 'current_year', label: 'Este Ano' },
    { id: 'custom', label: 'Personalizado' },
  ];

  // Count active non-default filters
  const activeFiltersCount = useMemoCount(filters);

  // Trigger button label
  const periodLabel = customPeriodLabel ||
    periodOptions.find(p => p.id === (filters.period || 'current_month'))?.label ||
    'Este Mês';

  const handleResetFilters = () => {
    onFilterChange({
      period: 'current_month',
      customStartDate: '',
      customEndDate: '',
      selectedUserIds: [],
      selectedAccountIds: [],
      selectedCardIds: [],
      selectedCategoryIds: [],
      status: 'all',
      type: 'all',
      assetType: 'all',
    });
  };

  // Toggle helpers
  const toggleAccountId = (id: string) => {
    const current = filters.selectedAccountIds || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onFilterChange({ ...filters, selectedAccountIds: next });
  };

  const toggleCardId = (id: string) => {
    const current = filters.selectedCardIds || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onFilterChange({ ...filters, selectedCardIds: next });
  };

  const toggleCategoryId = (id: string) => {
    const current = filters.selectedCategoryIds || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onFilterChange({ ...filters, selectedCategoryIds: next });
  };

  const toggleUserId = (id: string) => {
    const current = filters.selectedUserIds || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onFilterChange({ ...filters, selectedUserIds: next });
  };

  // User list fallback
  const allUsers = users.length > 0 ? users : currentUser ? [{ id: currentUser.email || 'user-default', name: currentUser.name, email: currentUser.email }] : [];

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      {/* TRIGGER BUTTON (Matching Reference Image) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl border text-xs font-bold transition-all shadow-xs cursor-pointer select-none ${
          isOpen || activeFiltersCount > 0
            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-300 shadow-purple-500/10'
            : 'bg-white dark:bg-[#18181B] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <Filter className="w-3.5 h-3.5 text-purple-500 shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-[180px]">
          {activeFiltersCount > 0 ? `Filtros (${activeFiltersCount})` : `Período: ${periodLabel}`}
        </span>
        {activeFiltersCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 animate-pulse" />
        )}
      </button>

      {/* FLOATING POPOVER MODAL */}
      {isOpen && (
        <div
          className="absolute right-0 top-12 z-50 w-80 sm:w-96 max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95 backdrop-blur-md"
          style={{ scrollbarWidth: 'thin' }}
        >
          {/* Header with Title and Reset */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Filtros</h3>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 text-[10px] font-black">
                  {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* 1. FILTRAR POR PERÍODO */}
            {showPeriod && (
              <div className="pt-2 first:pt-0 space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSection('period')}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    <span>Filtrar por Período</span>
                  </div>
                  {openSections.period ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {openSections.period && (
                  <div className="pt-1 space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="relative">
                      <select
                        value={filters.period || 'current_month'}
                        onChange={e => onFilterChange({ ...filters, period: e.target.value })}
                        className="w-full appearance-none px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#202024] text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:border-purple-500 pr-9"
                      >
                        {periodOptions.map(p => (
                          <option key={p.id} value={p.id} className="bg-white dark:bg-[#18181B] text-slate-800 dark:text-slate-100">
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Custom Date Inputs if 'custom' is selected */}
                    {filters.period === 'custom' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">De</label>
                          <DatePicker
                            value={filters.customStartDate || ''}
                            onChange={v => onFilterChange({ ...filters, customStartDate: v })}
                            placeholder="Início"
                            showPresets={false}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Até</label>
                          <DatePicker
                            value={filters.customEndDate || ''}
                            onChange={v => onFilterChange({ ...filters, customEndDate: v })}
                            placeholder="Fim"
                            showPresets={false}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. FILTRAR POR USUÁRIO / MEMBRO */}
            {showUser && allUsers.length > 0 && (
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSection('user')}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    <span>Filtrar por Usuário</span>
                  </div>
                  {openSections.user ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {openSections.user && (
                  <div className="pt-1 space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                      <button
                        type="button"
                        onClick={() => onFilterChange({ ...filters, selectedUserIds: allUsers.map(u => u.id) })}
                        className="hover:text-purple-600 transition-colors cursor-pointer"
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => onFilterChange({ ...filters, selectedUserIds: [] })}
                        className="hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {allUsers.map(u => {
                        const isSelected = (filters.selectedUserIds || []).includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleUserId(u.id)}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none"
                          >
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center text-[10px] font-black shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>

                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {u.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. FILTRAR POR CONTA E CARTÕES */}
            {(showAccounts || showCards) && (accounts.length > 0 || cards.length > 0) && (
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSection('accounts')}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    <span>Filtrar por Conta / Cartão</span>
                  </div>
                  {openSections.accounts ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {openSections.accounts && (
                  <div className="pt-1 space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                      <button
                        type="button"
                        onClick={() => onFilterChange({
                          ...filters,
                          selectedAccountIds: accounts.map(a => a.id),
                          selectedCardIds: cards.map(c => c.id),
                        })}
                        className="hover:text-purple-600 transition-colors cursor-pointer"
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => onFilterChange({
                          ...filters,
                          selectedAccountIds: [],
                          selectedCardIds: [],
                        })}
                        className="hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {/* Contas */}
                      {showAccounts && accounts.map(acc => {
                        const isSelected = (filters.selectedAccountIds || []).includes(acc.id);
                        return (
                          <div
                            key={acc.id}
                            onClick={() => toggleAccountId(acc.id)}
                            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none"
                          >
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            <div className="w-5 h-5 rounded-full flex items-center justify-center p-0.5 shrink-0" style={{ backgroundColor: acc.color ? acc.color + '20' : '#8b5cf620' }}>
                              <BankLogo nameOrId={acc.institution || acc.name} size={14} />
                            </div>

                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {acc.name}
                            </span>
                          </div>
                        );
                      })}

                      {/* Cartões */}
                      {showCards && cards.map(card => {
                        const isSelected = (filters.selectedCardIds || []).includes(card.id);
                        return (
                          <div
                            key={card.id}
                            onClick={() => toggleCardId(card.id)}
                            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none"
                          >
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            <div className="w-5 h-5 rounded-full flex items-center justify-center p-0.5 shrink-0" style={{ backgroundColor: card.color ? card.color + '20' : '#7c4dff20' }}>
                              <CardBrandLogo brand={card.brand} size={14} />
                            </div>

                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {card.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. FILTRAR POR CATEGORIA */}
            {showCategories && categories.length > 0 && (
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSection('categories')}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    <span>Filtrar por Categoria</span>
                  </div>
                  {openSections.categories ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {openSections.categories && (
                  <div className="pt-1 space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                      <button
                        type="button"
                        onClick={() => onFilterChange({ ...filters, selectedCategoryIds: categories.map(c => c.id) })}
                        className="hover:text-purple-600 transition-colors cursor-pointer"
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => onFilterChange({ ...filters, selectedCategoryIds: [] })}
                        className="hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {categories.map(cat => {
                        const isSelected = (filters.selectedCategoryIds || []).includes(cat.id);
                        return (
                          <div
                            key={cat.id}
                            onClick={() => toggleCategoryId(cat.id)}
                            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer select-none"
                          >
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            <span className="text-sm shrink-0">{cat.icon || '🏷️'}</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {cat.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. STATUS (PAGO / PENDENTE) */}
            {showStatus && (
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSection('status')}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    <span>Status do Lançamento</span>
                  </div>
                  {openSections.status ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {openSections.status && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'completed', label: 'Concluídos / Pagos' },
                      { id: 'pending', label: 'Pendentes' },
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onFilterChange({ ...filters, status: st.id as any })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          (filters.status || 'all') === st.id
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. TIPO (DESPESA / RECEITA / TRANSFERÊNCIA) */}
            {showType && (
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSection('type')}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    <span>Tipo de Movimentação</span>
                  </div>
                  {openSections.type ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {openSections.type && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'expense', label: 'Despesas' },
                      { id: 'income', label: 'Receitas' },
                      { id: 'transfer', label: 'Transferências' },
                    ].map(tp => (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => onFilterChange({ ...filters, type: tp.id as any })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          (filters.type || 'all') === tp.id
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tp.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. CLASSE DE ATIVO (INVESTIMENTOS) */}
            {showAssetType && (
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSection('assetType')}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    <span>Classe do Ativo</span>
                  </div>
                  {openSections.assetType ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {openSections.assetType && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'Todas as Classes' },
                      { id: 'fixed', label: 'Renda Fixa' },
                      { id: 'stocks', label: 'Ações' },
                      { id: 'fiis', label: 'FIIs' },
                      { id: 'crypto', label: 'Cripto' },
                      { id: 'funds', label: 'Fundos' },
                    ].map(at => (
                      <button
                        key={at.id}
                        type="button"
                        onClick={() => onFilterChange({ ...filters, assetType: at.id as any })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          (filters.assetType || 'all') === at.id
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {at.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-purple-600/20 cursor-pointer hover:scale-[1.02]"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper hook / function to count active filters
function useMemoCount(filters: FilterState): number {
  let count = 0;
  if (filters.period && filters.period !== 'current_month') count++;
  if (filters.selectedUserIds && filters.selectedUserIds.length > 0) count++;
  if (filters.selectedAccountIds && filters.selectedAccountIds.length > 0) count++;
  if (filters.selectedCardIds && filters.selectedCardIds.length > 0) count++;
  if (filters.selectedCategoryIds && filters.selectedCategoryIds.length > 0) count++;
  if (filters.status && filters.status !== 'all') count++;
  if (filters.type && filters.type !== 'all') count++;
  if (filters.assetType && filters.assetType !== 'all') count++;
  return count;
}
