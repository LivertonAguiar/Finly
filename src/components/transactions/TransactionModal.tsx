import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  Calendar,
  CreditCard as CardIcon,
  Wallet,
  Tag,
  CheckCircle2,
  Clock,
  Layers,
  Repeat,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancial } from '../../context/FinancialContext';
import { Transaction, TransactionType, TransactionStatus } from '../../types';
import { formatCurrency, getTodayString, round2 } from '../../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialAccountId?: string;
  initialCardId?: string;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  initialAccountId,
  initialCardId,
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
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [recurring, setRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('2');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);


  const prevIsOpenRef = React.useRef(false);
  const prevEditingIdRef = React.useRef<string | null>(null);

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
        setCategoryId(editingTransaction.categoryId || '');
        setSubcategoryId(editingTransaction.subcategoryId || '');
        setAccountId(editingTransaction.accountId || '');
        setTargetAccountId(editingTransaction.targetAccountId || '');
        setCardId(editingTransaction.cardId || '');
        setPaymentMethod(editingTransaction.cardId ? 'card' : 'account');
        setStatus(editingTransaction.status || 'completed');
        setRecurring(editingTransaction.recurring || false);
        setNotes(editingTransaction.notes || '');
        setTags(editingTransaction.tags || []);
      } else {
        setType(initialType);
        setDescription('');
        setAmount('');
        setDate(getTodayString());
        const defaultCat = categories.filter(c => c.type === (initialType === 'income' ? 'income' : 'expense'))[0]?.id || '';
        setCategoryId(defaultCat);
        setSubcategoryId('');
        setAccountId(initialAccountId || accounts[0]?.id || '');
        setTargetAccountId(accounts[1]?.id || '');
        setCardId(initialCardId || cards[0]?.id || '');
        setPaymentMethod(initialCardId ? 'card' : 'account');
        setStatus('completed');
        setRecurring(false);
        setIsInstallment(false);
        setTotalInstallments('2');
        setNotes('');
        setTags([]);
      }
    }
  }, [isOpen, editingTransaction?.id, initialType, initialAccountId, initialCardId]);


  const filteredCategories = categories.filter(c => {
    if (type === 'income') return c.type === 'income';
    if (type === 'expense') return c.type === 'expense';
    return true;
  });

  const selectedCategory = categories.find(c => c.id === categoryId);

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
    const numAmount = Math.round((parseFloat(amount) || 0) * 100) / 100;
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        description,
        amount: numAmount,
        type,
        date,
        categoryId: type === 'transfer' ? '' : categoryId,
        subcategoryId: type === 'transfer' ? undefined : subcategoryId,
        accountId: type === 'expense' && paymentMethod === 'card' ? undefined : accountId,
        targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        cardId: type === 'expense' && paymentMethod === 'card' ? cardId : undefined,
        status,
        recurring,
        recurrenceFrequency: recurring ? recurrenceFreq : undefined,
        notes,
        tags,
      });
    } else {
            if (isInstallment && parseInt(totalInstallments) > 1) {
        const total = parseInt(totalInstallments);
        const installmentValue = Math.round((numAmount / total) * 100) / 100;
        const parentId = `inst-${Date.now()}`;

        // Check Card Closing Day (Melhor dia de compra)
        const isCard = type === 'expense' && paymentMethod === 'card';
        const cardObj = isCard ? cards.find(c => c.id === cardId) : null;
        const [y, m, d] = date.split('-').map(Number);

        // If purchase day is on or after card closing day, invoice has closed -> first installment lands in next month!
        const isPastClosing = cardObj && cardObj.closingDay && d >= cardObj.closingDay;
        const baseMonthOffset = isPastClosing ? 1 : 0;

        for (let i = 1; i <= total; i++) {
          const installmentMonthOffset = baseMonthOffset + (i - 1);
          // Calculate date in the correct target month
          const targetDateObj = new Date(y, m - 1 + installmentMonthOffset, Math.min(d, 28));
          const formattedDate = targetDateObj.toISOString().split('T')[0];

          addTransaction({
            description: `${description} (${i}/${total})`,
            amount: installmentValue,
            type,
            date: formattedDate,
            categoryId: type === 'transfer' ? '' : categoryId,
            subcategoryId: type === 'transfer' ? undefined : subcategoryId,
            accountId: isCard ? undefined : accountId,
            targetAccountId: type === 'transfer' ? targetAccountId : undefined,
            cardId: isCard ? cardId : undefined,
            status: isCard ? 'pending' : (i === 1 ? status : 'pending'),
            recurring: false,
            installments: { current: i, total, parentId },
            notes: isPastClosing && i === 1 ? `Compra após fechamento (dia ${cardObj.closingDay}) - Lançada na fatura do mês seguinte.` : notes,
            tags,
          });
        }
      } else {
        addTransaction({
          description,
          amount: numAmount,
          type,
          date,
          categoryId: type === 'transfer' ? '' : categoryId,
          subcategoryId: type === 'transfer' ? undefined : subcategoryId,
          accountId: type === 'expense' && paymentMethod === 'card' ? undefined : accountId,
          targetAccountId: type === 'transfer' ? targetAccountId : undefined,
          cardId: type === 'expense' && paymentMethod === 'card' ? cardId : undefined,
          status,
          recurring,
          recurrenceFrequency: recurring ? recurrenceFreq : undefined,
          notes,
          tags,
        });
      }
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction ? 'Editar Transação' : 'Nova Transação'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 4 Type Selection Tabs */}
        {!editingTransaction && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (paymentMethod !== 'card' && paymentMethod !== 'account') setPaymentMethod('account');
                const expCats = categories.filter(c => c.type === 'expense');
                if (!expCats.some(c => c.id === categoryId)) {
                  setCategoryId(expCats[0]?.id || '');
                  setSubcategoryId('');
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Despesa
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                setPaymentMethod('account');
                const incCats = categories.filter(c => c.type === 'income');
                if (!incCats.some(c => c.id === categoryId)) {
                  setCategoryId(incCats[0]?.id || '');
                  setSubcategoryId('');
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" /> Receita
            </button>

            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setPaymentMethod('account');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" /> Transferência
            </button>

            <button
              type="button"
              onClick={() => {
                setType('investment');
                setPaymentMethod('account');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                type === 'investment'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Investimento
            </button>
          </div>
        )}

        {/* Amount and Date Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Valor ({user?.currency || "R$"}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Data *</label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Descrição *</label>
          <input
            type="text"
            required
            placeholder="Ex: Supermercado Pão de Açúcar, Salário, Uber..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Category & Subcategory Selection (for Expense / Income / Investment) */}
        {type !== 'transfer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria *</label>
              <select
                value={categoryId}
                onChange={e => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subcategoria</label>
              <select
                value={subcategoryId}
                onChange={e => setSubcategoryId(e.target.value)}
                disabled={!selectedCategory || selectedCategory.subcategories.length === 0}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold disabled:opacity-50"
              >
                <option value="">(Nenhuma subcategoria)</option>
                {selectedCategory?.subcategories.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.icon || '•'} {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Payment Source Selection (Account vs Card) */}
        {type === 'expense' && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'account'}
                  onChange={() => setPaymentMethod('account')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <Wallet className="w-3.5 h-3.5 text-slate-500" /> Conta Bancária
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <CardIcon className="w-3.5 h-3.5 text-slate-500" /> Cartão de Crédito
              </label>
            </div>

            {paymentMethod === 'account' ? (
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Saldo: {formatCurrency(a.balance, user.currency)})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={cardId}
                onChange={e => setCardId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                {cards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Limite: {formatCurrency(c.limit, user.currency)})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Transfer Accounts */}
        {type === 'transfer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta de Origem *</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Saldo: {formatCurrency(a.balance, user.currency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta de Destino *</label>
              <select
                value={targetAccountId}
                onChange={e => setTargetAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                {accounts.filter(a => a.id !== accountId).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Saldo: {formatCurrency(a.balance, user.currency)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Income / Investment Account Selection */}
        {(type === 'income' || type === 'investment') && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta de Depósito *</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} (Saldo: {formatCurrency(a.balance, user.currency)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status & Installment/Recurrence Options */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3 border border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Status Completed / Pending */}
            <label className="flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={status === 'completed'}
                onChange={e => setStatus(e.target.checked ? 'completed' : 'pending')}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1">
                {status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                )}
                {type === 'income' ? 'Recebido' : 'Pago'}
              </span>
            </label>

            {/* Recurrence Option */}
            {!editingTransaction && !isInstallment && (
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={e => setRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Repeat className="w-3.5 h-3.5 text-slate-500" /> Repetir / Fixo
                </span>
              </label>
            )}

            {/* Installment Option (Expenses only) */}
            {!editingTransaction && type === 'expense' && !recurring && (
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={e => setIsInstallment(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> Parcelar
                </span>
              </label>
            )}
          </div>

          {/* Recurrence Frequency */}
          {recurring && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Frequência:</span>
              <select
                value={recurrenceFreq}
                onChange={e => setRecurrenceFreq(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          )}

          {/* Installments count */}
          {isInstallment && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Número de Parcelas:</span>
              <input
                type="number"
                min="2"
                max="72"
                value={totalInstallments}
                onChange={e => setTotalInstallments(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center"
              />
              <span className="text-xs text-slate-400">
                {amount ? `${totalInstallments}x de ${formatCurrency(parseFloat(amount) / parseInt(totalInstallments || '1'), user.currency)}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tags (Pressione Enter)</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              >
                #{t}
                <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Adicionar tag e teclar Enter..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Observações</label>
          <textarea
            rows={2}
            placeholder="Detalhes adicionais, número de nota fiscal..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            {editingTransaction ? 'Salvar Alterações' : 'Criar Transação'}
          </button>
        </div>
      </form>
    </Modal>
  );
};