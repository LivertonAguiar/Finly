export function round2(num: number | string): number {
  const n = typeof num === 'string' ? parseFloat(num) || 0 : (Number(num) || 0);
  return Math.round(n * 100) / 100;
}

export function formatCurrency(value: number | string, currency = 'BRL', hide = false): string {
  if (hide) return 'R$ ••••••';
  const num = typeof value === 'string' ? parseFloat(value) || 0 : (Number(value) || 0);
  const safeNum = isNaN(num) ? 0 : round2(num);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNum);
}

export function formatNumber(value: number | string, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : (Number(value) || 0);
  const safeNum = isNaN(num) ? 0 : num;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safeNum);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('T')[0].split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

export function formatMonthYear(yearMonth: string): string {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function formatPercentage(value: number | string, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : (Number(value) || 0);
  const safeNum = isNaN(num) ? 0 : num;
  return `${safeNum >= 0 ? '+' : ''}${safeNum.toFixed(decimals).replace('.', ',')}%`;
}

export function getCurrentMonth(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


export function calculateCardInvoiceStatus(
  card: { closingDay: number; dueDay: number },
  year: number,
  month: number, // 1-12
  invoiceTotal: number,
  isPaid: boolean
) {
  if (isPaid && invoiceTotal > 0) {
    return {
      statusLabel: 'Fatura paga ✓',
      statusColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      badgeColor: 'text-emerald-600 dark:text-emerald-400',
      isPaid: true,
      isOverdue: false,
      isClosed: false,
    };
  }

  if (invoiceTotal === 0) {
    return {
      statusLabel: 'Fatura zerada',
      statusColor: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
      badgeColor: 'text-slate-400',
      isPaid: false,
      isOverdue: false,
      isClosed: false,
    };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const cDay = card.closingDay || 28;
  const dDay = card.dueDay || 5;

  // Closing date: YYYY-MM-cDay
  const closingDateObj = new Date(year, month - 1, Math.min(cDay, 28));
  const closingDateStr = `${closingDateObj.getFullYear()}-${String(closingDateObj.getMonth() + 1).padStart(2, '0')}-${String(closingDateObj.getDate()).padStart(2, '0')}`;

  // Due date: if dueDay <= closingDay, it falls in next month, else same month
  const dueMonthOffset = dDay <= cDay ? 1 : 0;
  const dueDateObj = new Date(year, month - 1 + dueMonthOffset, Math.min(dDay, 28));
  const dueDateStr = `${dueDateObj.getFullYear()}-${String(dueDateObj.getMonth() + 1).padStart(2, '0')}-${String(dueDateObj.getDate()).padStart(2, '0')}`;

  if (todayStr > dueDateStr) {
    return {
      statusLabel: 'Fatura vencida!',
      statusColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold',
      badgeColor: 'text-rose-600 dark:text-rose-500 font-bold',
      isPaid: false,
      isOverdue: true,
      isClosed: true,
    };
  }

  if (todayStr >= closingDateStr) {
    return {
      statusLabel: 'Fatura fechada',
      statusColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',
      badgeColor: 'text-blue-600 dark:text-blue-400',
      isPaid: false,
      isOverdue: false,
      isClosed: true,
    };
  }

  return {
    statusLabel: 'Fatura aberta',
    statusColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30',
    badgeColor: 'text-purple-600 dark:text-purple-400',
    isPaid: false,
    isOverdue: false,
    isClosed: false,
  };
}
