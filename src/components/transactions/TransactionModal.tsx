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
  Bell,
  Upload,
  Trash2,
  FileText,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { DatePicker } from '../ui/DatePicker';
import { useFinancial } from '../../context/FinancialContext';
import { Transaction, TransactionType, TransactionStatus } from '../../types';
import { formatCurrency, formatLocalDateISO, getTodayString, round2 } from '../../utils/formatters';
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
  onNavigateToTab?: (tab: string) => void;
  onOpenNewCard?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  initialAccountId,
  initialCardId,
  initialPaymentMethod,
  editingTransaction = null,
  onNavigateToTab,
  onOpenNewCard,
}) => {
  const { categories, accounts, cards, addTransaction, updateTransaction, user } = useFinancial();

  const [type, setType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [centsAmount, setCentsAmount] = useState<number>(() => {
    if (editingTransaction?.amount) {
      return Math.round(Number(editingTransaction.amount) * 100);
    }
    return 0;
  });
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
  const [isThirdParty, setIsThirdParty] = useState(false);
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [saveAndNew, setSaveAndNew] = useState(false);
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [targetInvoiceMonth, setTargetInvoiceMonth] = useState('');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'monthly' | 'weekly' | 'daily' | 'yearly'>('monthly');
  const [repeatCalculationMode, setRepeatCalculationMode] = useState<'split' | 'full'>('full');
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(0);
  const [reminderTime, setReminderTime] = useState<string>('09:00');

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
      list.push({ key: k, label: cap });
    }
    return list;
  }, []);

  // Initialize ONLY when opening modal or switching editing transaction
  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const isSwitchingTx = isOpen && editingTransaction?.id !== prevEditingIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevEditingIdRef.current = editingTransaction?.id || null;

    if (!isOpen) return;

    if (isOpening || isSwitchingTx) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setDescription(editingTransaction.description || '');
        const c = editingTransaction.amount ? Math.round(Number(editingTransaction.amount) * 100) : 0;
        setCentsAmount(c);
        setAmount(c > 0 ? (c / 100).toFixed(2) : '');
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
        setIgnoreTransaction(!!editingTransaction.ignored);
        setIsThirdParty(!!editingTransaction.isThirdParty);
        setThirdPartyName(editingTransaction.thirdPartyName || '');
        setNotes(editingTransaction.notes || '');
        setTags(editingTransaction.tags || []);
        setRecurrenceFrequency(editingTransaction.recurrenceFrequency || 'monthly');
        setAttachmentUrl(editingTransaction.attachmentUrl);
        setAttachmentName(editingTransaction.attachmentName);
        setReminderEnabled(!!editingTransaction.reminder?.enabled);
        setReminderDaysBefore(editingTransaction.reminder?.daysBefore ?? 0);
        setReminderTime(editingTransaction.reminder?.reminderTime || '09:00');
        setTargetInvoiceMonth(editingTransaction.date ? editingTransaction.date.substring(0, 7) : invoiceMonths[1]?.key || '');
      } else {
        setType(initialType);
        setDescription('');
        setCentsAmount(0);
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
        setRecurrenceFrequency('monthly');
        setIsRepeat(false);
        setRepeatAmount('2');
        setRepeatPeriod('months');
        setRepeatCalculationMode('full');
        setIgnoreTransaction(false);
        setIsThirdParty(false);
        setThirdPartyName('');
        setAttachmentUrl(undefined);
        setAttachmentName(undefined);
        setReminderEnabled(false);
        setReminderDaysBefore(0);
        setReminderTime('09:00');
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

  const todayStr = getTodayString();
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatLocalDateISO(d);
  }, []);

  const isToday = date === todayStr;
  const isYesterday = date === yesterdayStr;
  const isOther = !isToday && !isYesterday;

  const activeDatePillColor = useMemo(() => {
    if (type === 'income') return 'bg-[#66bb6a] text-white shadow-xs';
    if (type === 'expense' && paymentMethod === 'card') return 'bg-teal-500 text-white shadow-xs';
    if (type === 'expense') return 'bg-[#ef5350] text-white shadow-xs';
    return 'bg-purple-600 text-white shadow-xs';
  }, [type, paymentMethod]);

  const inactiveDatePillStyle = 'bg-slate-200/90 dark:bg-[#3f3f46] text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-[#52525b]';

  const formatCustomDateLabel = (dStr: string) => {
    if (!dStr) return 'Outros...';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dStr;
  };

  // Helper to format cents into Brazilian Real string
  const formatCentsToDisplay = (cents: number): string => {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const displayAmount = useMemo(() => {
    return formatCentsToDisplay(centsAmount);
  }, [centsAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, '');
    if (!digits || digits === '0') {
      setCentsAmount(0);
      setAmount('');
      return;
    }
    const trimmed = digits.slice(-11);
    const cents = parseInt(trimmed, 10) || 0;
    setCentsAmount(cents);
    setAmount((cents / 100).toFixed(2));
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const str = centsAmount.toString();
      if (str.length <= 1) {
        setCentsAmount(0);
        setAmount('');
      } else {
        const nextCents = parseInt(str.slice(0, -1), 10) || 0;
        setCentsAmount(nextCents);
        setAmount(nextCents > 0 ? (nextCents / 100).toFixed(2) : '');
      }
    }
  };

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
      recurrenceFrequency: recurring ? recurrenceFrequency : undefined,
      attachmentUrl: attachmentUrl || undefined,
      attachmentName: attachmentName || undefined,
      reminder: reminderEnabled ? {
        enabled: true,
        daysBefore: reminderDaysBefore,
        reminderTime: reminderTime || '09:00',
      } : undefined,
      ignored: ignoreTransaction || isThirdParty,
      isThirdParty,
      thirdPartyName: isThirdParty ? thirdPartyName.trim() : undefined,
      reimbursed: editingTransaction?.reimbursed || false,
      notes: notes.trim() || undefined,
      tags: isThirdParty && !tags.includes('Terceiros') ? [...tags, 'Terceiros'] : tags,
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
          // Normal recurring repeat (split vs full)
          const finalVal = repeatCalculationMode === 'split' ? round2(roundedAmount / repeatCount) : roundedAmount;
          for (let i = 0; i < repeatCount; i++) {
            const d = new Date(date);
            if (repeatPeriod === 'days') d.setDate(d.getDate() + i);
            else if (repeatPeriod === 'weeks') d.setDate(d.getDate() + i * 7);
            else if (repeatPeriod === 'months') d.setMonth(d.getMonth() + i);
            else if (repeatPeriod === 'years') d.setFullYear(d.getFullYear() + i);

            addTransaction({
              ...txData,
              description: repeatCount > 1 ? `${txData.description} (${i + 1}/${repeatCount})` : txData.description,
              amount: finalVal,
              date: d.toISOString().substring(0, 10),
              installments: {
                current: i + 1,
                total: repeatCount,
              },
            });
          }
        }
      } else {
        addTransaction(txData);
      }
    }

    if (saveAndNew) {
      setDescription('');
      setCentsAmount(0);
      setAmount('');
      setDate(getTodayString());
      setNotes('');
      setTags([]);
    } else {
      onClose();
    }
  };

  const isAmountValid = centsAmount > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
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
                form="transaction-form"
                onClick={() => setSaveAndNew(true)}
                disabled={!isAmountValid}
                className="px-3.5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black text-purple-600 dark:text-purple-400 disabled:opacity-40 cursor-pointer"
              >
                Salvar e criar
              </button>
            )}

            <button
              type="submit"
              form="transaction-form"
              onClick={() => setSaveAndNew(false)}
              disabled={!isAmountValid}
              className={`px-5 sm:px-6 py-2.5 rounded-full text-white text-xs font-black shadow-md disabled:opacity-40 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${
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
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-3.5">
        {/* ========================================================================= */}
        {/* 0. PRIMARY TRANSACTION TYPE SELECTOR (DESPESA | RECEITA | CARTÃO | TRANSFERÊNCIA) */}
        {/* ========================================================================= */}
        {!editingTransaction && (
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
            {/* 1. Despesa */}
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setPaymentMethod('account');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'expense' && paymentMethod === 'account'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Despesa</span>
            </button>

            {/* 2. Receita */}
            <button
              type="button"
              onClick={() => {
                setType('income');
                setPaymentMethod('account');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Receita</span>
            </button>

            {/* 3. Despesa de Cartão */}
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setPaymentMethod('card');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'expense' && paymentMethod === 'card'
                  ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/30 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-teal-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <CardIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cartão</span>
            </button>

            {/* 4. Transferência */}
            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setPaymentMethod('account');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'transfer'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Transf.</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. TOP VALUE BOX (DYNAMIC RIGHT-TO-LEFT REAL-TIME MONEY MASK) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-xs">
          <div className="inline-flex items-center justify-center gap-2 max-w-full">
            <span className="text-2xl sm:text-3xl font-black text-slate-400 dark:text-slate-500 select-none">
              R$
            </span>
            <input
              type="text"
              inputMode="numeric"
              required
              value={displayAmount}
              onKeyDown={handleAmountKeyDown}
              onChange={handleAmountChange}
              onFocus={e => {
                const len = e.target.value.length;
                e.target.setSelectionRange(len, len);
              }}
              onClick={e => {
                const len = (e.target as HTMLInputElement).value.length;
                (e.target as HTMLInputElement).setSelectionRange(len, len);
              }}
              className={`borderless-money-input text-center text-3xl sm:text-4xl font-black bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ring-0 ring-offset-0 shadow-none tracking-tight p-0 ${
                type === 'income'
                  ? 'text-[#66bb6a]'
                  : type === 'expense' && paymentMethod === 'card'
                  ? 'text-teal-500'
                  : type === 'expense'
                  ? 'text-[#ef5350]'
                  : 'text-[#42a5f5]'
              }`}
              style={{
                width: `${Math.max(displayAmount.length + 1, 5)}ch`,
                outline: 'none',
                boxShadow: 'none',
                border: 'none',
                caretColor: type === 'income' ? '#66bb6a' : type === 'expense' ? '#ef5350' : '#7C4DFF',
              }}
            />
          </div>
        </div>

        {!isAmountValid && centsAmount === 0 && (
          <p className="text-center text-[11px] font-bold text-slate-400 -mt-2">Digite o valor da transação</p>
        )}

        {/* ========================================================================= */}
        {/* 1.5 STATUS SEGMENTED CONTROL: PAGO / PENDENTE | RECEBIDO / A RECEBER */}
        {/* ========================================================================= */}
        {paymentMethod === 'account' && type !== 'transfer' && (
          <div className="flex justify-center -mt-1 mb-1">
            <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPaid
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{type === 'income' ? 'Recebido' : 'Pago'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  !isPaid
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{type === 'income' ? 'A Receber' : 'Pendente'}</span>
              </button>
            </div>
          </div>
        )}


        {/* ========================================================================= */}
        {/* 2. DATE WITH QUICK CHIPS & CUSTOM THEMED DATEPICKER */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Data *</label>
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setDate(todayStr)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer select-none font-bold ${
                  date === todayStr
                    ? activeDatePillColor
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setDate(yesterdayStr)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer select-none font-bold ${
                  date === yesterdayStr
                    ? activeDatePillColor
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Ontem
              </button>
            </div>
          </div>
          <DatePicker
            value={date}
            onChange={setDate}
            variant="modal"
            showPresets={true}
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

        {/* ========================================================================= */}
        {/* COMPRA DE TERCEIROS (CARTÃO EMPRESTADO) & IGNORAR TRANSAÇÃO (MOBILLS SPEC) */}
        {/* ========================================================================= */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E222D] border border-slate-200/80 dark:border-slate-800 space-y-3">
          {/* Switch: Compra de Terceiro */}
          {paymentMethod === 'card' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>👤</span> Compra de terceiro (Cartão emprestado)
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Consta na fatura do cartão, mas não afeta seus relatórios e orçamentos
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isThirdParty}
                  onChange={e => {
                    setIsThirdParty(e.target.checked);
                    if (e.target.checked) setIgnoreTransaction(true);
                  }}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {isThirdParty && (
                <div className="pt-1 animate-in fade-in space-y-1">
                  <label className="block text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    Nome da pessoa *
                  </label>
                  <input
                    type="text"
                    required={isThirdParty}
                    placeholder="Ex: Carlos (Amigo), Mãe, João..."
                    value={thirdPartyName}
                    onChange={e => setThirdPartyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Switch: Ignorar transação */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                🚫 Ignorar no planejamento e relatórios
              </span>
              <p className="text-[10px] text-slate-400">
                Mantém o registro na fatura sem impactar suas despesas e gráficos
              </p>
            </div>
            <input
              type="checkbox"
              checked={ignoreTransaction}
              onChange={e => setIgnoreTransaction(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
            />
          </div>
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
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            {/* 1. TAGS COM SUGESTÕES RÁPIDAS (MOBILLS SPEC) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  🏷️ Tags Personalizadas
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">Agrupe para filtros e relatórios</span>
              </div>

              {/* Sugestões rápidas de Tags */}
              <div className="flex flex-wrap gap-1 items-center pb-1">
                <span className="text-[10px] font-bold text-slate-400">Sugestões:</span>
                {['Aluguel', 'Mercado', 'Trabalho', 'Viagem', 'Lazer', 'Assinatura', 'Saúde', 'Educação'].map(sugg => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => {
                      if (!tags.includes(sugg)) {
                        setTags([...tags, sugg]);
                      }
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    +{sugg}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[42px] items-center">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-bold"
                  >
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500 cursor-pointer">
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

            {/* 2. OBSERVAÇÃO DETALHADA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                📝 Observação
              </label>
              <textarea
                placeholder="Anotações adicionais, detalhes da compra ou notas fiscais..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs"
              />
            </div>

            {/* 3. ANEXAR COMPROVANTE / RECIBO / NOTA FISCAL (MOBILLS SPEC) */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E222D] border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Anexar Comprovante ou Recibo
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Guarde fotos de notas fiscais, recibos ou comprovantes PDF
                  </p>
                </div>

                <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{attachmentName ? 'Alterar Arquivo' : 'Escolher Arquivo'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAttachmentName(file.name);
                      const reader = new FileReader();
                      reader.onload = () => {
                        setAttachmentUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {attachmentName && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {attachmentUrl && attachmentUrl.startsWith('data:image') ? (
                      <img src={attachmentUrl} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-purple-300 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{attachmentName}</p>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">✓ Comprovante anexado</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentUrl(undefined);
                      setAttachmentName(undefined);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Remover anexo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 4. LEMBRETE DE NOTIFICAÇÃO (MOBILLS SPEC) */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E222D] border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    Lembrete de Pagamento
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Receba notificações para não esquecer de efetivar o pagamento
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={e => setReminderEnabled(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 cursor-pointer"
                />
              </div>

              {reminderEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Quando lembrar
                    </label>
                    <select
                      value={reminderDaysBefore}
                      onChange={e => setReminderDaysBefore(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
                    >
                      <option value="0">No dia do vencimento</option>
                      <option value="1">1 dia antes</option>
                      <option value="2">2 dias antes</option>
                      <option value="3">3 dias antes</option>
                      <option value="7">1 semana antes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Horário do lembrete
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={e => setReminderTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. LANÇAMENTO FIXO (RECORRÊNCIA CONTÍNUA) */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E222D] border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    {type === 'income' ? 'Receita Fixa' : 'Despesa Fixa'}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Lançamento que se repete continuamente todos os períodos
                  </p>
                </div>
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

              {recurring && (
                <div className="pt-1 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Frequência de Repetição
                  </label>
                  <select
                    value={recurrenceFrequency}
                    onChange={e => setRecurrenceFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
                  >
                    <option value="monthly">Mensal (Todo mês)</option>
                    <option value="weekly">Semanal (Toda semana)</option>
                    <option value="daily">Diária (Todo dia)</option>
                    <option value="yearly">Anual (Todo ano)</option>
                  </select>
                </div>
              )}
            </div>

            {/* 6. REPETIR / PARCELADO (RECORRÊNCIA LIMITADA) */}
            {!recurring && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E222D] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#ff8a00]" />
                      {paymentMethod === 'card' ? 'Parcelado no Cartão' : 'Repetir por período limitado'}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {paymentMethod === 'card'
                        ? 'Cria parcelas automáticas nas faturas mensais'
                        : 'Repete o lançamento por uma quantidade definida de vezes'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRepeat}
                    onChange={e => setIsRepeat(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 cursor-pointer"
                  />
                </div>

                {isRepeat && (
                  <div className="space-y-3 pt-1 animate-in fade-in">
                    <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {paymentMethod === 'card' ? 'Quantidade de parcelas:' : 'Repetir por:'}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="2"
                          max="72"
                          value={repeatAmount}
                          onChange={e => setRepeatAmount(e.target.value)}
                          className="w-16 px-2.5 py-1 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 text-center font-black text-xs"
                        />
                        <span className="font-bold text-slate-500 text-xs">vezes</span>

                        {paymentMethod !== 'card' && (
                          <select
                            value={repeatPeriod}
                            onChange={e => setRepeatPeriod(e.target.value as any)}
                            className="px-2.5 py-1 rounded-xl border border-purple-300 bg-white dark:bg-slate-800 font-bold text-xs"
                          >
                            <option value="months">Meses</option>
                            <option value="days">Dias</option>
                            <option value="weeks">Semanas</option>
                            <option value="years">Anos</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Modo de cálculo (se conta bancária) */}
                    {paymentMethod !== 'card' && (
                      <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40 text-xs space-y-1.5">
                        <span className="block font-bold text-purple-900 dark:text-purple-300 text-[11px]">
                          Como calcular o valor de cada lançamento:
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <input
                              type="radio"
                              name="repeatCalc"
                              checked={repeatCalculationMode === 'full'}
                              onChange={() => setRepeatCalculationMode('full')}
                              className="text-purple-600"
                            />
                            <span>Repetir valor cheio ({formatCurrency(parseFloat(amount) || 0, user.currency)} cada)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <input
                              type="radio"
                              name="repeatCalc"
                              checked={repeatCalculationMode === 'split'}
                              onChange={() => setRepeatCalculationMode('split')}
                              className="text-purple-600"
                            />
                            <span>Dividir total ({formatCurrency(round2((parseFloat(amount) || 0) / (parseInt(repeatAmount) || 1)), user.currency)} cada)</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6.5 QUICK ENTITY CREATION SHORTCUTS (METAS, DÍVIDAS, INVESTIMENTOS, ETC.) */}
        {/* ========================================================================= */}
        {!editingTransaction && onNavigateToTab && (
          <div className="pt-2.5 pb-0.5 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Criar outros registros:
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab('metas');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>🎯</span> Meta
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab('dividas');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>📉</span> Dívida
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab('investimentos');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>📈</span> Investimento
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab('contas');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>🏦</span> Conta
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenNewCard) onOpenNewCard();
                  else onNavigateToTab('cartoes');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>💳</span> Cartão
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
