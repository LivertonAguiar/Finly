import React, { useState, useMemo } from 'react';
import {
  Plus,
  TrendingDown,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  LineChart,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  DollarSign,
  HelpCircle,
  Wallet,
  Info,
  Banknote,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Account } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { BankLogo, ALL_BANKS } from '../../utils/bankLogos';
import { AccountModal } from '../cadastros/AccountModal';
import { TransactionModal } from '../transactions/TransactionModal';
import { Modal } from '../ui/Modal';

export const AccountsPage: React.FC = () => {
  const { accounts, transactions, addTransaction, deleteAccount, user } = useFinancial();
  const { confirm } = useConfirm();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Differentiated Transaction Modal (Receita / Despesa / Transferência)
  const [txModalState, setTxModalState] = useState<{
    isOpen: boolean;
    type: 'income' | 'expense' | 'transfer' | 'investment';
    paymentMethod?: 'account' | 'card';
    accountId?: string;
  }>({
    isOpen: false,
    type: 'income',
  });

  // Quick Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');

  // Projeção de Saldo Modal
  const [isProjectionOpen, setIsProjectionOpen] = useState(false);

  // Reajuste de Saldo Modal
  const [isReajusteOpen, setIsReajusteOpen] = useState(false);
  const [reajusteAccount, setReajusteAccount] = useState<Account | null>(null);
  const [reajusteNovoSaldo, setReajusteNovoSaldo] = useState('');

  // + Novo Menu State
  const [isNovoMenuOpen, setIsNovoMenuOpen] = useState(false);

  // 3-dots Context Menu State
  const [openMenuAccountId, setOpenMenuAccountId] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  // Month calculation
  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const yearNum = viewDate.getFullYear();
  const currentMonthPrefix = viewDate.toISOString().substring(0, 7);

  // Balances calculation
  const totalActualBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const pendingIncomes = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' && t.status === 'pending' && t.date.startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonthPrefix]);

  const pendingExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.status === 'pending' && t.date.startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonthPrefix]);

  const totalProjectedBalance = totalActualBalance + pendingIncomes - pendingExpenses;

  // Account detailed cards
  const accountCards = useMemo(() => {
    return accounts.map(acc => {
      const accPendingIncomes = transactions
        .filter(t => t.accountId === acc.id && t.type === 'income' && t.status === 'pending' && t.date.startsWith(currentMonthPrefix))
        .reduce((sum, t) => sum + t.amount, 0);

      const accPendingExpenses = transactions
        .filter(t => t.accountId === acc.id && t.type === 'expense' && t.status === 'pending' && t.date.startsWith(currentMonthPrefix))
        .reduce((sum, t) => sum + t.amount, 0);

      const projected = acc.balance + accPendingIncomes - accPendingExpenses;

      return {
        ...acc,
        projected,
      };
    });
  }, [accounts, transactions, currentMonthPrefix]);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount) || 0;
    if (amt <= 0 || fromAccountId === toAccountId) return;

    addTransaction({
      description: 'Transferência entre contas',
      amount: amt,
      type: 'transfer',
      date: new Date().toISOString().substring(0, 10),
      categoryId: 'cat-outros',
      accountId: fromAccountId,
      targetAccountId: toAccountId,
      status: 'completed',
      recurring: false,
      tags: [],
    });

    setIsTransferOpen(false);
    setTransferAmount('');
  };

  const handleReajusteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reajusteAccount) return;
    const newBal = parseFloat(reajusteNovoSaldo) || 0;
    const diff = newBal - reajusteAccount.balance;

    if (diff !== 0) {
      addTransaction({
        description: `Ajuste de Saldo (${reajusteAccount.name})`,
        amount: Math.abs(diff),
        type: diff > 0 ? 'income' : 'expense',
        date: new Date().toISOString().substring(0, 10),
        categoryId: 'cat-outros',
        accountId: reajusteAccount.id,
        status: 'completed',
        recurring: false,
        tags: ['ajuste-saldo'],
      });
    }

    setIsReajusteOpen(false);
    setReajusteAccount(null);
    setReajusteNovoSaldo('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 1. TOPBAR (MOBILLS CONTAS EXACT SPEC FROM SCREENSHOT) */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Heading */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Contas
        </h2>

        {/* Center: Month Dropdown Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonthOffset(prev => prev - 1)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-4 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-1.5">
            <span>{capitalizedMonth.toLowerCase()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </span>

          <button
            onClick={() => setSelectedMonthOffset(prev => prev + 1)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Single Unified + Novo Button with Menu Popover */}
        <div className="flex items-center gap-2">
          {/* Unified + Novo Button */}
          <div className="relative">
            <button
              onClick={() => setIsNovoMenuOpen(!isNovoMenuOpen)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Novo Lançamento"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo</span>
            </button>

            {/* Mobills Replica Dark Popover Menu */}
            {isNovoMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNovoMenuOpen(false)}
                />
                <div
                  onClick={e => e.stopPropagation()}
                  className="absolute right-0 top-11 z-50 w-52 rounded-2xl bg-[#28282b] dark:bg-[#1E1E20] border border-slate-700/80 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 text-slate-100 overflow-hidden divide-y divide-slate-700/40"
                >
                  <div className="py-1">
                    {/* 1. Despesa */}
                    <button
                      onClick={() => {
                        setIsNovoMenuOpen(false);
                        setTxModalState({ isOpen: true, type: 'expense', paymentMethod: 'account' });
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
                    >
                      <TrendingDown className="w-4 h-4 text-[#ef5350]" />
                      <span>Despesa</span>
                    </button>

                    {/* 2. Receita */}
                    <button
                      onClick={() => {
                        setIsNovoMenuOpen(false);
                        setTxModalState({ isOpen: true, type: 'income' });
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
                    >
                      <TrendingUp className="w-4 h-4 text-[#66bb6a]" />
                      <span>Receita</span>
                    </button>

                    {/* 3. Despesa cartão */}
                    <button
                      onClick={() => {
                        setIsNovoMenuOpen(false);
                        setTxModalState({ isOpen: true, type: 'expense', paymentMethod: 'card' });
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
                    >
                      <CreditCard className="w-4 h-4 text-[#26a69a]" />
                      <span>Despesa cartão</span>
                    </button>

                    {/* 4. Transferência */}
                    <button
                      onClick={() => {
                        setIsNovoMenuOpen(false);
                        setIsTransferOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-[#42a5f5]" />
                      <span>Transferência</span>
                    </button>
                  </div>

                  <div className="py-1">
                    {/* 5. Nova Conta */}
                    <button
                      onClick={() => {
                        setIsNovoMenuOpen(false);
                        setEditingAccount(null);
                        setIsAccountModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer text-purple-400 hover:text-purple-300"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nova Conta</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Projeção de Saldo Button */}
          <button
            onClick={() => setIsProjectionOpen(true)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            title="Projeção de saldo"
          >
            <LineChart className="w-4 h-4" />
          </button>

          {/* Mais Opções (⋮) */}
          <div className="relative">
            <button
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isHeaderMenuOpen && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute right-0 top-12 z-40 w-48 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <button
                  onClick={async () => {
                    setIsTransferOpen(true);
                    setIsHeaderMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                  <span>Transferência entre contas</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN COMPACT LAYOUT (EXACT REPLICA OF SCREENSHOT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: 2 COLUMNS OF COMPACT ACCOUNT CARDS (COL-SPAN-8) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* NOVA CONTA CARD */}
          <div
            onClick={async () => {
              setEditingAccount(null);
              setIsAccountModalOpen(true);
            }}
            className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer min-h-[148px] group hover:border-purple-500/60 transition-all"
          >
            <div className="w-11 h-11 rounded-full border-2 border-purple-500 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-black text-purple-500 uppercase tracking-wider">
              Nova conta
            </span>
          </div>

          {/* LIST OF ACCOUNTS */}
          {accountCards.map(acc => (
            <div
              key={acc.id}
              className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-3.5 relative group flex flex-col justify-between"
            >
              {/* Header: Bank Logo/Emblem + Name + 3-dots */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center p-1 text-xs shrink-0 shadow-xs"
                    style={{ backgroundColor: acc.color ? acc.color + '25' : '#7c4dff25', color: acc.color || '#7c4dff' }}
                  >
                    <BankLogo nameOrId={acc.institution || acc.name} size={18} className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    {acc.name}
                  </h4>
                </div>

                {/* 3-dots popover */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuAccountId(openMenuAccountId === acc.id ? null : acc.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuAccountId === acc.id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="absolute right-0 top-7 z-30 w-44 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 animate-in fade-in zoom-in-95"
                    >
                      <button
                        onClick={async () => {
                          setEditingAccount(acc);
                          setIsAccountModalOpen(true);
                          setOpenMenuAccountId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Conta</span>
                      </button>

                      <button
                        onClick={async () => {
                          setReajusteAccount(acc);
                          setReajusteNovoSaldo(acc.balance.toString());
                          setIsReajusteOpen(true);
                          setOpenMenuAccountId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 flex items-center gap-2 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Reajuste de Saldo</span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        onClick={async () => {
                          setOpenMenuAccountId(null);
                          const ok = await confirm({
                            title: 'Excluir Conta Bancária',
                            message: `Tem certeza que deseja excluir a conta ${acc.name}?`,
                            confirmText: 'Excluir Conta',
                            type: 'danger'
                          });
                          if (ok) {
                            deleteAccount(acc.id);
                          }
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Body: Saldo atual & Saldo previsto (Aligned Left & Right) */}
              <div className="space-y-1.5 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">Saldo atual</span>
                  <span className="text-[#66bb6a] font-black">
                    {formatCurrency(acc.balance, user.currency, !user.showValues)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]">
                    <span>Saldo previsto</span>
                    <span title="Saldo estimado considerando receitas e despesas agendadas">
                      <HelpCircle className="w-3 h-3 text-slate-500" />
                    </span>
                  </div>
                  <span className={`font-black ${acc.projected >= 0 ? 'text-[#66bb6a]' : 'text-[#ef5350]'}`}>
                    {formatCurrency(acc.projected, user.currency, !user.showValues)}
                  </span>
                </div>
              </div>

              {/* Footer: Differentiated Quick Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setTxModalState({ isOpen: true, type: 'income', accountId: acc.id })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center justify-center gap-1 transition-all cursor-pointer font-black"
                  title="Adicionar Receita / Depósito nesta conta"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>+ Receita</span>
                </button>

                <button
                  onClick={() => setTxModalState({ isOpen: true, type: 'expense', accountId: acc.id })}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center justify-center gap-1 transition-all cursor-pointer font-black"
                  title="Adicionar Despesa / Saída nesta conta"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>- Despesa</span>
                </button>

                <button
                  onClick={() => {
                    setFromAccountId(acc.id);
                    setIsTransferOpen(true);
                  }}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Transferir a partir desta conta"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: STACKED CONSOLIDATED SUMMARY CARDS (COL-SPAN-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Saldo atual */}
          <div className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                <span>Saldo atual</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(totalActualBalance, user.currency, !user.showValues)}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/30 shrink-0">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Card 2: Saldo previsto */}
          <div className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                <span>Saldo previsto</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className={`text-xl font-black tracking-tight ${totalProjectedBalance >= 0 ? 'text-[#66bb6a] dark:text-white' : 'text-[#ef5350]'}`}>
                {formatCurrency(totalProjectedBalance, user.currency, !user.showValues)}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/30 shrink-0">
              <Banknote className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Modal */}
      {isAccountModalOpen && (
        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => {
            setIsAccountModalOpen(false);
            setEditingAccount(null);
          }}
          editingAccount={editingAccount}
        />
      )}

      {/* Differentiated Transaction Modal (Receita / Despesa / Saldo) */}
      {txModalState.isOpen && (
        <TransactionModal
          isOpen={txModalState.isOpen}
          onClose={() => setTxModalState(prev => ({ ...prev, isOpen: false }))}
          initialType={txModalState.type}
          initialAccountId={txModalState.accountId}
          initialPaymentMethod={txModalState.paymentMethod}
        />
      )}

      {/* Transfer Modal */}
      {isTransferOpen && (
        <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Nova Transferência entre Contas">
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta de Origem</label>
              <select
                value={fromAccountId}
                onChange={e => setFromAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, user.currency)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta de Destino</label>
              <select
                value={toAccountId}
                onChange={e => setToAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, user.currency)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor da Transferência</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$ 0,00"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
              >
                Transferir Agora
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reajuste de Saldo Modal */}
      {isReajusteOpen && reajusteAccount && (
        <Modal
          isOpen={isReajusteOpen}
          onClose={() => {
            setIsReajusteOpen(false);
            setReajusteAccount(null);
          }}
          title={`Reajuste de Saldo - ${reajusteAccount.name}`}
        >
          <form onSubmit={handleReajusteSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Digite o saldo real que você possui no banco. Um lançamento automático de ajuste será gerado para equilibrar seu extrato.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Novo Saldo Real</label>
              <input
                type="number"
                step="0.01"
                value={reajusteNovoSaldo}
                onChange={e => setReajusteNovoSaldo(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
              >
                Confirmar Reajuste
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Projeção de Saldo Modal */}
      {isProjectionOpen && (
        <Modal isOpen={isProjectionOpen} onClose={() => setIsProjectionOpen(false)} title="Projeção de Saldo Mensal">
          <div className="space-y-4 text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              A projeção de saldo calcula quanto você terá em conta até o fim de <strong>{capitalizedMonth}</strong>, considerando todas as receitas e despesas pendentes já agendadas:
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>(+) Saldo Atual em Contas:</span>
                <span className="font-bold">{formatCurrency(totalActualBalance, user.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#66bb6a]">
                <span>(+) Receitas Pendentes no Mês:</span>
                <span className="font-bold">+{formatCurrency(pendingIncomes, user.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#ef5350]">
                <span>(-) Despesas Pendentes / Faturas:</span>
                <span className="font-bold">-{formatCurrency(pendingExpenses, user.currency)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                <span>(=) Saldo Previsto Final:</span>
                <span className={totalProjectedBalance >= 0 ? 'text-[#66bb6a]' : 'text-[#ef5350]'}>
                  {formatCurrency(totalProjectedBalance, user.currency)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
