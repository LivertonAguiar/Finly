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
  Database,
  AlertTriangle,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency } from '../../utils/formatters';
import { AccountModal } from './AccountModal';
import { CardModal } from './CardModal';
import { CategoryModal } from './CategoryModal';
import { BankLogo, CardBrandLogo } from '../../utils/bankLogos';
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
    deleteSubcategory,
    resetCategoriesToDefault,
    clearAppCache,
    resetAllUserData,
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

  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState(false);

  const handleClearCache = () => {
    setCacheClearedSuccess(true);
    setTimeout(() => {
      clearAppCache();
    }, 600);
  };

  const handleConfirmResetData = () => {
    resetAllUserData();
    setShowResetConfirmModal(false);
  };

  const [inlineSubName, setInlineSubName] = useState<Record<string, string>>({});

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

  const filteredCategories = categories.filter(c => {
    if (categoryTypeFilter !== 'all' && c.type !== categoryTypeFilter) return false;
    if (categorySearch && !c.name.toLowerCase().includes(categorySearch.toLowerCase())) return false;
    return true;
  });

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
                      <CardBrandLogo brand={c.brand} size={18} className="w-6 h-3.5 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
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
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setCategoryTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  categoryTypeFilter === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todos ({categories.length})
              </button>
              <button
                onClick={() => setCategoryTypeFilter('expense')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  categoryTypeFilter === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Despesas ({categories.filter(c => c.type === 'expense').length})
              </button>
              <button
                onClick={() => setCategoryTypeFilter('income')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  categoryTypeFilter === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Receitas ({categories.filter(c => c.type === 'income').length})
              </button>
              <button
                onClick={() => setCategoryTypeFilter('transfer')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  categoryTypeFilter === 'transfer' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Movimentações ({categories.filter(c => c.type === 'transfer').length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExpandAll}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <Maximize2 className="w-3 h-3" /> Expandir tudo
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleCollapseAll}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <Minimize2 className="w-3 h-3" /> Recolher tudo
              </button>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Restaurar Categorias',
                    message: 'Deseja restaurar as categorias padrão do Finly?',
                    confirmText: 'Restaurar',
                    type: 'warning'
                  });
                  if (ok) {
                    resetCategoriesToDefault();
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <RotateCcw className="w-3 h-3" /> Resetar
              </button>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Novo
              </button>
            </div>
          </div>

          {/* Categories Hierarchical List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCategories.map(cat => {
              const isExpanded = !!expandedCategories[cat.id];

              return (
                <div key={cat.id} className="p-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <span className="text-xl">{cat.icon}</span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">({cat.subcategories?.length || 0})</span>
                          <span
    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
      cat.type === 'income'
        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
        : cat.type === 'transfer'
        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600'
        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'
    }`}
  >
    {cat.type === 'income' ? 'Receita (+)' : cat.type === 'transfer' ? 'Movimentação (⇄)' : 'Despesa (-)'}
  </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Sub-Tree */}
                  {isExpanded && (
                    <div className="mt-3 pl-10 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-4 animate-in fade-in">
                      {(cat.subcategories || []).map(sub => (
                        <div key={sub.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <span>{sub.icon || '•'}</span>
                            <span className="font-semibold">{sub.name}</span>
                          </div>
                          <button
                            onClick={() => deleteSubcategory(cat.id, sub.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Add subcategory inline input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Adicionar subcategoria..."
                          value={inlineSubName[cat.id] || ''}
                          onChange={e => setInlineSubName({ ...inlineSubName, [cat.id]: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && handleAddSubcategorySubmit(cat.id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubcategorySubmit(cat.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. DADOS & SISTEMA SECTION */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            Dados & Sistema
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie o cache da aplicação e a integridade dos seus registros
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Limpar Cache */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Limpar Cache</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Remove dados temporários e recarrega o app</p>
            </div>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl shadow-sm transition-colors"
            >
              {cacheClearedSuccess ? 'Limpando...' : 'Limpar'}
            </button>
          </div>

          {/* Card: Excluir Meus Dados */}
          <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">Excluir Meus Dados</h4>
              <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                Remove transações, metas, dívidas e orçamentos
              </p>
            </div>
            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Reset Data Modal */}
      <Modal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        title="Confirmar Exclusão de Dados"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Atenção: Esta ação é irreversível!</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Você tem certeza que deseja excluir todas as suas transações, orçamentos, metas e dívidas?
            As suas contas bancárias serão zeradas para um novo recomeço.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmResetData}
              className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
            >
              Confirmar Exclusão
            </button>
          </div>
        </div>
      </Modal>

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
    </div>
  );
};