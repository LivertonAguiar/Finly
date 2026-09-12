import type { Transaction } from '../types';

export interface BuildTransferInput {
  id: string;
  amount: number;
  sourceAccountId: string;
  targetAccountId: string;
  date: string;
  today: string;
  description?: string;
  tags: string[];
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  sourceBalance?: number;
}

export const buildTransferTransaction = (input: BuildTransferInput) => {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('O valor da transferência deve ser maior que zero.');
  }
  if (!input.sourceAccountId || !input.targetAccountId) {
    throw new Error('Selecione as contas de origem e destino.');
  }
  if (input.sourceAccountId === input.targetAccountId) {
    throw new Error('As contas de origem e destino devem ser diferentes.');
  }

  const transaction: Transaction = {
    id: input.id,
    description: input.description?.trim() || 'Transferência entre contas',
    amount: Math.round(input.amount * 100) / 100,
    type: 'transfer',
    date: input.date,
    categoryId: 'cat-transferencia',
    accountId: input.sourceAccountId,
    targetAccountId: input.targetAccountId,
    status: input.date > input.today ? 'scheduled' : 'completed',
    recurring: false,
    tags: [...input.tags],
    notes: input.notes,
    attachmentUrl: input.attachmentUrl,
    attachmentName: input.attachmentName,
    createdAt: input.createdAt,
  };

  return {
    transaction,
    insufficientBalanceWarning:
      typeof input.sourceBalance === 'number' && input.sourceBalance < input.amount,
  };
};

export const getTransferBalanceDeltas = (transaction: Transaction): Record<string, number> => {
  if (
    transaction.type !== 'transfer' ||
    transaction.status !== 'completed' ||
    !transaction.accountId ||
    !transaction.targetAccountId
  ) return {};

  return {
    [transaction.accountId]: -transaction.amount,
    [transaction.targetAccountId]: transaction.amount,
  };
};
