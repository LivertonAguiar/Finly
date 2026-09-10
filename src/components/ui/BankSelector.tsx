import React, { useState, useMemo } from 'react';
import { Search, X, Check, Building2, Sparkles, ShoppingBag, Smartphone, Landmark } from 'lucide-react';
import { ALL_BANKS, BankLogo, BankInfo } from '../../utils/bankLogos';
import { GridBlocksIcon, ListRowsIcon } from './ViewModeToggle';

export type BankSelectorViewMode = 'cards' | 'grid';
export type BankCategoryTab = 'all' | 'popular' | 'retail' | 'digital' | 'traditional';

interface BankSelectorProps {
  selectedBankId?: string;
  selectedBankName?: string;
  onSelectBank: (bank: BankInfo) => void;
  accentColor?: 'purple' | 'emerald';
  title?: string;
  maxHeightClass?: string;
}

// Emissores classificados para navegação rápida
const POPULAR_IDS = ['nubank', 'inter', 'itau', 'bradesco', 'bb', 'santander', 'caixa', 'c6', 'credicard'];
const RETAIL_IDS = ['amazon', 'casasbahia', 'americanas', 'carrefour', 'bradescard', 'santanderway', 'bradesconeo'];
const DIGITAL_IDS = ['nubank', 'inter', 'c6', 'credicard', 'picpay', 'mercadopago', 'pagbank', 'will', 'neon', 'nomad', 'wise'];
const TRADITIONAL_IDS = ['itau', 'bradesco', 'santander', 'bb', 'caixa', 'btg', 'xp', 'safra', 'sicredi', 'sicoob'];

