import { Category, Transaction } from '../types';
import { normalizeTag, normalizeText, predictCategoryAndSubcategory } from './smartCategorizer';

export type AssistantDraftTransaction = Omit<Transaction, 'id' | 'createdAt'>;

export interface AssistantTransactionDraft {
  id: string;
  originalText: string;
  transaction: AssistantDraftTransaction;
  categoryName: string;
  subcategoryName?: string;
  confidence: number;
  requiresConfirmation: true;
}

export interface CreateAssistantTransactionDraftParams {
  text: string;
  categories: Category[];
  accountId?: string;
  today?: string;
  historicalTransactions?: Transaction[];
}

export type DraftConfirmationResult = 'created' | 'already-confirmed';

export class DraftConfirmationRegistry {
  private readonly confirmedDraftIds = new Set<string>();

  confirm(
    draft: AssistantTransactionDraft,
    persist: (transaction: AssistantDraftTransaction) => void,
  ): DraftConfirmationResult {
    if (this.confirmedDraftIds.has(draft.id)) return 'already-confirmed';
    persist(draft.transaction);
    this.confirmedDraftIds.add(draft.id);
    return 'created';
  }

  isConfirmed(draftId: string): boolean {
    return this.confirmedDraftIds.has(draftId);
  }
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MONEY_NUMBER_PATTERN = String.raw`\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+[.,]\d{1,2}|\d+`;

const parseAmount = (text: string): number | null => {
  const currencyMatch = text.match(new RegExp(String.raw`r\$\s*(${MONEY_NUMBER_PATTERN})`, 'iu'));
  const reaisMatch = text.match(new RegExp(String.raw`(${MONEY_NUMBER_PATTERN})\s*reais?\b`, 'iu'));
  const fallbackMatch = text.match(new RegExp(MONEY_NUMBER_PATTERN, 'u'));
  const raw = currencyMatch?.[1] || reaisMatch?.[1] || fallbackMatch?.[0];
  if (!raw) return null;

  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(?:\.\d{3})+$/u.test(raw)
      ? raw.replace(/\./g, '')
      : raw;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const stableDraftId = (seed: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `draft-${(hash >>> 0).toString(36)}`;
};

export function createAssistantTransactionDraft({
  text,
  categories,
  accountId,
  today = formatLocalDate(new Date()),
  historicalTransactions = [],
}: CreateAssistantTransactionDraftParams): AssistantTransactionDraft | null {
  const originalText = text.trim();
  const normalizedText = normalizeText(originalText);
  const amount = parseAmount(originalText);
  if (!originalText || !amount || !accountId) return null;

  const isIncome = /\b(recebi|ganhei|salario|freelance|venda|pix recebido|entrada)\b/u.test(normalizedText);
  const isExpense = /\b(gastei|paguei|comprei|despesa|mercado|lanche|almoco|uber|gasolina|farmacia|luz|agua|aluguel)\b/u.test(normalizedText);
  if (!isIncome && !isExpense) return null;

  const type = isIncome ? 'income' as const : 'expense' as const;
  const prediction = predictCategoryAndSubcategory(
    originalText,
    type,
    categories,
    historicalTransactions,
  );
  if (!prediction) return null;

  const tags = Array.from(new Set([
    ...(prediction.suggestedTags || []).map(normalizeTag).filter(Boolean),
    'assistente',
  ]));
  const description = prediction.subcategoryName || prediction.categoryName;
  const transaction: AssistantDraftTransaction = {
    description,
    amount,
    type,
    date: /^\d{4}-\d{2}-\d{2}$/u.test(today) ? today : formatLocalDate(new Date()),
    categoryId: prediction.categoryId,
    subcategoryId: prediction.subcategoryId,
    accountId,
    status: 'completed',
    recurring: false,
    tags,
    notes: 'Lançamento sugerido pelo assistente do Finly e confirmado pelo usuário.',
  };

  return {
    id: stableDraftId([
      normalizedText,
      type,
      amount.toFixed(2),
      transaction.date,
      accountId || '',
    ].join('|')),
    originalText,
    transaction,
    categoryName: prediction.categoryName,
    subcategoryName: prediction.subcategoryName,
    confidence: prediction.confidence,
    requiresConfirmation: true,
  };
}
