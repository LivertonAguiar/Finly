import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  Building2,
  CreditCard as CreditCardIcon,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useBackButton } from '../../hooks/useBackButton';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { BankLogo, CardBrandLogo, getCardBankInfo } from '../../utils/bankLogos';
import { getCardTransactionInvoiceMonth, isCardInvoicePaid } from '../../utils/invoiceCalculator';
import { CreditCard as CreditCardType, Account } from '../../types';

interface PayInvoiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialCardId?: string | null;
  initialMonth?: string | null;
}

export const PayInvoiceSheet: React.FC<PayInvoiceSheetProps> = ({
  isOpen,
  onClose,
  initialCardId,
  initialMonth,
}) => {
  const { cards, accounts, transactions, user, payCardInvoice } = useFinancial();

  useBackButton(isOpen, onClose);

  // Month calculation
  const currentMonthPrefix = useMemo(() => {
    if (initialMonth) return initialMonth;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [initialMonth]);

  // Selected Card state
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Find eligible cards (unpaid invoices first)
  const eligibleCards = useMemo(() => {
    return cards.map(c => {
      const expenses = transactions.filter(
        t => t.cardId === c.id && t.type === 'expense' && getCardTransactionInvoiceMonth(t, c) === currentMonthPrefix
      );
      const invoiceTotal = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
      const isPaid = isCardInvoicePaid(c, currentMonthPrefix, transactions);
      return {
        card: c,
        invoiceTotal,
        isPaid,
      };
    });
  }, [cards, transactions, currentMonthPrefix]);

  // Initialize selected card
  useEffect(() => {
    if (!isOpen) return;

    if (initialCardId && cards.some(c => c.id === initialCardId)) {
      setSelectedCardId(initialCardId);
      return;
    }

    // Default to first card with unpaid invoice > 0
    const firstUnpaid = eligibleCards.find(e => !e.isPaid && e.invoiceTotal > 0);
    if (firstUnpaid) {
      setSelectedCardId(firstUnpaid.card.id);
    } else if (cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [isOpen, initialCardId, cards, eligibleCards]);

  const activeCard = useMemo(() => {
    return cards.find(c => c.id === selectedCardId) || cards[0] || null;
  }, [cards, selectedCardId]);

  // Invoice total for active card
  const activeInvoiceTotal = useMemo(() => {
    if (!activeCard) return 0;
    const expenses = transactions.filter(
      t => t.cardId === activeCard.id && t.type === 'expense' && getCardTransactionInvoiceMonth(t, activeCard) === currentMonthPrefix
    );
    return expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [activeCard, transactions, currentMonthPrefix]);

  const isAlreadyPaid = useMemo(() => {
    if (!activeCard) return false;
    return isCardInvoicePaid(activeCard, currentMonthPrefix, transactions);
  }, [activeCard, currentMonthPrefix, transactions]);

  // Debit account selection (prioritize localStorage or highest balance)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    try {
      const savedAccountId = localStorage.getItem('finly_last_pay_invoice_account_id');
      if (savedAccountId && accounts.some(a => a.id === savedAccountId)) {
        setSelectedAccountId(savedAccountId);
        return;
      }
    } catch (e) {
      // ignore localStorage error
    }

    // Fallback: pick account with balance >= invoice total, or first account
    const sufficientAccount = accounts.find(a => (a.balance || 0) >= activeInvoiceTotal);
    if (sufficientAccount) {
      setSelectedAccountId(sufficientAccount.id);
    } else if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [isOpen, accounts, activeInvoiceTotal]);

  const activeDebitAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  // Amount & Date state
  const [payAmountStr, setPayAmountStr] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(getTodayString());
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Sync invoice amount when active card changes
  useEffect(() => {
    if (isOpen) {
      setPayAmountStr(activeInvoiceTotal > 0 ? activeInvoiceTotal.toFixed(2) : '0.00');
      setPayDate(getTodayString());
      setIsAdvancedOpen(false);
      setIsSuccess(false);
    }
  }, [isOpen, activeInvoiceTotal]);

  const currentPayAmount = parseFloat(payAmountStr) || 0;
  const isPartial = activeInvoiceTotal > 0 && Math.abs(currentPayAmount - activeInvoiceTotal) > 0.01;

  // Handle Confirm Payment (Touch 2)
  const handleConfirmPayment = () => {
    if (!activeCard || !selectedAccountId || currentPayAmount <= 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save last used account in localStorage
      localStorage.setItem('finly_last_pay_invoice_account_id', selectedAccountId);
    } catch (e) {
      // ignore
    }

    // Call payment routine in FinancialContext
    payCardInvoice(activeCard.id, selectedAccountId, currentPayAmount, currentMonthPrefix, payDate);

    // Vibration / haptic feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch (e) {
        // ignore
      }
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white dark:bg-[#18181B] rounded-t-[32px] sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 duration-250"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Pagar Fatura
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Fluxo de liquidação em 2 toques
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)] scrollbar-none">
          {/* Success state animation */}
          {isSuccess ? (
            <div className="py-10 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Fatura Paga com Sucesso!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O pagamento foi lançado no fluxo de caixa e a fatura foi liquidada.
              </p>
            </div>
          ) : (
            <>
              {/* Card selector (if multiple cards exist) */}
              {cards.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Cartão a pagar
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {cards.map(c => {
                      const isSelected = c.id === selectedCardId;
                      const cColor = c.color || '#7c4dff';
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCardId(c.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                              : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center p-0.5"
                            style={{ backgroundColor: `${cColor}20` }}
                          >
                            <BankLogo nameOrId={c.bankId || getCardBankInfo(c)?.id || c.name} size={14} radius={3} />
                          </div>
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Invoice Main Hero Summary */}
              {activeCard && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-50 to-slate-100 dark:from-purple-950/30 dark:via-[#1F1F24] dark:to-[#18181B] border border-purple-500/20 dark:border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center p-1 shadow-xs border border-slate-200/60 dark:border-white/10">
                        <BankLogo nameOrId={activeCard.bankId || getCardBankInfo(activeCard)?.id || activeCard.name} size={20} radius={4} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase block leading-tight">
                          {activeCard.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Vencimento: dia {activeCard.dueDay || 5} • Fecha dia {activeCard.closingDay || 28}
                        </span>
                      </div>
                    </div>
                    {isAlreadyPaid ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        Já Paga
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/30">
                        Fatura do Mês
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-purple-500/10 dark:border-white/[0.06] flex items-baseline justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Total da fatura
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(activeInvoiceTotal, user.currency, !user.showValues)}
                    </span>
                  </div>
                </div>
              )}

              {/* Already Paid Warning */}
              {isAlreadyPaid && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Esta fatura já consta como quitada. Pagar novamente registrará um novo lançamento de liquidação.</span>
                </div>
              )}

              {/* Pre-filled Account Card (Touch 1 feedback) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Conta de Saída (Débito)
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block">
                      {activeDebitAccount ? activeDebitAccount.name : 'Nenhuma conta selecionada'}
                    </span>
                  </div>
                </div>

                {activeDebitAccount && (
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[10px] text-slate-400 block font-medium">Saldo Atual</span>
                    <span className={`text-xs font-bold ${
                      (activeDebitAccount.balance || 0) < currentPayAmount
                        ? 'text-rose-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {formatCurrency(activeDebitAccount.balance || 0, user.currency, !user.showValues)}
                    </span>
                  </div>
                )}
              </div>

              {/* Collapsible Advanced Options Accordion */}
              <div className="border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-white/[0.01]">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span>Opções avançadas</span>
                    {isPartial && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                        Parcial
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400">
                    <span>{isAdvancedOpen ? 'Recolher' : 'Alterar'}</span>
                    {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isAdvancedOpen && (
                  <div className="p-4 pt-1 space-y-3.5 border-t border-slate-200/80 dark:border-white/[0.08] animate-in slide-in-from-top-2 duration-150">
                    {/* 1. Switch Debit Account */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        Trocar conta de pagamento
                      </label>
                      <select
                        value={selectedAccountId}
                        onChange={e => setSelectedAccountId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1E24] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} — Saldo: {formatCurrency(a.balance || 0, user.currency, !user.showValues)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Custom/Partial Amount */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          Valor a pagar (R$)
                        </label>
                        {isPartial && (
                          <button
                            type="button"
                            onClick={() => setPayAmountStr(activeInvoiceTotal.toFixed(2))}
                            className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                          >
                            Pagar valor integral
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={payAmountStr}
                          onChange={e => setPayAmountStr(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#1E1E24] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* 3. Payment Date (paidAt) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        Data do pagamento (liquidação)
                      </label>
                      <input
                        type="date"
                        value={payDate}
                        onChange={e => setPayDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1E24] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Insufficient balance warning if applicable */}
              {activeDebitAccount && (activeDebitAccount.balance || 0) < currentPayAmount && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Aviso: O saldo da conta selecionada é menor que o valor a ser pago. A conta ficará negativa.</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with 1-Touch Confirm Button (Touch 2) */}
        {!isSuccess && (
          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] space-y-2">
            <button
              type="button"
              disabled={isSubmitting || currentPayAmount <= 0 || !activeCard || !selectedAccountId}
              onClick={handleConfirmPayment}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {isSubmitting
                  ? 'Processando...'
                  : `Confirmar Pagamento (${formatCurrency(currentPayAmount, user.currency, !user.showValues)})`}
              </span>
            </button>

            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gera despesa no fluxo de caixa e quita as compras da fatura</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
