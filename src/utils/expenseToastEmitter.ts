import { formatCurrency } from './formatters';

export interface ExpenseAddedToastData {
  id?: string;
  description: string;
  amount: number;
  currency?: string;
  categoryIcon?: string;
  categoryName?: string;
  subcategoryName?: string;
  paymentMethod?: 'card' | 'account' | 'cash';
  accountOrCardName?: string;
  installmentCount?: number;
  installmentAmount?: number;
  isRecurring?: boolean;
}

const recentlyEmittedKeys = new Set<string>();

/**
 * Emite um evento interno no navegador para exibir o pop-up de confirmação de despesa criada.
 * Possui desduplicação automática para evitar mensagens repetidas na mesma ação.
 */
export function emitExpenseAddedConfirmation(data: ExpenseAddedToastData): void {
  if (typeof window === 'undefined') return;

  // Chave de desduplicação de 2 segundos
  const dedupKey = `${data.id || ''}-${data.description}-${data.amount}-${Date.now().toString().slice(0, -3)}`;
  if (recentlyEmittedKeys.has(dedupKey)) return;
  recentlyEmittedKeys.add(dedupKey);
  setTimeout(() => recentlyEmittedKeys.delete(dedupKey), 2000);

  // Vibração sutil no Android se disponível
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([25, 35]);
    }
  } catch (_) {}

  window.dispatchEvent(
    new CustomEvent('finly_expense_added', {
      detail: data,
    })
  );
}

/**
 * Formata o resumo legível exibido no pop-up de confirmação
 */
export function formatExpenseConfirmationSummary(data: ExpenseAddedToastData): {
  badgeTitle: string;
  formattedAmount: string;
  detailsLine: string;
} {
  const currency = data.currency || 'BRL';

  let badgeTitle = 'Despesa Adicionada';
  let formattedAmount = `-${formatCurrency(data.amount, currency)}`;

  if (data.installmentCount && data.installmentCount > 1) {
    badgeTitle = `Compra Parcelada (${data.installmentCount}x)`;
    const installmentVal = data.installmentAmount || (data.amount / data.installmentCount);
    formattedAmount = `${data.installmentCount}x de ${formatCurrency(installmentVal, currency)}`;
  } else if (data.isRecurring) {
    badgeTitle = 'Despesa Fixa Cadastrada';
  }

  const detailsParts: string[] = [];
  if (data.subcategoryName) {
    detailsParts.push(data.subcategoryName);
  } else if (data.categoryName) {
    detailsParts.push(data.categoryName);
  }

  if (data.accountOrCardName) {
    const prefix = data.paymentMethod === 'card' ? 'Cartão' : 'Conta';
    detailsParts.push(`${prefix} ${data.accountOrCardName}`);
  }

  return {
    badgeTitle,
    formattedAmount,
    detailsLine: detailsParts.join(' • '),
  };
}
