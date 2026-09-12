import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronDown, Paperclip, Tag, Trash2 } from 'lucide-react';
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
const labelClass = 'block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300';

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
  const [alreadyStarted, setAlreadyStarted] = useState(false);
  const [firstTrackedInstallment, setFirstTrackedInstallment] = useState(1);
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
    setAmount(tx ? String(tx.amount) : '');
    setStatus(tx?.status || 'completed');
    setDate(tx?.date || getTodayString());
    setDueDate(tx?.dueDate || '');
    setDescription(tx?.description?.replace(/\s*\(\d+\/\d+\)\s*$/, '') || '');
    setCategoryId(tx?.categoryId || categories.find(cat => cat.type === (nextType === 'income' ? 'income' : 'expense'))?.id || '');
    setSubcategoryId(tx?.subcategoryId || '');
    setAccountId(tx?.accountId || initialAccountId || accounts[0]?.id || '');
    setTargetAccountId(tx?.targetAccountId || accounts.find(acc => acc.id !== (tx?.accountId || initialAccountId || accounts[0]?.id))?.id || '');
    setCardId(tx?.cardId || initialCardId || cards[0]?.id || '');
    setInvoiceMonth(tx?.invoiceMonth || getTodayString().slice(0, 7));
    setInstallment(Boolean(tx?.installments));
    setInstallmentCount(tx?.installments?.total || 2);
    setFirstTrackedInstallment(tx?.installments?.current || 1);
    setAlreadyStarted(Boolean(tx?.installments && (tx.installments.current || 1) > 1));
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
  const amountNumber = round2(Number(amount));
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

  const addTag = () => {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) setTags(prev => [...prev, value]);
    setTagInput('');
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
    dueDate: dueDate || undefined,
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
    if (type === 'expense' && !isCard && (status === 'pending' || reminderEnabled) && !dueDate) {
      return setError('Informe o vencimento da despesa pendente ou com lembrete.');
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
          <label className={labelClass}>Valor *</label>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-black text-slate-400">R$</span>
            <input aria-label="Valor" type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className="w-44 bg-transparent text-center text-3xl font-black text-purple-600 outline-none" required />
          </div>
        </div>

        {!isCard && !isTransfer && <div>
          <label className={labelClass}>Situação *</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setStatus('completed')} className={`py-2 rounded-xl text-sm font-bold ${status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{type === 'income' ? 'Recebido' : 'Pago'}</button>
            <button type="button" onClick={() => setStatus('pending')} className={`py-2 rounded-xl text-sm font-bold ${status !== 'completed' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{type === 'income' ? 'A receber' : 'Pendente'}</button>
          </div>
        </div>}

        {isTransfer ? <>
          <div><label className={labelClass}>Conta de origem *</label><select className={fieldClass} value={accountId} onChange={event => setAccountId(event.target.value)}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} — {formatCurrency(account.balance, user.currency)}</option>)}</select></div>
          <div><label className={labelClass}>Conta de destino *</label><select className={fieldClass} value={targetAccountId} onChange={event => setTargetAccountId(event.target.value)}>{accounts.filter(account => account.id !== accountId).map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></div>
          <div><label className={labelClass}>Data *</label><DatePicker value={date} onChange={value => { setDate(value); setStatus(value > getTodayString() ? 'scheduled' : 'completed'); }} variant="modal" /></div>
          <div><label className={labelClass}>Descrição</label><input className={fieldClass} value={description} onChange={event => setDescription(event.target.value)} placeholder="Ex: Reserva mensal" /></div>
        </> : <>
          <div><label className={labelClass}>Data *</label><DatePicker value={date} onChange={setDate} variant="modal" /></div>
          <div><label className={labelClass}>Descrição *</label><input className={fieldClass} value={description} onChange={event => setDescription(event.target.value)} required /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelClass}>Categoria *</label><select className={fieldClass} value={categoryId} onChange={event => { setCategoryId(event.target.value); setSubcategoryId(''); }} required><option value="">Selecione...</option>{filteredCategories.map(category => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}</select></div>
            <div><label className={labelClass}>Subcategoria</label><select className={fieldClass} value={subcategoryId} onChange={event => setSubcategoryId(event.target.value)}><option value="">Nenhuma</option>{selectedCategory?.subcategories.map(subcategory => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select></div>
          </div>
          {isCard ? <>
            <div><label className={labelClass}>Cartão de crédito *</label><select className={fieldClass} value={cardId} onChange={event => setCardId(event.target.value)}>{cards.map(card => <option key={card.id} value={card.id}>{card.name} — {card.brand}</option>)}</select></div>
            {!editingTransaction && <div className="rounded-2xl border border-purple-200 dark:border-purple-900 p-3 space-y-3">
              <label className="flex items-center justify-between text-sm font-bold"><span>Parcelas</span><input type="checkbox" checked={installment} onChange={event => setInstallment(event.target.checked)} /></label>
              {installment && <>
                <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setAmountMode('total')} className={`py-2 rounded-xl text-xs font-bold ${amountMode === 'total' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Valor total</button><button type="button" onClick={() => setAmountMode('per_installment')} className={`py-2 rounded-xl text-xs font-bold ${amountMode === 'per_installment' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Valor de cada parcela</button></div>
                <div><label className={labelClass}>Quantidade total</label><input className={fieldClass} type="number" min={2} max={72} value={installmentCount} onChange={event => setInstallmentCount(Number(event.target.value))} /></div>
                <label className="flex items-center justify-between text-xs font-bold"><span>Esta compra já está em andamento?</span><input type="checkbox" checked={alreadyStarted} onChange={event => { setAlreadyStarted(event.target.checked); if (!event.target.checked) setFirstTrackedInstallment(1); }} /></label>
                {alreadyStarted && <div><label className={labelClass}>Parcela atual aberta</label><div className="flex items-center gap-2"><input className={fieldClass} type="number" min={1} max={installmentCount} value={firstTrackedInstallment} onChange={event => setFirstTrackedInstallment(Number(event.target.value))} /><span className="whitespace-nowrap text-sm font-black text-purple-600">de {installmentCount}</span></div><p className="mt-1 text-xs text-slate-500">{Math.max(0, firstTrackedInstallment - 1)} paga(s) antes do Finly</p></div>}
                {installmentPreview && <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 p-2 text-xs text-purple-800 dark:text-purple-200">Controladas: {installmentPreview.transactions.length} • primeira {installmentPreview.transactions[0]?.installments?.current}/{installmentCount} • término {installmentPreview.transactions.at(-1)?.invoiceMonth} • total {formatCurrency(installmentPreview.series.totalAmount, user.currency)}</div>}
              </>}
            </div>}
            <div><label className={labelClass}>Fatura de Destino *</label><select className={fieldClass} value={invoiceMonth} onChange={event => setInvoiceMonth(event.target.value)}>{invoiceMonths.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}</select></div>
          </> : <div><label className={labelClass}>Conta bancária *</label><select className={fieldClass} value={accountId} onChange={event => setAccountId(event.target.value)}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} — {formatCurrency(account.balance, user.currency)}</option>)}</select></div>}
        </>}

        {(type === 'expense' && !isCard && (status === 'pending' || reminderEnabled)) && <div><label className={labelClass}>Vencimento *</label><DatePicker value={dueDate} onChange={setDueDate} variant="modal" /></div>}

        <button type="button" onClick={() => setMoreDetails(value => !value)} className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm font-black"><span>Mais detalhes</span><ChevronDown className={`w-4 h-4 transition-transform ${moreDetails ? 'rotate-180' : ''}`} /></button>
        {moreDetails && <div className="space-y-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 p-3">
          <div><label className={labelClass}><Paperclip className="inline w-3.5 h-3.5 mr-1" />Anexo</label>{attachmentName ? <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-800 p-2 text-xs"><span className="truncate">{attachmentName}</span><button type="button" onClick={() => { setAttachmentName(undefined); setAttachmentUrl(undefined); }}><Trash2 className="w-4 h-4 text-rose-500" /></button></div> : <input className={fieldClass} type="file" onChange={event => handleAttachment(event.target.files?.[0])} />}</div>
          <div><label className={labelClass}><Tag className="inline w-3.5 h-3.5 mr-1" />Tags</label><div className="flex gap-2"><input className={fieldClass} value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} placeholder="Digite e pressione Enter" /><button type="button" onClick={addTag} className="px-3 rounded-xl bg-purple-600 text-white font-black">+</button></div>{tags.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{tags.map(tag => <button type="button" key={tag} onClick={() => setTags(prev => prev.filter(item => item !== tag))} className="rounded-full bg-purple-100 dark:bg-purple-950 px-2 py-1 text-xs text-purple-700 dark:text-purple-200">{tag} ×</button>)}</div>}</div>
          <div><label className={labelClass}>Observações</label><textarea className={fieldClass} rows={3} value={notes} onChange={event => setNotes(event.target.value)} /></div>
          {type === 'expense' && !isCard && !isTransfer && <div className="space-y-2"><label className="flex items-center justify-between text-sm font-bold"><span>Despesa fixa</span><input type="checkbox" checked={fixedExpense} disabled={Boolean(editingTransaction)} onChange={event => setFixedExpense(event.target.checked)} /></label>{fixedExpense && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div><label className={labelClass}>Frequência</label><select className={fieldClass} value={frequency} onChange={event => setFrequency(event.target.value as SupportedRecurrenceFrequency)}><option value="weekly">Semanal</option><option value="monthly">Mensal</option><option value="yearly">Anual</option></select></div><div><label className={labelClass}>Término opcional</label><input className={fieldClass} type="date" min={date} value={recurrenceEndDate} onChange={event => setRecurrenceEndDate(event.target.value)} /></div></div>}</div>}
          {isCard && <div className="space-y-2"><label className="flex items-center justify-between text-sm font-bold"><span>Compra de terceiro</span><input type="checkbox" checked={thirdParty} onChange={event => { setThirdParty(event.target.checked); if (event.target.checked) setIgnored(true); }} /></label>{thirdParty && <input className={fieldClass} value={thirdPartyName} onChange={event => setThirdPartyName(event.target.value)} placeholder="Nome da pessoa" />}</div>}
          {!isTransfer && <label className="flex items-center justify-between text-sm font-bold"><span>Ignorar no orçamento e relatórios</span><input type="checkbox" checked={ignored} disabled={thirdParty} onChange={event => setIgnored(event.target.checked)} /></label>}
          {type === 'expense' && !isCard && !isTransfer && <div className="space-y-2"><label className="flex items-center justify-between text-sm font-bold"><span><Bell className="inline w-4 h-4 mr-1" />Lembrete</span><input type="checkbox" checked={reminderEnabled} onChange={event => setReminderEnabled(event.target.checked)} /></label>{reminderEnabled && <div className="grid grid-cols-2 gap-2"><div><label className={labelClass}>Antecedência</label><select className={fieldClass} value={reminderDaysBefore} onChange={event => setReminderDaysBefore(Number(event.target.value))}><option value={0}>No vencimento</option><option value={1}>1 dia antes</option><option value={2}>2 dias antes</option><option value={7}>1 semana antes</option></select></div><div><label className={labelClass}>Horário</label><input className={fieldClass} type="time" value={reminderTime} onChange={event => setReminderTime(event.target.value)} /></div></div>}</div>}
          {editingSeries?.kind === 'recurring_expense' && <div className="rounded-xl border border-amber-200 dark:border-amber-900 p-3 space-y-2"><p className="text-xs font-black">Aplicar alteração do valor</p><label className="flex gap-2 text-xs"><input type="radio" checked={fixedEditScope === 'single'} onChange={() => setFixedEditScope('single')} />Somente este mês</label><label className="flex gap-2 text-xs"><input type="radio" checked={fixedEditScope === 'current_and_future'} onChange={() => setFixedEditScope('current_and_future')} />Este e os próximos</label>{fixedEditScope === 'current_and_future' && <label className="flex gap-2 text-xs"><input type="checkbox" checked={overwriteExceptions} onChange={event => setOverwriteExceptions(event.target.checked)} />Sobrescrever valores excepcionais futuros</label>}</div>}
        </div>}
        {error && <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-sm font-bold text-rose-600">{error}</p>}
      </form>
    </Modal>
  );
};
