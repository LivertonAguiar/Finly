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
