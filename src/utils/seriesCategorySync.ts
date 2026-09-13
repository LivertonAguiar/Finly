import type { Transaction, TransactionSeries } from '../types';

export interface PropagateCategoryChangeInput {
  transactions: Transaction[];
  transactionSeries: TransactionSeries[];
  targetTransactionId: string;
  newCategoryId: string;
  newSubcategoryId?: string;
}

export interface PropagateCategoryChangeResult {
  transactions: Transaction[];
  transactionSeries: TransactionSeries[];
  affectedTransactionIds: string[];
  affectedSeriesIds: string[];
}

/**
 * Propaga a alteração de categoria e subcategoria para todas as demais parcelas
 * (compras parceladas de cartão), despesas fixas (recorrências) ou parcelas de dívida vinculadas.
 */
export function propagateCategoryChange({
  transactions,
  transactionSeries,
  targetTransactionId,
  newCategoryId,
  newSubcategoryId,
}: PropagateCategoryChangeInput): PropagateCategoryChangeResult {
  const targetTx = transactions.find(t => t.id === targetTransactionId);
  if (!targetTx) {
    return {
      transactions,
      transactionSeries,
      affectedTransactionIds: [],
      affectedSeriesIds: [],
    };
  }

  const cleanSubcategoryId = newSubcategoryId?.trim() || undefined;
  const targetSeriesId = targetTx.seriesId;
  const targetDebtId = targetTx.debtId || targetTx.installments?.debtId;
  const targetParentId = targetTx.installments?.parentId;
  const isCardInstallment = Boolean(targetTx.cardId && targetTx.installments);
  const baseDesc = targetTx.description.replace(/\s*\(\d+\/\d+\)/, '').trim();
  const isRecurring = Boolean(targetTx.recurring);

  // Identifica quais outras transações devem ser sincronizadas
  const isRelatedTransaction = (t: Transaction): boolean => {
    if (t.id === targetTransactionId) return false;

    // 1. Vinculadas à mesma série formal (card_installment ou recurring_expense)
    if (targetSeriesId && t.seriesId === targetSeriesId) {
      return true;
    }

    // 2. Vinculadas ao mesmo contrato de financiamento / dívida
    if (targetDebtId && (t.debtId === targetDebtId || t.installments?.debtId === targetDebtId)) {
      return true;
    }

    // 3. Parcelas de cartão legadas com parentId correspondente
    if (targetParentId && t.installments?.parentId === targetParentId) {
      return true;
    }

    // 4. Parcelas de cartão legadas do mesmo cartão com mesma descrição base
    if (
      isCardInstallment &&
      t.cardId === targetTx.cardId &&
      Boolean(t.installments) &&
      t.description.replace(/\s*\(\d+\/\d+\)/, '').trim() === baseDesc
    ) {
      return true;
    }

    // 5. Despesas fixas / recorrentes legadas com mesma descrição e conta/cartão
    if (
      isRecurring &&
      !targetSeriesId &&
      t.recurring &&
      t.description.trim() === targetTx.description.trim() &&
      (t.cardId === targetTx.cardId || t.accountId === targetTx.accountId)
    ) {
      return true;
    }

    return false;
  };

  const affectedTransactionIds: string[] = [];
  const updatedTransactions = transactions.map(t => {
    if (t.id === targetTransactionId) {
      return {
        ...t,
        categoryId: newCategoryId,
        subcategoryId: cleanSubcategoryId,
      };
    }

    if (isRelatedTransaction(t)) {
      affectedTransactionIds.push(t.id);
      return {
        ...t,
        categoryId: newCategoryId,
        subcategoryId: cleanSubcategoryId,
      };
    }

    return t;
  });

  // Atualiza também o registro da série formal em transactionSeries se existir
  const affectedSeriesIds: string[] = [];
  const updatedSeries = transactionSeries.map(series => {
    if (targetSeriesId && series.id === targetSeriesId) {
      affectedSeriesIds.push(series.id);
      return {
        ...series,
        categoryId: newCategoryId,
        subcategoryId: cleanSubcategoryId,
        updatedAt: new Date().toISOString(),
      };
    }
    return series;
  });

  return {
    transactions: updatedTransactions,
    transactionSeries: updatedSeries,
    affectedTransactionIds,
    affectedSeriesIds,
  };
}
