import type {
  FinancialNature,
  Transaction,
  TransactionCharacteristics,
  TransactionComponent,
  TransactionRelationships,
  TransactionStatus,
  TransactionType,
} from '../types';

export interface AnalyticalEntry {
  transactionId: string;
  componentId?: string;
  description: string;
  amount: number;
  categoryId: string;
  subcategoryId?: string;
  financialNature?: FinancialNature;
  characteristics?: TransactionCharacteristics;
  relationships?: TransactionRelationships;
  date: string;
  type: TransactionType;
  status: TransactionStatus;
  ignored?: boolean;
  isComponent: boolean;
  notes?: string;
  includeInReports?: boolean;
  includeInBudget?: boolean;
}

export interface SplitValidationResult {
  isValid: boolean;
  difference: number;
  distributedAmount: number;
  totalAmount: number;
  diffCents: number;
  distributedCents: number;
  totalCents: number;
}

/**
 * Converte valor em reais para centavos inteiros evitando imprecisões de ponto flutuante.
 */
export const toCents = (amount: number): number => {
  return Math.round((Number(amount) || 0) * 100);
};

/**
 * Converte centavos inteiros de volta para valor float com 2 casas decimais.
 */
export const fromCents = (cents: number): number => {
  return Math.round(cents) / 100;
};

/**
 * Verifica se a transação possui detalhamento/componentes ativos.
 */
export const hasActiveSplit = (
  transaction?: Partial<Transaction> | null,
): boolean => {
  return Boolean(
    transaction?.hasComponents &&
      Array.isArray(transaction.components) &&
      transaction.components.length > 0,
  );
};

/**
 * Valida se a soma exata dos componentes bate com o total da transação.
 */
export const validateTransactionComponents = (
  transactionAmount: number,
  components: Array<Pick<TransactionComponent, 'amount'>>,
): SplitValidationResult => {
  const totalCents = toCents(transactionAmount);
  const distributedCents = (components || []).reduce(
    (sum, c) => sum + toCents(c.amount),
    0,
  );
  const diffCents = totalCents - distributedCents;

  return {
    isValid: diffCents === 0,
    difference: fromCents(diffCents),
    distributedAmount: fromCents(distributedCents),
    totalAmount: fromCents(totalCents),
    diffCents,
    distributedCents,
    totalCents,
  };
};

/**
 * Função Analítica Central:
 * Converte uma transação nas suas respectivas entradas analíticas.
 *
 * REGRA CRÍTICA:
 * - Se hasComponents for true e houver componentes: retorna SOMENTE os componentes.
 * - Caso contrário: retorna SOMENTE a transação pai.
 * Nunca retorna ambos simultaneamente, prevenindo categoricamente a dupla contabilização.
 */
export const getAnalyticalEntries = (transaction: Transaction): AnalyticalEntry[] => {
  if (hasActiveSplit(transaction)) {
    return (transaction.components || []).map(comp => ({
      transactionId: transaction.id,
      componentId: comp.id,
      description: comp.description || transaction.description,
      amount: fromCents(toCents(comp.amount)),
      categoryId: comp.categoryId || transaction.categoryId,
      subcategoryId: comp.subcategoryId,
      financialNature: comp.financialNature || transaction.financialNature,
      characteristics: comp.characteristics || transaction.characteristics,
      relationships: comp.relationships || transaction.relationships,
      date: transaction.date,
      type: transaction.type,
      status: transaction.status,
      ignored: transaction.ignored,
      isComponent: true,
      notes: comp.notes || transaction.notes,
      includeInReports: comp.includeInReports ?? true,
      includeInBudget: comp.includeInBudget ?? true,
    }));
  }

  return [
    {
      transactionId: transaction.id,
      componentId: undefined,
      description: transaction.description,
      amount: fromCents(toCents(transaction.amount)),
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
      financialNature: transaction.financialNature,
      characteristics: transaction.characteristics,
      relationships: transaction.relationships,
      date: transaction.date,
      type: transaction.type,
      status: transaction.status,
      ignored: transaction.ignored,
      isComponent: false,
      notes: transaction.notes,
      includeInReports: true,
      includeInBudget: true,
    },
  ];
};

/**
 * Expande uma lista de transações em uma lista plana de AnalyticalEntries.
 */
export const expandToAnalyticalEntries = (
  transactions: Transaction[],
): AnalyticalEntry[] => {
  return transactions.flatMap(getAnalyticalEntries);
};
