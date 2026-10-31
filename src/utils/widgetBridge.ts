/**
 * Finly - Native Android Widget Bridge
 * Synchronizes financial overview metrics with the Android App Widgets (RemoteViews).
 */
import { registerPlugin } from '@capacitor/core';
import { isNativePlatform } from './notificationEngine';

export interface FinlyWidgetPlugin {
  updateWidgetData(options: {
    balance: string;
    monthlyIncome?: string;
    monthlyExpenses: string;
    monthlyBalance?: string;
    savingsRate?: string;
    cardExpenses?: string;
    pendingCount: number;
    pendingAmount?: string;
    monthName?: string;
    updatedAt?: string;
  }): Promise<{ success: boolean }>;

  getWidgetData(): Promise<{
    balance: string;
    monthlyIncome: string;
    monthlyExpenses: string;
    monthlyBalance: string;
    savingsRate: string;
    cardExpenses: string;
    pendingCount: number;
    pendingAmount: string;
    monthName: string;
    updatedAt: string;
  }>;

  checkQuickAction?(): Promise<{
    quickAction?: string;
  }>;
}

const FinlyWidget = registerPlugin<FinlyWidgetPlugin>('FinlyWidget');

export interface NativeWidgetSyncData {
  balance: number;
  monthlyIncome?: number;
  monthlyExpenses: number;
  monthlyBalance?: number;
  savingsRate?: string;
  cardExpenses?: number;
  pendingBillsCount: number;
  pendingBillsAmount?: number;
  monthName?: string;
  currency?: string;
}

const formatCurrency = (value: number, currency = 'BRL'): string => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(value);
  } catch (_) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
};

/**
 * Pushes updated financial totals to all Android home screen widgets.
 * Safe to call on any platform (no-ops gracefully on Web/PWA).
 */
export async function syncNativeWidget(data: NativeWidgetSyncData): Promise<boolean> {
  if (!isNativePlatform()) return false;

  try {
    const formattedBalance = formatCurrency(data.balance, data.currency);
    const incomeVal = data.monthlyIncome ?? 0;
    const formattedIncome = formatCurrency(incomeVal, data.currency);
    const formattedExpenses = formatCurrency(data.monthlyExpenses, data.currency);

    const netVal = data.monthlyBalance !== undefined ? data.monthlyBalance : (incomeVal - data.monthlyExpenses);
    const netPrefix = netVal >= 0 ? '+' : '';
    const formattedNet = `${netPrefix}${formatCurrency(netVal, data.currency)}`;

    const formattedCard = formatCurrency(data.cardExpenses ?? 0, data.currency);
    const formattedPendingAmount = formatCurrency(data.pendingBillsAmount ?? 0, data.currency);

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const updatedAt = `${hours}:${minutes}`;

    const monthName = data.monthName || now.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

    await FinlyWidget.updateWidgetData({
      balance: formattedBalance,
      monthlyIncome: formattedIncome,
      monthlyExpenses: formattedExpenses,
      monthlyBalance: formattedNet,
      savingsRate: data.savingsRate ?? (incomeVal > 0 ? `+${Math.round((netVal / incomeVal) * 100)}%` : '+0%'),
      cardExpenses: formattedCard,
      pendingCount: data.pendingBillsCount,
      pendingAmount: formattedPendingAmount,
      monthName,
      updatedAt,
    });

    return true;
  } catch (err) {
    console.warn('[Finly Widget] syncNativeWidget error:', err);
    return false;
  }
}

/**
 * Checks if the app was launched by clicking an interactive element in the native widget.
 */
export async function checkNativeQuickAction(): Promise<string | null> {
  if (!isNativePlatform()) return null;
  try {
    if (typeof FinlyWidget.checkQuickAction === 'function') {
      const res = await FinlyWidget.checkQuickAction();
      return res?.quickAction || null;
    }
  } catch (_) {}
  return null;
}
