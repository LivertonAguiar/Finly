import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, FileText, Layers, Paperclip, Tag, Trash2, Upload } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { DatePicker } from '../ui/DatePicker';
import { useFinancial } from '../../context/FinancialContext';
import type {
  RecurringExpenseSeries,
  SupportedRecurrenceFrequency,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../../types';
import { formatCurrency, getTodayString, round2 } from '../../utils/formatters';
import { buildCardInstallmentSeries, getInvoiceDueDate } from '../../utils/cardInstallmentSeries';
import { reconcileRecurringExpenseSeries } from '../../utils/recurringExpenseSeries';
import { buildTransferTransaction } from '../../utils/transferRules';

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

const fieldClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100';
const labelClass = 'block mb-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300';

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  initialAccountId,
  initialCardId,
  initialPaymentMethod,
  editingTransaction = null,
}) => {
  const {
    categories,
    accounts,
    cards,
    transactionSeries,
    addTransaction,
    addTransactionSeries,
    updateTransaction,
    updateRecurringExpenseAmount,
    user,
  } = useFinancial();
  const [type, setType] = useState<TransactionType>(initialType);
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>('account');
  const [centsAmount, setCentsAmount] = useState<number>(0);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [date, setDate] = useState(getTodayString());
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [invoiceMonth, setInvoiceMonth] = useState('');
  const [installment, setInstallment] = useState(false);
  const [amountMode, setAmountMode] = useState<'total' | 'per_installment'>('total');
  const [installmentCount, setInstallmentCount] = useState(2);
  const [installmentInputStr, setInstallmentInputStr] = useState('2');
  const [isCustomInstallment, setIsCustomInstallment] = useState(false);
  const [alreadyStarted, setAlreadyStarted] = useState(false);
  const [firstTrackedInstallment, setFirstTrackedInstallment] = useState(1);
  const [firstTrackedStr, setFirstTrackedStr] = useState('1');
  const [moreDetails, setMoreDetails] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string>();
  const [attachmentName, setAttachmentName] = useState<string>();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [fixedExpense, setFixedExpense] = useState(false);
  const [frequency, setFrequency] = useState<SupportedRecurrenceFrequency>('monthly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [thirdParty, setThirdParty] = useState(false);
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [ignored, setIgnored] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(0);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [fixedEditScope, setFixedEditScope] = useState<'single' | 'current_and_future'>('single');
  const [overwriteExceptions, setOverwriteExceptions] = useState(false);
  const [error, setError] = useState('');

  const isCard = type === 'expense' && paymentMethod === 'card';
  const isTransfer = type === 'transfer';
  const selectedCard = cards.find(card => card.id === cardId);
  const editingSeries = editingTransaction?.seriesId
    ? transactionSeries.find(series => series.id === editingTransaction.seriesId)
    : undefined;

  const invoiceMonths = useMemo(() => {
    const months: Array<{ value: string; label: string }> = [];
    const now = new Date();
    for (let offset = -12; offset <= 36; offset += 1) {
      const valueDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const value = `${valueDate.getFullYear()}-${String(valueDate.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        value,
        label: valueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      });
    }
    return months;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const tx = editingTransaction;
    const nextType = tx?.type || initialType;
    const nextMethod = tx?.cardId ? 'card' : initialPaymentMethod || (initialCardId ? 'card' : 'account');
    setType(nextType);
    setPaymentMethod(nextMethod);
    if (tx?.amount) {
      const parsedCents = Math.round(Number(tx.amount) * 100);
      setCentsAmount(parsedCents);
      setAmount((parsedCents / 100).toFixed(2));
    } else {
      setCentsAmount(0);
      setAmount('');
    }
    setStatus(tx?.status || 'completed');
    const initialDate = tx?.dueDate && (tx?.status === 'pending') ? tx.dueDate : (tx?.date || getTodayString());
    setDate(initialDate);
    setDueDate(tx?.dueDate || initialDate);
    setDescription(tx?.description?.replace(/\s*\(\d+\/\d+\)\s*$/, '') || '');
    setCategoryId(tx?.categoryId || categories.find(cat => cat.type === (nextType === 'income' ? 'income' : 'expense'))?.id || '');
    setSubcategoryId(tx?.subcategoryId || '');
    setAccountId(tx?.accountId || initialAccountId || accounts[0]?.id || '');
    setTargetAccountId(tx?.targetAccountId || accounts.find(acc => acc.id !== (tx?.accountId || initialAccountId || accounts[0]?.id))?.id || '');
    setCardId(tx?.cardId || initialCardId || cards[0]?.id || '');
    setInvoiceMonth(tx?.invoiceMonth || getTodayString().slice(0, 7));
    setInstallment(Boolean(tx?.installments));
    const count = tx?.installments?.total || 2;
    setInstallmentCount(count);
    setInstallmentInputStr(String(count));
    setIsCustomInstallment(count > 24);
    const tracked = tx?.installments?.current || 1;
    setFirstTrackedInstallment(tracked);
    setFirstTrackedStr(String(tracked));
    setAlreadyStarted(Boolean(tx?.installments && tracked > 1));
    setMoreDetails(false);
    setAttachmentUrl(tx?.attachmentUrl);
    setAttachmentName(tx?.attachmentName);
    setTags(tx?.tags || []);
    setNotes(tx?.notes || '');
    setFixedExpense(editingSeries?.kind === 'recurring_expense' || Boolean(tx?.recurring));
    setFrequency(editingSeries?.kind === 'recurring_expense' ? editingSeries.frequency : (
      tx?.recurrenceFrequency === 'weekly' || tx?.recurrenceFrequency === 'yearly'
        ? tx.recurrenceFrequency : 'monthly'
    ));
    setRecurrenceEndDate(editingSeries?.endDate || '');
    setThirdParty(Boolean(tx?.isThirdParty));
    setThirdPartyName(tx?.thirdPartyName || '');
    setIgnored(Boolean(tx?.ignored));
    setReminderEnabled(Boolean(tx?.reminder?.enabled));
    setReminderDaysBefore(tx?.reminder?.daysBefore ?? 0);
    setReminderTime(tx?.reminder?.reminderTime || '09:00');
    setFixedEditScope('single');
    setOverwriteExceptions(false);
    setError('');
  }, [isOpen, editingTransaction?.id, initialType, initialAccountId, initialCardId, initialPaymentMethod]);

  useEffect(() => {
    if (!isCard || !selectedCard || editingTransaction) return;
    if (!invoiceMonth) setInvoiceMonth(getTodayString().slice(0, 7));
  }, [isCard, selectedCard?.id, editingTransaction?.id]);

  const filteredCategories = categories.filter(category =>
    category.type === (type === 'income' ? 'income' : 'expense'),
  );
  const selectedCategory = filteredCategories.find(category => category.id === categoryId);
  const amountNumber = round2(centsAmount / 100);

  const dateLabel = useMemo(() => {
    if (isTransfer) return 'DATA DA TRANSFERÊNCIA';
    if (isCard) return 'DATA DA COMPRA';
    if (status === 'pending') {
      return type === 'income' ? 'DATA PREVISTA DE RECEBIMENTO' : 'DATA DE VENCIMENTO';
    }
    return type === 'income' ? 'DATA DO RECEBIMENTO' : 'DATA DO PAGAMENTO';
  }, [isTransfer, isCard, status, type]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setDueDate(newDate);
  };

  const formatCentsToDisplay = (cents: number): string => {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const displayAmount = useMemo(() => formatCentsToDisplay(centsAmount), [centsAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits || digits === '0') {
      setCentsAmount(0);
      setAmount('');
      return;
    }
    const trimmed = digits.slice(-11);
    const cents = parseInt(trimmed, 10) || 0;
    setCentsAmount(cents);
    setAmount(cents > 0 ? (cents / 100).toFixed(2) : '');
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
  const installmentPreview = useMemo(() => {
    if (!isCard || !installment || !selectedCard || amountNumber <= 0) return null;
    try {
      return buildCardInstallmentSeries({
        seriesId: 'preview', description: description || 'Compra parcelada', amount: amountNumber,
        amountInputMode: amountMode, totalInstallments: installmentCount,
        firstTrackedInstallment: alreadyStarted ? firstTrackedInstallment : 1,
        purchaseDate: date, firstInvoiceMonth: invoiceMonth, cardId: selectedCard.id,
        cardClosingDay: selectedCard.closingDay, cardDueDay: selectedCard.dueDay,
        categoryId: categoryId || 'preview', subcategoryId: subcategoryId || undefined,
        ignored, isThirdParty: thirdParty, thirdPartyName, tags, notes,
        attachmentUrl, attachmentName, createdAt: new Date().toISOString(),
      });
    } catch {
      return null;
    }
  }, [isCard, installment, selectedCard, amountNumber, amountMode, installmentCount, alreadyStarted, firstTrackedInstallment, date, invoiceMonth, description, categoryId, subcategoryId, ignored, thirdParty, thirdPartyName, tags, notes, attachmentUrl, attachmentName]);

  const formatInvoiceMonthShort = (monthStr?: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    const formatted = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const calculateInstallmentOption = (count: number) => {
    if (amountNumber <= 0) {
      return { installmentAmount: 0, totalAmount: 0 };
    }
    if (amountMode === 'total') {
      const installmentAmount = round2(amountNumber / count);
      return { installmentAmount, totalAmount: amountNumber };
    } else {
      const totalAmount = round2(amountNumber * count);
      return { installmentAmount: amountNumber, totalAmount };
    }
  };

  const handleInstallmentInputChange = (rawVal: string) => {
    const digits = rawVal.replace(/\D/g, '');
    const clean = digits.replace(/^0+/, '');
    setInstallmentInputStr(clean);
    if (clean !== '') {
      const num = parseInt(clean, 10);
      if (!isNaN(num) && num >= 1) {
        const clamped = Math.min(72, num);
        setInstallmentCount(clamped);
        setIsCustomInstallment(clamped > 24);
      }
    }
  };

  const handleInstallmentInputBlur = () => {
    const num = parseInt(installmentInputStr, 10);
    if (isNaN(num) || num < 2) {
      setInstallmentCount(2);
      setInstallmentInputStr('2');
      setIsCustomInstallment(false);
    } else {
      const clamped = Math.min(72, num);
      setInstallmentCount(clamped);
      setInstallmentInputStr(String(clamped));
      setIsCustomInstallment(clamped > 24);
    }
  };

  const handleFirstTrackedChange = (rawVal: string) => {
    const digits = rawVal.replace(/\D/g, '');
    const clean = digits.replace(/^0+/, '');
    setFirstTrackedStr(clean);
    if (clean !== '') {
      const num = parseInt(clean, 10);
      if (!isNaN(num) && num >= 1) {
        const clamped = Math.min(installmentCount, num);
        setFirstTrackedInstallment(clamped);
      }
    }
  };

  const handleFirstTrackedBlur = () => {
    const num = parseInt(firstTrackedStr, 10);
    if (isNaN(num) || num < 1) {
      setFirstTrackedInstallment(1);
      setFirstTrackedStr('1');
    } else {
      const clamped = Math.min(installmentCount, num);
      setFirstTrackedInstallment(clamped);
      setFirstTrackedStr(String(clamped));
    }
  };

  const tagInputRef = useRef<HTMLInputElement>(null);

  const addTag = (textToAdd?: string) => {
    const candidate = typeof textToAdd === 'string' ? textToAdd : tagInput;
    if (!candidate.trim()) {
      tagInputRef.current?.focus();
      return;
    }
    const parts = candidate.split(/[,;]+/).map(p => p.trim().replace(/^#+/, '')).filter(Boolean);
    if (parts.length > 0) {
      setTags(prev => {
        const next = [...prev];
        for (const part of parts) {
          if (!next.includes(part)) next.push(part);
        }
        return next;
      });
    }
    setTagInput('');
    tagInputRef.current?.focus();
  };

  const handleAttachment = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentUrl(String(reader.result));
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const baseTransaction = (): Omit<Transaction, 'id' | 'createdAt'> => ({
    description: description.trim() || (isTransfer ? 'Transferência entre contas' : 'Lançamento'),
    amount: amountNumber,
    type,
    date,
    dueDate: type === 'expense' && !isCard && (status === 'pending' || reminderEnabled) ? (dueDate || date) : (dueDate || undefined),
    purchaseDate: isCard ? date : undefined,
    categoryId: isTransfer ? 'cat-transferencia' : categoryId,
    subcategoryId: isTransfer ? undefined : subcategoryId || undefined,
    accountId: isCard ? undefined : accountId,
    targetAccountId: isTransfer ? targetAccountId : undefined,
    cardId: isCard ? cardId : undefined,
    status: isCard ? 'pending' : status,
    recurring: fixedExpense && type === 'expense' && !isCard,
    recurrenceFrequency: fixedExpense && type === 'expense' && !isCard ? frequency : undefined,
    tags: thirdParty && !tags.includes('Terceiros') ? [...tags, 'Terceiros'] : tags,
    notes: notes.trim() || undefined,
    attachmentUrl,
    attachmentName,
    ignored: ignored || thirdParty,
    analyticsExclusionReason: thirdParty ? 'third_party' : ignored ? 'manual' : undefined,
    isThirdParty: isCard && thirdParty,
    thirdPartyName: isCard && thirdParty ? thirdPartyName.trim() : undefined,
    reimbursed: editingTransaction?.reimbursed || false,
    reminder: !isCard && type === 'expense' && reminderEnabled
      ? { enabled: true, daysBefore: reminderDaysBefore, reminderTime }
      : undefined,
    invoiceMonth: isCard ? invoiceMonth : undefined,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return setError('Informe um valor maior que zero.');
    if (!isTransfer && !categoryId) return setError('Selecione uma categoria.');
    if (isTransfer && accounts.length < 2) return setError('Cadastre pelo menos duas contas para transferir.');
    if (isTransfer && accountId === targetAccountId) return setError('As contas de origem e destino devem ser diferentes.');
    if (!isCard && !accountId) return setError('Selecione uma conta bancária.');
    if (isCard && !selectedCard) return setError('Selecione um cartão de crédito.');
    if (thirdParty && !thirdPartyName.trim()) return setError('Informe o nome da pessoa da compra de terceiro.');
    if (type === 'expense' && !isCard && (status === 'pending' || reminderEnabled) && !dueDate && !date) {
      return setError('Informe a data de vencimento da despesa pendente ou com lembrete.');
    }

    const txData = baseTransaction();
    if (editingTransaction) {
      if (editingSeries?.kind === 'recurring_expense' && amountNumber !== editingTransaction.amount) {
        updateTransaction(editingTransaction.id, { ...txData, amount: editingTransaction.amount });
        updateRecurringExpenseAmount(editingTransaction.id, amountNumber, fixedEditScope, overwriteExceptions);
      } else {
        updateTransaction(editingTransaction.id, txData);
      }
      onClose();
      return;
    }

    if (isTransfer) {
      try {
        const built = buildTransferTransaction({
          id: makeId('tx-transfer'), amount: amountNumber, sourceAccountId: accountId,
          targetAccountId, date, today: getTodayString(), description, tags, notes,
          attachmentUrl, attachmentName, createdAt: new Date().toISOString(),
          sourceBalance: accounts.find(account => account.id === accountId)?.balance,
        });
        if (built.insufficientBalanceWarning && !window.confirm('O saldo da conta de origem é insuficiente. Deseja continuar mesmo assim?')) return;
        const { id: _id, createdAt: _createdAt, ...newTransfer } = built.transaction;
        addTransaction(newTransfer);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível criar a transferência.');
        return;
      }
      onClose();
      return;
    }

    if (isCard && installment && selectedCard) {
      try {
        const built = buildCardInstallmentSeries({
          seriesId: makeId('series-card'), description: txData.description, amount: amountNumber,
          amountInputMode: amountMode, totalInstallments: installmentCount,
          firstTrackedInstallment: alreadyStarted ? firstTrackedInstallment : 1,
          purchaseDate: date, firstInvoiceMonth: invoiceMonth, cardId: selectedCard.id,
          cardClosingDay: selectedCard.closingDay, cardDueDay: selectedCard.dueDay,
          categoryId, subcategoryId: subcategoryId || undefined, ignored,
          isThirdParty: thirdParty, thirdPartyName, tags, notes,
          attachmentUrl, attachmentName, createdAt: new Date().toISOString(),
        });
        addTransactionSeries(built.series, built.transactions);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível criar as parcelas.');
        return;
      }
      onClose();
      return;
    }

    if (fixedExpense && type === 'expense' && !isCard) {
      const now = new Date().toISOString();
      const series: RecurringExpenseSeries = {
        id: makeId('series-recurring'), kind: 'recurring_expense', description: txData.description,
        categoryId, subcategoryId: subcategoryId || undefined, accountId, startDate: date,
        firstDueDate: dueDate || undefined, endDate: recurrenceEndDate || undefined,
        frequency, defaultAmount: amountNumber, amountRules: [], tags: [...txData.tags],
        notes: txData.notes, attachmentUrl, attachmentName, ignored: Boolean(txData.ignored),
        analyticsExclusionReason: txData.analyticsExclusionReason, reminder: txData.reminder,
        createdAt: now, updatedAt: now,
      };
      const reconciled = reconcileRecurringExpenseSeries({
        series, transactions: [], today: getTodayString(), horizonMonths: 12,
        initialStatus: status,
      });
      addTransactionSeries(series, reconciled.transactions);
      onClose();
      return;
    }

    if (isCard && selectedCard) {
      txData.dueDate = getInvoiceDueDate(invoiceMonth, selectedCard.closingDay, selectedCard.dueDay);
    }
    addTransaction(txData);
    onClose();
  };

  const title = editingTransaction ? 'Editar lançamento' : isTransfer
    ? 'Nova transferência' : isCard ? 'Nova despesa de cartão' : type === 'income' ? 'Nova receita' : 'Nova despesa';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="lg"
      footer={<div className="flex justify-end gap-2 w-full">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-full text-sm font-bold text-slate-600 dark:text-slate-300">Cancelar</button>
        <button type="submit" form="transaction-form-v2" className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-black">
          {editingTransaction ? 'Atualizar' : 'Salvar'}
        </button>
      </div>}
    >
      <form id="transaction-form-v2" onSubmit={handleSubmit} className="space-y-4">
        {!editingTransaction && <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
          {[
            { label: 'Despesa', value: 'expense-account' },
            { label: 'Receita', value: 'income-account' },
            { label: 'Cartão', value: 'expense-card' },
            { label: 'Transferir', value: 'transfer-account' },
          ].map(option => {
            const active = `${type}-${paymentMethod}` === option.value;
            return <button key={option.value} type="button" onClick={() => {
              const [nextType, nextMethod] = option.value.split('-') as [TransactionType, 'account' | 'card'];
              setType(nextType); setPaymentMethod(nextMethod);
              if (nextType === 'transfer') setStatus(date > getTodayString() ? 'scheduled' : 'completed');
            }} className={`py-2 rounded-xl text-xs font-black ${active ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{option.label}</button>;
          })}
        </div>}

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center bg-slate-50 dark:bg-slate-900/40">
          <label className={labelClass}>VALOR</label>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-500 select-none">R$</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label="VALOR"
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
              className="borderless-money-input text-center text-3xl sm:text-4xl font-black bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ring-0 ring-offset-0 shadow-none tracking-tight p-0 text-purple-600 dark:text-purple-400"
              style={{
                width: `${Math.max(displayAmount.length + 1, 5)}ch`,
                outline: 'none',
                boxShadow: 'none',
                border: 'none',
              }}
            />
          </div>
        </div>

        {!isCard && !isTransfer && <div>
          <label className={labelClass}>SITUAÇÃO</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setStatus('completed')} className={`py-2 rounded-xl text-sm font-bold ${status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{type === 'income' ? 'Recebido' : 'Pago'}</button>
            <button type="button" onClick={() => setStatus('pending')} className={`py-2 rounded-xl text-sm font-bold ${status !== 'completed' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{type === 'income' ? 'A receber' : 'Pendente'}</button>
          </div>
        </div>}

        {isTransfer ? <>
          <div><label className={labelClass}>CONTA DE ORIGEM</label><select className={fieldClass} value={accountId} onChange={event => setAccountId(event.target.value)}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} — {formatCurrency(account.balance, user.currency)}</option>)}</select></div>
          <div><label className={labelClass}>CONTA DE DESTINO</label><select className={fieldClass} value={targetAccountId} onChange={event => setTargetAccountId(event.target.value)}>{accounts.filter(account => account.id !== accountId).map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></div>
          <div><label className={labelClass}>DATA</label><DatePicker value={date} onChange={value => { setDate(value); setStatus(value > getTodayString() ? 'scheduled' : 'completed'); }} variant="modal" /></div>
          <div><label className={labelClass}>DESCRIÇÃO</label><input className={fieldClass} value={description} onChange={event => setDescription(event.target.value)} placeholder="Ex: Reserva mensal" /></div>
        </> : <>
          <div><label className={labelClass}>{dateLabel}</label><DatePicker value={date} onChange={handleDateChange} variant="modal" /></div>
          <div><label className={labelClass}>DESCRIÇÃO</label><input className={fieldClass} value={description} onChange={event => setDescription(event.target.value)} required /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelClass}>CATEGORIA</label><select className={fieldClass} value={categoryId} onChange={event => { setCategoryId(event.target.value); setSubcategoryId(''); }} required><option value="">Selecione...</option>{filteredCategories.map(category => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}</select></div>
            <div><label className={labelClass}>SUBCATEGORIA</label><select className={fieldClass} value={subcategoryId} onChange={event => setSubcategoryId(event.target.value)}><option value="">Nenhuma</option>{selectedCategory?.subcategories.map(subcategory => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select></div>
          </div>
          {isCard ? <>
            <div><label className={labelClass}>CARTÃO DE CRÉDITO</label><select className={fieldClass} value={cardId} onChange={event => setCardId(event.target.value)}>{cards.map(card => <option key={card.id} value={card.id}>{card.name} — {card.brand}</option>)}</select></div>
            {!editingTransaction && (
              <div className="rounded-2xl border border-purple-200 dark:border-purple-900/80 p-3.5 space-y-3.5 bg-purple-50/20 dark:bg-purple-950/10">
                {/* Header com Toggle Switch */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs border border-purple-200/60 dark:border-purple-800/40">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 block truncate">
                        COMPRA PARCELADA
                      </span>
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium block">
                        {installment ? `${installmentCount}x nas faturas mensais` : 'Desmarque para compra à vista (1x)'}
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={installment}
                      onChange={event => {
                        const checked = event.target.checked;
                        setInstallment(checked);
                        if (checked && installmentCount < 2) {
                          setInstallmentCount(2);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {installment && (
                  <div className="space-y-3 pt-1 animate-in fade-in">
                    {/* Modo de Entrada do Valor */}
                    <div className="space-y-1">
                      <label className={labelClass}>O VALOR DIGITADO ACIMA É:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAmountMode('total')}
                          className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            amountMode === 'total'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Valor Total da Compra
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmountMode('per_installment')}
                          className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            amountMode === 'per_installment'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Valor de Cada Parcela
                        </button>
                      </div>
                    </div>

                    {/* Seleção de Quantidade de Parcelas */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className={labelClass}>QUANTIDADE DE PARCELAS</label>
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200/50 dark:border-purple-800/40">
                          {installmentCount}x
                        </span>
                      </div>

                      {/* Controle Integrado: Entrada Numérica Direta [- / +] e Select Detalhado */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Entrada Numérica Direta com - e + (sem leading zero) */}
                        <div className="flex items-center justify-between h-[42px] px-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(2, installmentCount - 1);
                              setInstallmentCount(next);
                              setInstallmentInputStr(String(next));
                              setIsCustomInstallment(next > 24);
                            }}
                            disabled={installmentCount <= 2}
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 select-none"
                            title="Diminuir 1 parcela"
                          >
                            -
                          </button>

                          <div className="flex-1 flex items-center justify-center gap-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="borderless-money-input borderless-stepper-input w-8 text-center font-black text-base bg-transparent border-0 outline-none text-slate-900 dark:text-white p-0 m-0 focus:ring-0 focus:outline-none shadow-none"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                boxShadow: 'none',
                                outline: 'none',
                              }}
                              value={installmentInputStr}
                              placeholder="2"
                              onChange={e => handleInstallmentInputChange(e.target.value)}
                              onBlur={handleInstallmentInputBlur}
                            />
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
                              vezes
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(72, installmentCount + 1);
                              setInstallmentCount(next);
                              setInstallmentInputStr(String(next));
                              setIsCustomInstallment(next > 24);
                            }}
                            disabled={installmentCount >= 72}
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 select-none"
                            title="Aumentar 1 parcela"
                          >
                            +
                          </button>
                        </div>

                        {/* Select com Valores Detalhados por Parcela (2 a 24x) */}
                        <select
                          className={fieldClass}
                          value={installmentCount <= 24 && !isCustomInstallment ? installmentCount : 'custom'}
                          onChange={event => {
                            const val = event.target.value;
                            if (val === 'custom') {
                              setIsCustomInstallment(true);
                              if (installmentCount <= 24) {
                                setInstallmentCount(25);
                                setInstallmentInputStr('25');
                              }
                            } else {
                              setIsCustomInstallment(false);
                              const n = Number(val);
                              setInstallmentCount(n);
                              setInstallmentInputStr(String(n));
                            }
                          }}
                        >
                          {Array.from({ length: 23 }, (_, i) => i + 2).map(count => {
                            const opt = calculateInstallmentOption(count);
                            return (
                              <option key={count} value={count}>
                                {amountNumber > 0
                                  ? `${count}x de ${formatCurrency(opt.installmentAmount, user.currency)} (Total: ${formatCurrency(opt.totalAmount, user.currency)})`
                                  : `${count}x parcelas`}
                              </option>
                            );
                          })}
                          <option value="custom">
                            {installmentCount > 24 ? `${installmentCount}x personalizado (até 72x)` : 'Outra quantidade personalizada (até 72x)...'}
                          </option>
                        </select>
                      </div>

                      {/* Chips de Atalho Rápido para 1 Toque */}
                      <div className="space-y-1 pt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Atalhos Rápidos:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[2, 3, 4, 5, 6, 10, 12, 18, 24].map(quickCount => {
                            const isSelected = installmentCount === quickCount;
                            return (
                              <button
                                key={quickCount}
                                type="button"
                                onClick={() => {
                                  setIsCustomInstallment(false);
                                  setInstallmentCount(quickCount);
                                  setInstallmentInputStr(String(quickCount));
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-600 text-white shadow-xs scale-105'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
                                }`}
                              >
                                {quickCount}x
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Card Resumo do Parcelamento */}
                    {installmentPreview && (
                      <div className="rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/60 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-purple-900 dark:text-purple-200">
                            {installmentCount}x de {formatCurrency(round2(installmentPreview.series.totalAmount / installmentCount), user.currency)}
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            Total: {formatCurrency(installmentPreview.series.totalAmount, user.currency)}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between border-t border-purple-200/50 dark:border-purple-900/40 pt-2">
                          <span>
                            Fatura inicial: <strong className="text-purple-700 dark:text-purple-300 font-bold">{installmentPreview.transactions[0]?.invoiceMonth ? formatInvoiceMonthShort(installmentPreview.transactions[0].invoiceMonth) : ''}</strong>
                          </span>
                          <span>
                            Término: <strong className="text-purple-700 dark:text-purple-300 font-bold">{installmentPreview.transactions.at(-1)?.invoiceMonth ? formatInvoiceMonthShort(installmentPreview.transactions.at(-1)?.invoiceMonth) : ''}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Compra já em andamento */}
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/80 space-y-2">
                      <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer">
                        <span>Esta compra já está em andamento?</span>
                        <input
                          type="checkbox"
                          checked={alreadyStarted}
                          onChange={event => {
                            setAlreadyStarted(event.target.checked);
                            if (!event.target.checked) {
                              setFirstTrackedInstallment(1);
                              setFirstTrackedStr('1');
                            }
                          }}
                          className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                        />
                      </label>

                      {alreadyStarted && (
                        <div className="space-y-1 animate-in fade-in">
                          <label className={labelClass}>PARCELA ATUAL ABERTA</label>
                          <div className="flex items-center gap-2">
                            <input
                              className={fieldClass}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="1"
                              value={firstTrackedStr}
                              onChange={e => handleFirstTrackedChange(e.target.value)}
                              onBlur={handleFirstTrackedBlur}
                            />
                            <span className="whitespace-nowrap text-sm font-black text-purple-600 dark:text-purple-400">
                              de {installmentCount}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {Math.max(0, firstTrackedInstallment - 1)} parcela(s) já paga(s) antes do Finly
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div><label className={labelClass}>FATURA DE DESTINO</label><select className={fieldClass} value={invoiceMonth} onChange={event => setInvoiceMonth(event.target.value)}>{invoiceMonths.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}</select></div>
          </> : <div><label className={labelClass}>CONTA BANCÁRIA</label><select className={fieldClass} value={accountId} onChange={event => setAccountId(event.target.value)}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} — {formatCurrency(account.balance, user.currency)}</option>)}</select></div>}
        </>}

        <button type="button" onClick={() => setMoreDetails(value => !value)} className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm font-black"><span>Mais detalhes</span><ChevronDown className={`w-4 h-4 transition-transform ${moreDetails ? 'rotate-180' : ''}`} /></button>
        {moreDetails && <div className="space-y-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 p-3">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Paperclip className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  ANEXO
                </span>
                <p className="text-[10px] text-slate-400">
                  Fotos de notas fiscais, recibos ou comprovantes PDF
                </p>
              </div>

              <label className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{attachmentName ? 'Alterar Arquivo' : 'Escolher Arquivo'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={event => handleAttachment(event.target.files?.[0])}
                  className="hidden"
                />
              </label>
            </div>

            {attachmentName && (
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {attachmentUrl && attachmentUrl.startsWith('data:image') ? (
                    <img src={attachmentUrl} alt="Preview" className="w-9 h-9 rounded-lg object-cover border border-purple-300 dark:border-purple-800 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
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
                    setAttachmentName(undefined);
                    setAttachmentUrl(undefined);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                  title="Remover anexo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}><Tag className="inline w-3.5 h-3.5 mr-1" />TAGS</label>
            <div className="flex gap-2">
              <input
                ref={tagInputRef}
                className={fieldClass}
                value={tagInput}
                onChange={event => setTagInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Digite e pressione Enter ou toque em +"
              />
              <button
                type="button"
                onMouseDown={event => event.preventDefault()}
                onClick={() => addTag()}
                className="px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-lg cursor-pointer shadow-xs transition-colors shrink-0 flex items-center justify-center"
                title="Adicionar tag"
                aria-label="Adicionar tag"
              >
                +
              </button>
            </div>

            {/* Sugestões rápidas de Tags */}
            <div className="flex flex-wrap gap-1 items-center pt-2">
              <span className="text-[10px] font-bold text-slate-400">Sugestões:</span>
              {['Aluguel', 'Mercado', 'Trabalho', 'Viagem', 'Lazer', 'Assinatura', 'Saúde', 'Educação'].map(sugg => (
                <button
                  key={sugg}
                  type="button"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => addTag(sugg)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-colors cursor-pointer"
                >
                  +{sugg}
                </button>
              ))}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(prev => prev.filter(item => item !== tag))}
                      className="hover:text-rose-500 cursor-pointer font-black text-sm leading-none"
                      title="Remover tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div><label className={labelClass}>OBSERVAÇÕES</label><textarea className={fieldClass} rows={3} value={notes} onChange={event => setNotes(event.target.value)} /></div>
          {type === 'expense' && !isCard && !isTransfer && <div className="space-y-2"><label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"><span>DESPESA FIXA</span><input type="checkbox" checked={fixedExpense} disabled={Boolean(editingTransaction)} onChange={event => setFixedExpense(event.target.checked)} /></label>{fixedExpense && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div><label className={labelClass}>FREQUÊNCIA</label><select className={fieldClass} value={frequency} onChange={event => setFrequency(event.target.value as SupportedRecurrenceFrequency)}><option value="weekly">Semanal</option><option value="monthly">Mensal</option><option value="yearly">Anual</option></select></div><div><label className={labelClass}>TÉRMINO OPCIONAL</label><input className={fieldClass} type="date" min={date} value={recurrenceEndDate} onChange={event => setRecurrenceEndDate(event.target.value)} /></div></div>}</div>}
          {isCard && <div className="space-y-2"><label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"><span>COMPRA DE TERCEIRO</span><input type="checkbox" checked={thirdParty} onChange={event => { setThirdParty(event.target.checked); if (event.target.checked) setIgnored(true); }} /></label>{thirdParty && <input className={fieldClass} value={thirdPartyName} onChange={event => setThirdPartyName(event.target.value)} placeholder="Nome da pessoa" />}</div>}
          {!isTransfer && <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"><span>IGNORAR NO ORÇAMENTO E RELATÓRIOS</span><input type="checkbox" checked={ignored} disabled={thirdParty} onChange={event => setIgnored(event.target.checked)} /></label>}
          {type === 'expense' && !isCard && !isTransfer && <div className="space-y-2"><label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"><span><Bell className="inline w-4 h-4 mr-1" />LEMBRETE</span><input type="checkbox" checked={reminderEnabled} onChange={event => setReminderEnabled(event.target.checked)} /></label>{reminderEnabled && <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>ANTECEDÊNCIA</label><select className={fieldClass} value={reminderDaysBefore} onChange={event => setReminderDaysBefore(Number(event.target.value))}><option value={0}>No vencimento</option><option value={1}>1 dia antes</option><option value={2}>2 dias antes</option><option value={7}>1 semana antes</option></select></div><div><label className={labelClass}>HORÁRIO</label><input className={fieldClass} type="time" value={reminderTime} onChange={event => setReminderTime(event.target.value)} /></div></div>}</div>}
          {editingSeries?.kind === 'recurring_expense' && <div className="rounded-xl border border-amber-200 dark:border-amber-900 p-3 space-y-2"><p className="text-xs font-black uppercase tracking-wider">APLICAR ALTERAÇÃO DO VALOR</p><label className="flex gap-2 text-xs font-semibold uppercase tracking-wider"><input type="radio" checked={fixedEditScope === 'single'} onChange={() => setFixedEditScope('single')} />Somente este mês</label><label className="flex gap-2 text-xs font-semibold uppercase tracking-wider"><input type="radio" checked={fixedEditScope === 'current_and_future'} onChange={() => setFixedEditScope('current_and_future')} />Este e os próximos</label>{fixedEditScope === 'current_and_future' && <label className="flex gap-2 text-xs font-semibold uppercase tracking-wider"><input type="checkbox" checked={overwriteExceptions} onChange={event => setOverwriteExceptions(event.target.checked)} />Sobrescrever valores excepcionais futuros</label>}</div>}
        </div>}
        {error && <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-sm font-bold text-rose-600">{error}</p>}
      </form>
    </Modal>
  );
};