export const BankSelector: React.FC<BankSelectorProps> = ({
  selectedBankId = '',
  selectedBankName = '',
  onSelectBank,
  accentColor = 'purple',
  title = 'Selecione o Emissor / Banco',
  maxHeightClass = 'max-h-56',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<BankCategoryTab>('all');
  const [viewMode, setViewMode] = useState<BankSelectorViewMode>(() => {
    try {
      return (localStorage.getItem('finly_bank_selector_view') as BankSelectorViewMode) || 'cards';
    } catch {
      return 'cards';
    }
  });

  const handleToggleView = (mode: BankSelectorViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('finly_bank_selector_view', mode);
    } catch {
      // Ignore storage errors
    }
  };

  // Filtragem dos bancos
  const filteredBanks = useMemo(() => {
    let list = ALL_BANKS;

    // 1. Filtro por categoria
    if (activeTab === 'popular') {
      list = list.filter(b => POPULAR_IDS.includes(b.id));
    } else if (activeTab === 'retail') {
      list = list.filter(b => RETAIL_IDS.includes(b.id));
    } else if (activeTab === 'digital') {
      list = list.filter(b => DIGITAL_IDS.includes(b.id));
    } else if (activeTab === 'traditional') {
      list = list.filter(b => TRADITIONAL_IDS.includes(b.id));
    }

    // 2. Filtro por busca textual
    const query = searchTerm.trim().toLowerCase();
    if (!query) return list;

    return list.filter(b => {
      const matchName = b.name.toLowerCase().includes(query);
      const matchId = b.id.toLowerCase().includes(query);
      const matchCode = b.code ? b.code.includes(query) : false;
      return matchName || matchId || matchCode;
    });
  }, [activeTab, searchTerm]);

  // Tag descritiva para cada emissor
  const getBankSubtitle = (bank: BankInfo) => {
    if (RETAIL_IDS.includes(bank.id)) return 'Cartão de Loja / Varejo';
    if (['nomad', 'wise'].includes(bank.id)) return 'Conta Global / Câmbio';
    if (['xp', 'btg'].includes(bank.id)) return 'Investimentos';
    if (['sicoob', 'sicredi'].includes(bank.id)) return 'Cooperativa de Crédito';
    if (DIGITAL_IDS.includes(bank.id)) return `Banco Digital • ${bank.code !== '000' ? `Cód. ${bank.code}` : 'Fintech'}`;
    if (TRADITIONAL_IDS.includes(bank.id)) return `Banco Tradicional • Cód. ${bank.code}`;
    return bank.code !== '000' ? `Instituição • Cód. ${bank.code}` : 'Instituição Financeira';
  };

  const isBankSelected = (bank: BankInfo) => {
    if (selectedBankId) {
      return bank.id.toLowerCase() === selectedBankId.toLowerCase();
    }
    if (selectedBankName) {
      return (
        selectedBankName.toLowerCase() === bank.name.toLowerCase() ||
        selectedBankName.toLowerCase().includes(bank.name.toLowerCase())
      );
    }
    return false;
  };

  // Cores dinâmicas de acento
  const isPurple = accentColor === 'purple';
  const selectedBorder = isPurple
    ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/15 ring-2 ring-purple-500/30'
    : 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-2 ring-emerald-500/30';
  const selectedBadge = isPurple ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white';
  const activeTabClass = isPurple
    ? 'bg-purple-600 text-white shadow-xs'
    : 'bg-emerald-600 text-white shadow-xs';

  return (
    <div className="space-y-2.5">
      {/* 1. Header com Título, Total e Alternador de Modo */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className={`w-3.5 h-3.5 ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
          <span>{title}</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold hidden sm:inline-block">
            {filteredBanks.length} de {ALL_BANKS.length} bancos
          </span>

          {/* Botões de Alternância: Cards Detalhados vs Grade Compacta */}
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => handleToggleView('cards')}
              title="Visualização em Cards Detalhados"
              className={`p-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <ListRowsIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleView('grid')}
              title="Visualização em Grade de Ícones"
              className={`p-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <GridBlocksIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Campo de Busca Instantânea com Limpeza */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar banco ou cartão (ex: Nubank, Amazon, Inter)..."
          className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-500/40 transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 3. Filtros Rápidos por Categoria (Pill Tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
            activeTab === 'all'
              ? activeTabClass
              : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Todos ({ALL_BANKS.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('popular')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
            activeTab === 'popular'
              ? activeTabClass
              : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Populares ({POPULAR_IDS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('retail')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
            activeTab === 'retail'
              ? activeTabClass
              : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-3 h-3" />
          <span>Cartões de Loja ({RETAIL_IDS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('digital')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
            activeTab === 'digital'
              ? activeTabClass
              : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Smartphone className="w-3 h-3" />
          <span>Digitais ({DIGITAL_IDS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('traditional')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
            activeTab === 'traditional'
              ? activeTabClass
              : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Landmark className="w-3 h-3" />
          <span>Tradicionais ({TRADITIONAL_IDS.length})</span>
        </button>
      </div>

      {/* 4. Lista dos Bancos / Emissores */}
      <div
        className={`${maxHeightClass} overflow-y-auto p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 scrollbar-thin`}
      >
        {filteredBanks.length === 0 ? (
          <div className="py-8 text-center px-4">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nenhum banco encontrado com &quot;{searchTerm}&quot;
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tente outro nome ou use o termo pesquisado como nome personalizado.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* ======================================================================= */
          /* MODO 1: CARDS DETALHADOS (2 COLUNAS, NOMES COMPLETOS SEM TRUNCAMENTO)   */
          /* ======================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredBanks.map(bank => {
              const selected = isBankSelected(bank);
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => onSelectBank(bank)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer group ${
                    selected
                      ? `${selectedBorder} shadow-sm scale-[1.01]`
                      : 'border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-xs border border-slate-200/50 dark:border-slate-700/50 group-hover:scale-105 transition-transform">
                    <BankLogo nameOrId={bank.id} size={28} className="w-7 h-7 rounded-lg" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight truncate">
                      {bank.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium block truncate mt-0.5">
                      {getBankSubtitle(bank)}
                    </span>
                  </div>

                  {selected ? (
                    <span className={`w-5 h-5 rounded-full ${selectedBadge} flex items-center justify-center shrink-0 shadow-xs`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* ======================================================================= */
          /* MODO 2: GRADE COMPACTA (3 A 4 COLUNAS VERTICAIS COM LOGOS GRANDES)     */
          /* ======================================================================= */
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filteredBanks.map(bank => {
              const selected = isBankSelected(bank);
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => onSelectBank(bank)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer relative group ${
                    selected
                      ? `${selectedBorder} shadow-sm scale-[1.02]`
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {selected && (
                    <span className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full ${selectedBadge} flex items-center justify-center shadow-xs`}>
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}

                  <div className="w-9 h-9 rounded-xl flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-xs border border-slate-200/50 dark:border-slate-700/50 my-0.5 group-hover:scale-105 transition-transform">
                    <BankLogo nameOrId={bank.id} size={28} className="w-7 h-7 rounded-lg" />
                  </div>

                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight text-center line-clamp-2 h-7 flex items-center justify-center mt-1 px-0.5 w-full">
                    {bank.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
