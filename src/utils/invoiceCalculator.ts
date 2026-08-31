import { CreditCard, Transaction } from '../types';

export interface CardInvoiceAllocation {
  invoiceMonth: string;      // Formato 'YYYY-MM'
  dueDate: string;           // Formato 'YYYY-MM-DD'
  closingDate: string;       // Formato 'YYYY-MM-DD'
  isAfterClosing: boolean;
}

export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'overdue' | 'future';

export interface InvoiceStatusInfo {
  status: InvoiceStatus;
  statusLabel: string;
  badgeColor: string;
  isOverdue: boolean;
  isPaid: boolean;
  isOpen: boolean;
  isClosed: boolean;
}

/**
 * Calcula a qual fatura uma transacao de cartao pertence e sua data de vencimento real.
 * Se a compra foi feita apos o dia de fechamento, ela cai na fatura do mes seguinte.
 */
export function allocateCardTransaction(
  txDateStr: string,
  closingDay: number,
  dueDay: number
): CardInvoiceAllocation {
  if (!txDateStr || !txDateStr.includes('-')) {
    const today = new Date().toISOString().substring(0, 10);
    txDateStr = today;
  }

  const parts = txDateStr.split('-');
  const txYear = parseInt(parts[0], 10);
  const txMonth = parseInt(parts[1], 10);
  const txDay = parseInt(parts[2], 10);

  let invoiceYear = txYear;
  let invoiceMonth = txMonth;

  const isAfterClosing = txDay > closingDay;
  if (isAfterClosing) {
    invoiceMonth += 1;
    if (invoiceMonth > 12) {
      invoiceMonth = 1;
      invoiceYear += 1;
    }
  }

  let dueYear = invoiceYear;
  let dueMonth = invoiceMonth;
  if (dueDay < closingDay && !isAfterClosing) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }

  const invoiceMonthStr = `${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}`;
  const dueDateStr = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(Math.min(28, dueDay)).padStart(2, '0')}`;
  const closingDateStr = `${invoiceYear}-${String(invoiceMonth).padStart(2, '0')}-${String(Math.min(28, closingDay)).padStart(2, '0')}`;

  return {
    invoiceMonth: invoiceMonthStr,
    dueDate: dueDateStr,
    closingDate: closingDateStr,
    isAfterClosing,
  };
}

/**
 * Retorna a data efetiva de uma transacao com base no regime de visualizacao:
 * - 'due_date' (Caixa): Se for despesa de cartao, projeta no dia do vencimento da fatura; senao usa tx.date.
 * - 'purchase_date' (Competencia): Usa tx.purchaseDate ou tx.date.
 */
export function getEffectiveTransactionDate(
  tx: Transaction,
  card: CreditCard | undefined,
  viewRegime: 'due_date' | 'purchase_date' = 'due_date'
): string {
  if (viewRegime === 'due_date' && tx.cardId && card && tx.type === 'expense') {
    if (tx.dueDate) return tx.dueDate;
    const allocation = allocateCardTransaction(tx.date, card.closingDay, card.dueDay);
    return allocation.dueDate;
  }
  return tx.purchaseDate || tx.date;
}

/**
 * Calcula o status dinamico da fatura de um cartao (Aberta, Fechada, Paga, Vencida, Futura)
 */
export function calculateCardInvoiceStatus(
  card: CreditCard,
  viewYear: number,
  viewMonth: number,
  invoiceTotal: number,
  isPaid: boolean
): InvoiceStatusInfo {
  if (isPaid && invoiceTotal > 0) {
    return {
      status: 'paid',
      statusLabel: 'Fatura Paga',
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30',
      isOverdue: false,
      isPaid: true,
      isOpen: false,
      isClosed: false,
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const closingDay = card.closingDay || 28;
  const dueDay = card.dueDay || 5;

  const isFutureMonth = viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth);
  const isPastMonth = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);

  if (isFutureMonth) {
    return {
      status: 'future',
      statusLabel: 'Fatura Futura',
      badgeColor: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
      isOverdue: false,
      isPaid: false,
      isOpen: false,
      isClosed: false,
    };
  }

  if (isPastMonth) {
    if (invoiceTotal === 0) {
      return {
        status: 'closed',
        statusLabel: 'Sem Gastos',
        badgeColor: 'text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
        isOverdue: false,
        isPaid: false,
        isOpen: false,
        isClosed: true,
      };
    }
    return {
      status: 'overdue',
      statusLabel: 'Fatura Vencida',
      badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-500/30',
      isOverdue: true,
      isPaid: false,
      isOpen: false,
      isClosed: true,
    };
  }

  // Mes Atual
  if (currentDay > dueDay && !isPaid && invoiceTotal > 0) {
    return {
      status: 'overdue',
      statusLabel: 'Fatura Vencida',
      badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-500/30',
      isOverdue: true,
      isPaid: false,
      isOpen: false,
      isClosed: true,
    };
  }

  if (currentDay > closingDay) {
    return {
      status: 'closed',
      statusLabel: 'Fatura Fechada',
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-500/30',
      isOverdue: false,
      isPaid: false,
      isOpen: false,
      isClosed: true,
    };
  }

  return {
    status: 'open',
    statusLabel: 'Fatura Aberta',
    badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-500/30',
    isOverdue: false,
    isPaid: false,
    isOpen: true,
    isClosed: false,
  };
}
