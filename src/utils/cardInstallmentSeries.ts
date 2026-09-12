import type {
  CardInstallmentSeries,
  Transaction,
  TransactionStatus,
} from '../types';

export interface BuildCardInstallmentSeriesInput {
  seriesId: string;
  description: string;
  amount: number;
  amountInputMode: 'total' | 'per_installment';
  totalInstallments: number;
  firstTrackedInstallment: number;
  purchaseDate: string;
  firstInvoiceMonth: string;
  cardId: string;
  cardClosingDay: number;
  cardDueDay: number;
  categoryId: string;
  subcategoryId?: string;
  ignored: boolean;
  isThirdParty: boolean;
  thirdPartyName?: string;
  tags: string[];
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

export interface CardInstallmentTimelineItem {
  sequence: number;
  total: number;
  amount: number;
  date: string;
  invoiceMonth: string;
  dueDate: string;
  status: TransactionStatus | 'historical_paid';
  isCurrent: boolean;
  transactionId?: string;
}

export interface BuiltCardInstallmentSeries {
  series: CardInstallmentSeries;
  transactions: Transaction[];
  cardClosingDay: number;
  cardDueDay: number;
}

const parseIsoDate = (value: string): { year: number; month: number; day: number } => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) throw new Error('Data da compra inválida.');
  return { year, month, day };
};

const daysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();

export const addMonthsClamped = (value: string, months: number): string => {
  const { year, month, day } = parseIsoDate(value);
  const target = new Date(year, month - 1 + months, 1);
  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth() + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
};

export const addMonthsToPeriod = (period: string, months: number): string => {
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) throw new Error('Fatura de destino inválida.');
  const target = new Date(year, month - 1 + months, 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
};

export const getInvoiceDueDate = (
  invoiceMonth: string,
  closingDay: number,
  dueDay: number,
): string => {
  const duePeriod = addMonthsToPeriod(invoiceMonth, dueDay < closingDay ? 1 : 0);
  const [year, month] = duePeriod.split('-').map(Number);
  const day = Math.min(Math.max(1, dueDay), daysInMonth(year, month));
  return `${duePeriod}-${String(day).padStart(2, '0')}`;
};

const allocateInstallmentCents = (
  amount: number,
  mode: 'total' | 'per_installment',
  total: number,
): { totalCents: number; amounts: number[] } => {
  const inputCents = Math.round(amount * 100);
  const totalCents = mode === 'total' ? inputCents : inputCents * total;
  const baseCents = Math.floor(totalCents / total);
  const remainder = totalCents - baseCents * total;
  const amounts = Array.from({ length: total }, (_, index) => (
    (baseCents + (index >= total - remainder ? 1 : 0)) / 100
  ));
  return { totalCents, amounts };
};

const validateInput = (input: BuildCardInstallmentSeriesInput): void => {
  if (!input.seriesId.trim()) throw new Error('A série precisa de um identificador.');
  if (input.amount <= 0) throw new Error('O valor precisa ser maior que zero.');
  if (!Number.isInteger(input.totalInstallments) || input.totalInstallments < 2 || input.totalInstallments > 72) {
    throw new Error('A quantidade de parcelas precisa ficar entre 2 e 72.');
  }
  if (
    !Number.isInteger(input.firstTrackedInstallment) ||
    input.firstTrackedInstallment < 1 ||
    input.firstTrackedInstallment > input.totalInstallments
  ) {
    throw new Error('A parcela atual precisa ficar entre 1 e o total.');
  }
};

export const buildCardInstallmentSeries = (
  input: BuildCardInstallmentSeriesInput,
): BuiltCardInstallmentSeries => {
  validateInput(input);
  const { totalCents, amounts } = allocateInstallmentCents(
    input.amount,
    input.amountInputMode,
    input.totalInstallments,
  );
  const series: CardInstallmentSeries = {
    id: input.seriesId,
    kind: 'card_installment',
    description: input.description.trim() || 'Compra parcelada',
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    startDate: input.purchaseDate,
    cardId: input.cardId,
    purchaseDate: input.purchaseDate,
    firstInvoiceMonth: input.firstInvoiceMonth,
    totalAmount: totalCents / 100,
    totalInstallments: input.totalInstallments,
    firstTrackedInstallment: input.firstTrackedInstallment,
    amountInputMode: input.amountInputMode,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };

  const transactions = amounts
    .map((installmentAmount, index): Transaction | null => {
      const sequence = index + 1;
      if (sequence < input.firstTrackedInstallment) return null;
      const invoiceMonth = addMonthsToPeriod(
        input.firstInvoiceMonth,
        sequence - input.firstTrackedInstallment,
      );
      return {
        id: `tx-${input.seriesId}-${sequence}`,
        description: `${series.description} (${sequence}/${input.totalInstallments})`,
        amount: installmentAmount,
        type: 'expense',
        date: addMonthsClamped(input.purchaseDate, sequence - 1),
        purchaseDate: input.purchaseDate,
        dueDate: getInvoiceDueDate(invoiceMonth, input.cardClosingDay, input.cardDueDay),
        invoiceMonth,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        cardId: input.cardId,
        status: 'pending',
        recurring: false,
        seriesId: series.id,
        seriesSequence: sequence,
        occurrenceKey: `card:${sequence}`,
        isSeriesException: false,
        installments: {
          current: sequence,
          total: input.totalInstallments,
          parentId: series.id,
        },
        tags: input.isThirdParty && !input.tags.includes('Terceiros')
          ? [...input.tags, 'Terceiros']
          : input.tags,
        notes: input.notes,
        attachmentUrl: input.attachmentUrl,
        attachmentName: input.attachmentName,
        ignored: input.ignored || input.isThirdParty,
        analyticsExclusionReason: input.isThirdParty
          ? 'third_party'
          : input.ignored ? 'manual' : undefined,
        isThirdParty: input.isThirdParty,
        thirdPartyName: input.isThirdParty ? input.thirdPartyName?.trim() : undefined,
        reimbursed: false,
        createdAt: input.createdAt,
      };
    })
    .filter((transaction): transaction is Transaction => transaction !== null);

  return {
    series,
    transactions,
    cardClosingDay: input.cardClosingDay,
    cardDueDay: input.cardDueDay,
  };
};

export const buildCardInstallmentTimeline = (
  built: BuiltCardInstallmentSeries,
): CardInstallmentTimelineItem[] => {
  const { series, transactions, cardClosingDay, cardDueDay } = built;
  const transactionBySequence = new Map(
    transactions.map(transaction => [transaction.seriesSequence, transaction]),
  );
  const { amounts } = allocateInstallmentCents(
    series.totalAmount,
    'total',
    series.totalInstallments,
  );

  return amounts.map((amount, index) => {
    const sequence = index + 1;
    const transaction = transactionBySequence.get(sequence);
    const invoiceMonth = addMonthsToPeriod(
      series.firstInvoiceMonth,
      sequence - series.firstTrackedInstallment,
    );
    return {
      sequence,
      total: series.totalInstallments,
      amount,
      date: addMonthsClamped(series.purchaseDate, sequence - 1),
      invoiceMonth,
      dueDate: getInvoiceDueDate(invoiceMonth, cardClosingDay, cardDueDay),
      status: sequence < series.firstTrackedInstallment
        ? 'historical_paid'
        : transaction?.status || 'scheduled',
      isCurrent: sequence === series.firstTrackedInstallment,
      transactionId: transaction?.id,
    };
  });
};
