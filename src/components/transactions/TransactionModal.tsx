import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  CreditCard as CardIcon,
  ArrowLeftRight,
  ChevronDown,
  Calendar,
  Wallet,
  Tag,
  CheckCircle2,
  Clock,
  Layers,
  Repeat,
  Paperclip,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancial } from '../../context/FinancialContext';
import { Transaction, TransactionType, TransactionStatus } from '../../types';
import { formatCurrency, getTodayString, round2 } from '../../utils/formatters';
import { CardBrandLogo } from '../../utils/bankLogos';
import { allocateCardTransaction } from '../../utils/invoiceCalculator';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialAccountId?: string;
  initialCardId?: string;
  initialPaymentMethod?: 'account' | 'card';
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  initialAccountId,
  initialCardId,
  initialPaymentMethod,
  editingTransaction = null,
}) => {
  const { categories, accounts, cards, addTransaction, updateTransaction, user } = useFinancial();

  const [type, setType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [cardId, setCardId] = useState(initialCardId || '');
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>('account');
  const [isPaid, setIsPaid] = useState(true);
  const [recurring, setRecurring] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [repeatAmount, setRepeatAmount] = useState('2');
  const [repeatPeriod, setRepeatPeriod] = useState<'days' | 'weeks' | 'months' | 'years'>('months');
  const [ignoreTransaction, setIgnoreTransaction] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [saveAndNew, setSaveAndNew] = useState(false);
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [targetInvoiceMonth, setTargetInvoiceMonth] = useState('');

  const prevIsOpenRef = React.useRef(false);
  const prevEditingIdRef = React.useRef<string | null>(null);

  // Available invoice periods for credit card
  const invoiceMonths = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = -1; i <= 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const k = d.toISOString().substring(0, 7);
      const mName = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const cap = mName.charAt(0).toUpperCase() + mName.slice(1);
      list.push({ key: k, label: i === 0 ? `${cap} (Atual)` : cap });
    }
    return list;
  }, []);

  // Initialize ONLY when opening modal or switching editing transaction
  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const isSwitchingTx = editingTransaction?.id !== prevEditingIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevEditingIdRef.current = editingTransaction?.id || null;

    if (!isOpen) return;

    if (isOpening || isSwitchingTx) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setDescription(editingTransaction.description || '');
        setAmount(editingTransaction.amount ? Number(editingTransaction.amount).toFixed(2) : '');
        setDate(editingTransaction.date || getTodayString());
        
        const foundCat = categories.find(c => c.id === editingTransaction.categoryId || c.name.toLowerCase() === editingTransaction.categoryId?.toLowerCase());
        setCategoryId(foundCat ? foundCat.id : (editingTransaction.categoryId || categories[0]?.id || ''));

        setSubcategoryId(editingTransaction.subcategoryId || '');
        setAccountId(editingTransaction.accountId || '');
        setTargetAccountId(editingTransaction.targetAccountId || '');
        setCardId(editingTransaction.cardId || '');
        setPaymentMethod(editingTransaction.cardId ? 'card' : 'account');
        setIsPaid(editingTransaction.status === 'completed');
        setRecurring(editingTransaction.recurring || false);
        setNotes(editingTransaction.notes || '');
        setTags(editingTransaction.tags || []);
        setTargetInvoiceMonth(editingTransaction.date ? editingTransaction.date.substring(0, 7) : invoiceMonths[1]?.key || '');
      } else {
        setType(initialType);
        setDescription('');
        setAmount('');
        setDate(getTodayString());
        const defaultCat = categories.filter(c => c.type === (initialType === 'income' ? 'income' : 'expense'))[0]?.id || '';
        setCategoryId(defaultCat);
        setSubcategoryId('');
        setAccountId(initialAccountId || accounts[0]?.id || '');
        setTargetAccountId(accounts[1]?.id || accounts[0]?.id || '');
        setCardId(initialCardId || cards[0]?.id || '');
        setPaymentMethod(initialPaymentMethod || (initialCardId ? 'card' : 'account'));
        setIsPaid(true);
        setRecurring(false);
        setIsRepeat(false);
        setRepeatAmount('2');
        setRepeatPeriod('months');
        setIgnoreTransaction(false);
        setShowMoreDetails(false);
        setNotes('');
        setTags([]);
        setTargetInvoiceMonth(invoiceMonths[1]?.key || '');
      }
    }
  }, [isOpen, editingTransaction?.id, initialType, initialAccountId, initialCardId, initialPaymentMethod, invoiceMonths]);

  // Update categories filter based on type
  const filteredCategories = useMemo(() => {
    if (type === 'income') return categories.filter(c => c.type === 'income');
    return categories.filter(c => c.type === 'expense');
  }, [categories, type]);

  const selectedCategory = categories.find(c => c.id === categoryId);

  // Dynamic modal title based on Mobills specification
  const modalTitle = useMemo(() => {
    if (editingTransaction) return 'Editar Lançamento';
    if (type === 'transfer') return 'Nova Transferência';
    if (paymentMethod === 'card') {
      return recurring ? 'Nova despesa fixa do cartão de crédito' : 'Nova despesa cartão de crédito';
    }
    if (type === 'income') {
      return recurring ? 'Nova Receita Fixa' : 'Nova Receita';
    }
    return recurring ? 'Nova Despesa Fixa' : 'Nova Despesa';
  }, [editingTransaction, type, paymentMethod, recurring]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const roundedAmount = round2(numAmount);
    const selectedCard = cards.find(c => c.id === cardId) || cards[0];
    const allocation = (paymentMethod === 'card' && selectedCard)
      ? allocateCardTransaction(date, selectedCard.closingDay, selectedCard.dueDay)
      : null;

    const finalStatus: TransactionStatus = isPaid ? 'completed' : 'pending';

    const txData: Omit<Transaction, 'id' | 'createdAt'> = {
      description: description.trim() || (type === 'transfer' ? 'Transferência entre contas' : 'Lançamento'),
      amount: roundedAmount,
      type,
      date: date,
      purchaseDate: date,
      dueDate: allocation?.dueDate,
      invoiceMonth: targetInvoiceMonth || allocation?.invoiceMonth,
      categoryId: type === 'transfer' ? 'cat-transferencia' : categoryId,
      subcategoryId: type === 'transfer' ? undefined : subcategoryId || undefined,
      accountId: paymentMethod === 'account' ? (accountId || accounts[0]?.id || 'acc-carteira-padrao') : undefined,
      targetAccountId: type === 'transfer' ? targetAccountId : undefined,
      cardId: paymentMethod === 'card' ? (cardId || cards[0]?.id) : undefined,
      status: paymentMethod === 'card' ? 'pending' : finalStatus,
      recurring,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : [],
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, txData);
    } else {
      // If repeat / installment is enabled
      const repeatCount = parseInt(repeatAmount) || 1;
      if (isRepeat && repeatCount > 1) {
        if (paymentMethod === 'card') {
          // Installments on card
          const installmentVal = round2(roundedAmount / repeatCount);
          for (let i = 0; i < repeatCount; i++) {
            const d = new Date(date);
            d.setMonth(d.getMonth() + i);
            const installmentDate = d.toISOString().substring(0, 10);
            const instAlloc = selectedCard ? allocateCardTransaction(installmentDate, selectedCard.closingDay, selectedCard.dueDay) : null;
            addTransaction({
              ...txData,
              description: `${txData.description} (${i + 1}/${repeatCount})`,
              amount: installmentVal,
              date: installmentDate,
              purchaseDate: date,
              invoiceMonth: instAlloc?.invoiceMonth,
              dueDate: instAlloc?.dueDate,
              installments: {
                current: i + 1,
                total: repeatCount,
              },
            });
          }
        } else {
          // Normal recurring repeat
          for (let i = 0; i < repeatCount; i++) {
            const d = new Date(date);
            if (repeatPeriod === 'days') d.setDate(d.getDate() + i);
            else if (repeatPeriod === 'weeks') d.setDate(d.getDate() + i * 7);
            else if (repeatPeriod === 'months') d.setMonth(d.getMonth() + i);
            else if (repeatPeriod === 'years') d.setFullYear(d.getFullYear() + i);

            addTransaction({
              ...txData,
              description: repeatCount > 1 ? `${txData.description} (${i + 1}/${repeatCount})` : txData.description,
              date: d.toISOString().substring(0, 10),
            });
          }
        }
      } else {
        addTransaction(txData);
      }
    }

    if (saveAndNew) {
      setDescription('');
      setAmount('');
      setDate(getTodayString());
      setNotes('');
      setTags([]);
    } else {
      onClose();
    }
  };

  const isAmountValid = !!amount && parseFloat(amount) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ========================================================================= */}
        {/* 1. TOP CURRENCY VALUE BOX (MOBILLS EXACT SPEC: R$ | 0,00 | BRL + SWITCH) */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-[22px] bg-slate-50 dark:bg-[#1e222d] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl font-black text-slate-400">R$</span>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={amount}
              onChange={e => {
                const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                setAmount(val);
              }}
              autoFocus
              className={`w-full text-2xl font-black bg-transparent border-none focus:outline-none tracking-tight ${
                type === 'income'
                  ? 'text-[#66bb6a]'
                  : type === 'expense'
                  ? 'text-[#ef5350]'
                  : 'text-[#42a5f5]'
              }`}
            />
            <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase shrink-0">
              BRL
            </span>
          </div>

          {/* Paid / Received Status Switch (For non-card accounts) */}
          {paymentMethod === 'account' && type !== 'transfer' && (
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {type === 'income' ? 'Foi recebida' : 'Foi paga'}
              </span>
              <input
                type="checkbox"
                checked={isPaid}
                onChange={e => setIsPaid(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          )}
        </div>

        {!isAmountValid && amount !== '' && (
          <p className="text-[11px] font-bold text-rose-500 px-1 -mt-2">Deve ter um valor diferente de 0</p>
        )}

        {/* Payment Method Switcher (Conta Bancária vs Cartão de Crédito) */}
        {type === 'expense' && (
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setPaymentMethod('account')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'account'
                  ? 'bg-white dark:bg-[#2C2C2E] text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Conta Bancária</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'card'
                  ? 'bg-white dark:bg-[#2C2C2E] text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <CardIcon className="w-3.5 h-3.5" />
              <span>Cartão de Crédito</span>
            </button>
          </div>
        )}


        {/* ========================================================================= */}
        {/* 2. DATE WITH QUICK CHIPS ([HOJE], [ONTEM], [OUTROS...]) */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Data *</label>
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setDate(getTodayString())}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setDate(d.toISOString().substring(0, 10));
                }}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors cursor-pointer"
              >
                Ontem
              </button>
            </div>
          </div>
          <input
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
          />
        </div>

        {/* ========================================================================= */}
        {/* 3. DESCRIPTION */}
        {/* ========================================================================= */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Descrição *</label>
          <input
            type="text"
            required
            placeholder={
              type === 'income'
                ? 'Ex: Salário mensal, Freelance, Dividendos...'
                : paymentMethod === 'card'
                ? 'Ex: Supermercado, Restaurante, Combustível...'
                : type === 'transfer'
                ? 'Ex: Transferência Poupança, PIX...'
                : 'Ex: Conta de luz, Aluguel, Farmácia...'
            }
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
          />
        </div>

        {/* ========================================================================= */}
        {/* 4. CATEGORY & SUBCATEGORY (EXCEPT TRANSFER) */}
        {/* ========================================================================= */}
        {type !== 'transfer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria *</label>
              <select
                value={categoryId}
                onChange={e => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
              >
                <option value="">Selecione uma categoria...</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subcategoria</label>
              <select
                value={subcategoryId}
                onChange={e => setSubcategoryId(e.target.value)}
                disabled={!selectedCategory || !selectedCategory.subcategories?.length}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 disabled:opacity-50 shadow-xs"
              >
                <option value="">Nenhuma subcategoria</option>
                {selectedCategory?.subcategories?.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.icon || '📁'} {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. ACCOUNT / CARD DESTINATION */}
        {/* ========================================================================= */}
        {type === 'transfer' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta de Origem (De) *</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance, user.currency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta de Destino (Para) *</label>
              <select
                value={targetAccountId}
                onChange={e => setTargetAccountId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                    {acc.name} ({formatCurrency(acc.balance, user.currency)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : paymentMethod === 'card' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cartão de Crédito *</label>
                <select
                  value={cardId}
                  onChange={e => setCardId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
                >
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>
                      💳 {c.name} ({c.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fatura de Destino</label>
                <select
                  value={targetInvoiceMonth}
                  onChange={e => setTargetInvoiceMonth(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
                >
                  {invoiceMonths.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Cycle Information Banner */}
            {(() => {
              const selCard = cards.find(c => c.id === cardId) || cards[0];
              if (!selCard) return null;
              const alloc = allocateCardTransaction(date, selCard.closingDay, selCard.dueDay);
              return (
                <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40 text-[11px] text-purple-800 dark:text-purple-300 flex items-center justify-between flex-wrap gap-1">
                  <span>📅 Alocada na fatura: <strong>{targetInvoiceMonth || alloc.invoiceMonth}</strong> (Vencimento dia {selCard.dueDay})</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Fechamento: dia {selCard.closingDay}</span>
                </div>
              );
            })()}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta Bancária *</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance, user.currency)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Switch: Ignorar transação */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Ignorar transação no planejamento</span>
          <input
            type="checkbox"
            checked={ignoreTransaction}
            onChange={e => setIgnoreTransaction(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
          />
        </div>

        {/* ========================================================================= */}
        {/* 6. EXPANDABLE "MAIS DETALHES" ACCORDION */}
        {/* ========================================================================= */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showMoreDetails ? 'Menos detalhes' : 'Mais detalhes'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreDetails ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showMoreDetails && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            {/* Tags Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[42px] items-center">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-bold"
                  >
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={tags.length === 0 ? "Pressione Enter para adicionar tag..." : "+ tag"}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 min-w-[120px] text-xs bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Notes Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Observação</label>
              <textarea
                placeholder="Anotações adicionais sobre este lançamento..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Fixed switch */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {type === 'income' ? 'Receita fixa' : 'Despesa fixa'}
              </span>
              <input
                type="checkbox"
                checked={recurring}
                onChange={e => {
                  setRecurring(e.target.checked);
                  if (e.target.checked) setIsRepeat(false);
                }}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 cursor-pointer"
              />
            </div>

            {/* Repeat / Installment switch */}
            {!recurring && (
              <>
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {paymentMethod === 'card' ? 'Parcelado' : 'Repetir'}
                  </span>
                  <input
                    type="checkbox"
                    checked={isRepeat}
                    onChange={e => setIsRepeat(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 cursor-pointer"
                  />
                </div>

                {isRepeat && (
                  <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 flex items-center justify-between gap-3 text-xs flex-wrap">
                    <span className="font-bold text-purple-900 dark:text-purple-300">
                      {paymentMethod === 'card' ? 'Quantidade de parcelas:' : 'Repetir por:'}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="2"
                        max="72"
                        value={repeatAmount}
                        onChange={e => setRepeatAmount(e.target.value)}
                        className="w-16 px-2.5 py-1 rounded-lg border border-purple-300 bg-white dark:bg-slate-800 text-center font-black"
                      />
                      <span className="font-bold text-slate-500">vezes</span>

                      {paymentMethod !== 'card' && (
                        <select
                          value={repeatPeriod}
                          onChange={e => setRepeatPeriod(e.target.value as any)}
                          className="px-2.5 py-1 rounded-lg border border-purple-300 bg-white dark:bg-slate-800 font-bold"
                        >
                          <option value="months">Meses</option>
                          <option value="days">Dias</option>
                          <option value="weeks">Semanas</option>
                          <option value="years">Anos</option>
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. FOOTER ACTION BUTTONS (CANCELAR / SALVAR E CRIAR NOVA / SALVAR) */}
        {/* ========================================================================= */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {!editingTransaction && (
              <button
                type="submit"
                onClick={() => setSaveAndNew(true)}
                disabled={!isAmountValid}
                className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black text-purple-600 dark:text-purple-400 disabled:opacity-40 cursor-pointer"
              >
                Salvar e criar nova
              </button>
            )}

            <button
              type="submit"
              onClick={() => setSaveAndNew(false)}
              disabled={!isAmountValid}
              className={`px-6 py-2.5 rounded-full text-white text-xs font-black shadow-md disabled:opacity-40 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              {editingTransaction ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
