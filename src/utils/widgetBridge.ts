/**
 * Finly - Native Android Widget Bridge
 * Synchronizes financial overview metrics with the Android App Widget (RemoteViews).
 */
import { registerPlugin } from '@capacitor/core';
import { isNativePlatform } from './notificationEngine';

export interface FinlyWidgetPlugin {
  updateWidgetData(options: {
    balance: string;
    monthlyExpenses: string;
    pendingCount: number;
    monthName?: string;
    updatedAt?: string;
  }): Promise<{ success: boolean }>;

  getWidgetData(): Promise<{
    balance: string;
    monthlyExpenses: string;
    pendingCount: number;
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
  monthlyExpenses: number;
  pendingBillsCount: number;
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
 * Pushes updated financial totals to the Android home screen widget.
 * Safe to call on any platform (no-ops gracefully on Web/PWA).
 */
export async function syncNativeWidget(data: NativeWidgetSyncData): Promise<boolean> {
  if (!isNativePlatform()) return false;

  try {
    const formattedBalance = formatCurrency(data.balance, data.currency);
    const formattedExpenses = formatCurrency(data.monthlyExpenses, data.currency);

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const updatedAt = `${hours}:${minutes}`;

    const monthName = data.monthName || now.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

    await FinlyWidget.updateWidgetData({
      balance: formattedBalance,
      monthlyExpenses: formattedExpenses,
      pendingCount: data.pendingBillsCount,
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
 * Checks if the app was launched by clicking the quick action button in the native widget.
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

