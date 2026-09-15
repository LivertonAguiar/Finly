import { CreditTab } from '../dashboard/CreditTab';
import React, { useState } from 'react';
import {
  Plus,
  RotateCcw,
  Maximize2,
  Minimize2,
  Trash2,
  Edit2,
  Wallet,
  CreditCard as CardIcon,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Tag,
  FolderPlus,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency } from '../../utils/formatters';
import { AccountModal } from './AccountModal';
import { CardModal } from './CardModal';
import { CategoryModal } from './CategoryModal';
import { EmojiPicker } from '../ui/EmojiPicker';
import { BankLogo, CardBrandLogo, getCardBankInfo } from '../../utils/bankLogos';
import { Modal } from '../ui/Modal';
import { Account, CreditCard, Category } from '../../types';

export const CadastrosPage: React.FC = () => {
  const { confirm } = useConfirm();
  const {
    accounts,
    cards,
    categories,
    deleteAccount,
    deleteCard,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    resetCategoriesToDefault,
    metrics,
    user,
  } = useFinancial();

  const [activeTab, setActiveTab] = useState<'resumo' | 'contas' | 'cartoes' | 'categorias'>('resumo');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'cat-desp-alimentacao': true,
    'cat-desp-moradia': true,
    'cat-desp-transporte': true,
    'cat-desp-saude': true,
    'cat-desp-academia-esportes': true,
    'cat-desp-filhos': true,
    'cat-desp-compras-pessoal': true,
    'cat-desp-educacao': true,
    'cat-desp-lazer': true,
    'cat-desp-pets': true,
    'cat-desp-igreja-doacoes': true,
    'cat-desp-financeiro': true,
    'cat-desp-impostos': true,
    'cat-rec-trabalho': true,
    'cat-rec-investimentos': true,
    'cat-rec-beneficios-outras': true,
    'cat-mov-transferencias': true,
    'cat-mov-investimentos': true,
    'cat-mov-emprestimos': true,
  });

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [inlineSubName, setInlineSubName] = useState<Record<string, string>>({});
  const [editingSubcategory, setEditingSubcategory] = useState<{
    categoryId: string;
    subcategoryId: string;
    name: string;
    icon?: string;
  } | null>(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [editingSubIcon, setEditingSubIcon] = useState('📁');

  const toggleExpand = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    categories.forEach(c => (all[c.id] = true));
    setExpandedCategories(all);
  };

  const handleCollapseAll = () => {
    setExpandedCategories({});
  };

  const handleAddSubcategorySubmit = (categoryId: string) => {
    const name = inlineSubName[categoryId];
    if (name && name.trim()) {
      addSubcategory(categoryId, name.trim());
      setInlineSubName(prev => ({ ...prev, [categoryId]: '' }));
    }
  };

  const handleOpenEditSubcategory = (categoryId: string, sub: { id: string; name: string; icon?: string }) => {
    setEditingSubcategory({
      categoryId,
      subcategoryId: sub.id,
      name: sub.name,
      icon: sub.icon || '📁',
    });
    setEditingSubName(sub.name);
    setEditingSubIcon(sub.icon || '📁');
  };

  const handleSaveEditSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory || !editingSubName.trim()) return;
    updateSubcategory(editingSubcategory.categoryId, editingSubcategory.subcategoryId, {
      name: editingSubName.trim(),
      icon: editingSubIcon,
    });
    setEditingSubcategory(null);
  };

  const filteredCategories = categories.filter(c => {
    if (categoryTypeFilter !== 'all' && c.type !== categoryTypeFilter) return false;
    if (categorySearch) {
      const term = categorySearch.toLowerCase().trim();
      const matchCat = c.name.toLowerCase().includes(term);
      const matchSub = c.subcategories?.some(s => s.name.toLowerCase().includes(term));
      if (!matchCat && !matchSub) return false;
    }
    return true;
  });

  const effectiveExpanded = React.useMemo(() => {
    if (!categorySearch.trim()) return expandedCategories;
    const auto: Record<string, boolean> = {};
    filteredCategories.forEach(c => {
      auto[c.id] = true;
    });
    return auto;
  }, [categorySearch, expandedCategories, filteredCategories]);

  return (
    <div className="space-y-6">
      {/* Top Title & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Cadastro</h2>
          <p className="text-xs text-slate-400">Configure suas contas bancárias, cartões de crédito e categorias</p>
        </div>

        {/* 4 Tabs: Resumo, Contas, Cartões, Categorias */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start">
          {[
            { id: 'resumo', label: 'Resumo' },
            { id: 'contas', label: `Contas (${accounts.length})` },
            { id: 'cartoes', label: `Cartões (${cards.length})` },
            { id: 'categorias', label: 'Categorias' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. RESUMO TAB */}
      {activeTab === 'resumo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Saldo Total em Contas</span>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {formatCurrency(metrics.totalBalance, user.currency, !user.showValues)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">{accounts.length} contas ativas</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Limite Total em Cartões</span>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {formatCurrency(metrics.totalCreditLimit, user.currency, !user.showValues)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">{cards.length} cartões cadastrados</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Categorias Cadastradas</span>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {categories.length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0)} subcategorias
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accounts Quick List */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Contas Cadastradas</h3>
                <button onClick={() => setActiveTab('contas')} className="text-xs font-bold text-emerald-600 hover:underline">
                  Gerenciar
                </button>
              </div>
              <div className="space-y-2.5">
                {accounts.map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{a.name}</p>
                        <p className="text-[10px] text-slate-400">{a.institution}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(a.balance, user.currency, !user.showValues)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit Cards Quick List */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Cartões de Crédito</h3>
                <button onClick={() => setActiveTab('cartoes')} className="text-xs font-bold text-emerald-600 hover:underline">
                  Gerenciar
                </button>
              </div>
              <div className="space-y-2.5">
                {cards.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center p-1 shrink-0 shadow-xs border"
                        style={{
                          backgroundColor: c.color ? `${c.color}22` : '#7c4dff22',
                          borderColor: c.color ? `${c.color}45` : '#7c4dff45',
                        }}
                      >
                        <BankLogo nameOrId={c.bankId || getCardBankInfo(c)?.id || c.name} size={20} radius={6} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">• {getCardBankInfo(c)?.name || c.brand}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Fecha dia {c.closingDay} • Vence dia {c.dueDay}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      Lim: {formatCurrency(c.limit, user.currency, !user.showValues)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONTAS TAB */}
      {activeTab === 'contas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">Cadastre suas contas bancárias, contas correntes e carteiras de dinheiro.</p>
            <button
              onClick={() => {
                setEditingAccount(null);
                setIsAccountModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" /> Nova Conta
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(a => (
              <div
                key={a.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <BankLogo nameOrId={a.institution || a.name} size={32} className="w-8 h-8 rounded-xl shadow-xs shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium">{a.institution}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingAccount(a);
                          setIsAccountModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAccount(a.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Atual</span>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                      {formatCurrency(a.balance, user.currency, !user.showValues)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400">
                  <span>{a.includeInTotal ? 'Incluído no total' : 'Oculto do total'}</span>
                  <span className="capitalize">{a.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CARTOES TAB */}
      {activeTab === 'cartoes' && (
        <CreditTab onOpenNewCard={() => { setEditingCard(null); setIsCardModalOpen(true); }} />
      )}

      {/* 4. CATEGORIAS TAB */}
      {activeTab === 'categorias' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Controls Bar & Search */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
            {/* Linha 1: Input de Busca + Ações Globais */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input com ícone e botão de limpar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar categoria ou subcategoria..."
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
                    title="Limpar pesquisa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Ações Globais: Expandir, Recolher, Resetar, + Nova Categoria */}
              <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Expandir todas as categorias"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Expandir tudo</span>
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Recolher todas as categorias"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Recolher tudo</span>
                </button>
                <span className="text-slate-200 dark:text-slate-700 hidden sm:inline">|</span>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Restaurar Categorias',
                      message: 'Deseja restaurar as categorias padrão do Finly?',
                      confirmText: 'Restaurar',
                      type: 'warning',
                    });
                    if (ok) {
                      resetCategoriesToDefault();
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Restaurar categorias padrão"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Resetar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Categoria</span>
                </button>
              </div>
            </div>

            {/* Linha 2: Filtros por Tipo de Categoria */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  categoryTypeFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Todos ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('expense')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  categoryTypeFilter === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Despesas ({categories.filter(c => c.type === 'expense').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('income')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  categoryTypeFilter === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Receitas ({categories.filter(c => c.type === 'income').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('transfer')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  categoryTypeFilter === 'transfer'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Movimentações ({categories.filter(c => c.type === 'transfer').length})
              </button>
            </div>
          </div>

          {/* Categories Hierarchical List */}
          <div className="space-y-3">
            {filteredCategories.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-400">
                <p className="text-sm font-semibold">Nenhuma categoria encontrada com os filtros atuais.</p>
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    Limpar pesquisa
                  </button>
                )}
              </div>
            ) : (
              filteredCategories.map(cat => {
                const isExpanded = !!effectiveExpanded[cat.id];
                const subCount = cat.subcategories?.length || 0;

                return (
                  <div
                    key={cat.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-2xs overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Category Header */}
                    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleExpand(cat.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                          title={isExpanded ? 'Recolher subcategorias' : 'Expandir subcategorias'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-2xs select-none"
                          style={{
                            backgroundColor: (cat.color || '#7c4dff') + '20',
                            color: cat.color || '#7c4dff',
                          }}
                        >
                          {cat.icon || '📁'}
                        </div>

                        <div className="min-w-0 flex-1 pr-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900 dark:text-white break-words leading-tight">
                              {cat.name}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                                cat.type === 'income'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : cat.type === 'transfer'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {cat.type === 'income' ? 'Receita' : cat.type === 'transfer' ? 'Movimentação' : 'Despesa'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                              {subCount} {subCount === 1 ? 'subcategoria' : 'subcategorias'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isExpanded) toggleExpand(cat.id);
                            setTimeout(() => {
                              const el = document.getElementById(`sub-input-${cat.id}`);
                              el?.focus();
                            }, 60);
                          }}
                          className="p-1.5 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                          title="Adicionar subcategoria"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Sub</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar categoria"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Excluir categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Drawer */}
                    {isExpanded && (
                      <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 animate-in fade-in duration-150">
                        <div className="space-y-2">
                          {subCount === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">
                              Nenhuma subcategoria cadastrada ainda. Adicione uma no campo abaixo!
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                              {cat.subcategories.map(sub => (
                                <div
                                  key={sub.id}
                                  className="group flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-purple-300 dark:hover:border-purple-800 transition-all text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-1">
                                    <span className="text-sm shrink-0">{sub.icon || '•'}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={sub.name}>
                                      {sub.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditSubcategory(cat.id, sub)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                                      title="Editar subcategoria"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteSubcategory(cat.id, sub.id)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                      title="Excluir subcategoria"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Subcategory Inline Form */}
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              id={`sub-input-${cat.id}`}
                              type="text"
                              placeholder="Nova subcategoria (ex: ☕ Café, 🚌 Ônibus)..."
                              value={inlineSubName[cat.id] || ''}
                              onChange={e => setInlineSubName({ ...inlineSubName, [cat.id]: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && handleAddSubcategorySubmit(cat.id)}
                              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSubcategorySubmit(cat.id)}
                              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        editingAccount={editingAccount}
      />

      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
        }}
        editingCard={editingCard}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        editingCategory={editingCategory}
      />

      {/* Modal de Edição de Subcategoria */}
      {editingSubcategory && (
        <Modal
          isOpen={Boolean(editingSubcategory)}
          onClose={() => setEditingSubcategory(null)}
          title="Editar Subcategoria"
          maxWidth="sm"
        >
          <form onSubmit={handleSaveEditSubcategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Subcategoria *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Farmácia, Combustível, Delivery..."
                value={editingSubName}
                onChange={e => setEditingSubName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Emoji / Ícone Identificador (Selecionado: {editingSubIcon})
              </label>
              <EmojiPicker selectedEmoji={editingSubIcon} onSelectEmoji={setEditingSubIcon} />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSubcategory(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-xl shadow-xs cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};