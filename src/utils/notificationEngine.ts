/**
 * Finly - Notification Engine (Web & Mobile PWA)
 * Supports browser notifications, in-app alerts, audio chimes, and scheduled check triggers.
 */

export interface NotificationPreferences {
  enabled: boolean;
  cardInvoices: boolean;
  pendingBills: boolean;
  budget80: boolean;
  budget100: boolean;
  goalsProgress: boolean;
  dailyDigest: boolean;
  notifyTime: string; // e.g. '09:00'
  dueDaysAhead: number; // e.g. 1, 3, 5
  sound: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  cardInvoices: true,
  pendingBills: true,
  budget80: true,
  budget100: true,
  goalsProgress: true,
  dailyDigest: false,
  notifyTime: '09:00',
  dueDaysAhead: 3,
  sound: true,
};

const STORAGE_KEY = 'finly_notification_prefs_v1';
const SENT_ALERTS_KEY = 'finly_sent_alerts_log_v1';

/**
 * Retrieves stored notification preferences
 */
export function getStoredNotificationPrefs(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_NOTIFICATION_PREFS;
}

/**
 * Saves notification preferences
 */
export function saveNotificationPrefs(prefs: Partial<NotificationPreferences>): NotificationPreferences {
  const current = getStoredNotificationPrefs();
  const updated = { ...current, ...prefs };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('finly_notifications_updated', { detail: updated }));
    } catch (e) {}
  }
  return updated;
}

/**
 * Checks current browser permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Requests notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      saveNotificationPrefs({ enabled: true });
    }
    return perm;
  } catch (e) {
    return 'denied';
  }
}

/**
 * Synthesizes a subtle, pleasant financial audio chime via Web Audio API
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth dual tone chime (C6 + E6)
    const now = ctx.currentTime;
    
    // Note 1 (1046.5 Hz - C6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2 (1318.5 Hz - E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.08);
    gain2.gain.setValueAtTime(0.14, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (e) {}
}

/**
 * Sends a local notification (desktop browser or mobile standalone PWA)
 */
export async function sendLocalNotification(
  title: string,
  options: {
    body: string;
    tag?: string;
    icon?: string;
    badge?: string;
    data?: any;
  }
): Promise<boolean> {
  const prefs = getStoredNotificationPrefs();
  if (!prefs.enabled) return false;

  if (prefs.sound) {
    playNotificationSound();
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Try service worker showNotification first (ideal for Mobile PWA / Android / iOS)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          badge: options.badge || '/favicon.ico',
          tag: options.tag || 'finly-alert',
          data: options.data,
        });
        return true;
      }
    }

    // Fallback to standard Notification constructor
    const notif = new Notification(title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag || 'finly-alert',
      data: options.data,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (e) {
    console.warn('Could not display native notification:', e);
    return false;
  }
}

/**
 * Sends an immediate test notification with visual and sound feedback
 */
export async function sendTestNotification(): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    const req = await requestNotificationPermission();
    if (req !== 'granted') return false;
  }

  return sendLocalNotification('🎉 Finly - Notificações Ativadas!', {
    body: 'Você receberá lembretes inteligentes de contas, faturas e orçamento.',
    tag: 'test-notification',
  });
}

/**
 * Checks financial data and triggers automated alerts based on user selections
 */
export function checkAndTriggerScheduledAlerts(data: {
  transactions: any[];
  cards: any[];
  budgets: any[];
  goals: any[];
}) {
  if (typeof window === 'undefined') return;

  const prefs = getStoredNotificationPrefs();
  if (!prefs.enabled) return;

  const todayStr = new Date().toISOString().substring(0, 10);
  let sentAlertsLog: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(SENT_ALERTS_KEY);
    if (raw) sentAlertsLog = JSON.parse(raw);
  } catch (e) {}

  const hasAlertSentToday = (key: string) => {
    return sentAlertsLog[key] === todayStr;
  };

  const markAlertSentToday = (key: string) => {
    sentAlertsLog[key] = todayStr;
    try {
      localStorage.setItem(SENT_ALERTS_KEY, JSON.stringify(sentAlertsLog));
    } catch (e) {}
  };

  // 1. Faturas de Cartão de Crédito
  if (prefs.cardInvoices && data.cards) {
    const today = new Date();
    const currentDay = today.getDate();

    data.cards.forEach(card => {
      const dueDay = card.dueDay || 10;
      const daysUntilDue = dueDay - currentDay;

      // Alert if due within user preference window or today
      if (daysUntilDue >= 0 && daysUntilDue <= prefs.dueDaysAhead) {
        const alertKey = `card-due-${card.id}-${todayStr}`;
        if (!hasAlertSentToday(alertKey)) {
          const msg = daysUntilDue === 0
            ? `A fatura do seu cartão ${card.name} vence HOJE!`
            : `A fatura do seu cartão ${card.name} vence em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}.`;

          sendLocalNotification('💳 Vencimento de Cartão', {
            body: msg,
            tag: `card-due-${card.id}`,
          });
          markAlertSentToday(alertKey);
        }
      }
    });
  }

  // 2. Despesas Pendentes / Contas a Pagar
  if (prefs.pendingBills && data.transactions) {
    const pendingExpenses = data.transactions.filter(
      t => t.type === 'expense' && t.status === 'pending' && !t.ignored
    );

    pendingExpenses.forEach(t => {
      if (!t.date) return;
      const diffDays = Math.ceil((new Date(t.date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= prefs.dueDaysAhead) {
        const alertKey = `pending-tx-${t.id}-${todayStr}`;
        if (!hasAlertSentToday(alertKey)) {
          const msg = diffDays === 0
            ? `Conta "${t.description}" tem vencimento marcado para HOJE!`
            : `Conta "${t.description}" vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}.`;

          sendLocalNotification('⏰ Lembrete de Conta a Pagar', {
            body: msg,
            tag: `pending-tx-${t.id}`,
          });
          markAlertSentToday(alertKey);
        }
      }
    });
  }

  // 3. Alertas de Teto de Gastos (80% e 100%)
  if ((prefs.budget80 || prefs.budget100) && data.budgets && data.transactions) {
    const currentMonthPrefix = todayStr.substring(0, 7);
    const monthExpenses = data.transactions
      .filter(t => t.type === 'expense' && t.status === 'completed' && !t.ignored && t.date.startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBudget = data.budgets.reduce((sum, b) => sum + (b.limit || 0), 0);

    if (totalBudget > 0) {
      const percentage = (monthExpenses / totalBudget) * 100;

      // 100% Budget exceeded
      if (prefs.budget100 && percentage >= 100) {
        const alertKey = `budget-100-${currentMonthPrefix}`;
        if (!hasAlertSentToday(alertKey)) {
          sendLocalNotification('🚨 Limite de Orçamento Atingido!', {
            body: `Você ultrapassou 100% do teto planejado para o mês (${Math.round(percentage)}% utilizado).`,
            tag: 'budget-100',
          });
          markAlertSentToday(alertKey);
        }
      }
      // 80% Budget warning
      else if (prefs.budget80 && percentage >= 80) {
        const alertKey = `budget-80-${currentMonthPrefix}`;
        if (!hasAlertSentToday(alertKey)) {
          sendLocalNotification('⚠️ Alerta de Orçamento (80%)', {
            body: `Seus gastos atingiram ${Math.round(percentage)}% do limite planejado para este mês.`,
            tag: 'budget-80',
          });
          markAlertSentToday(alertKey);
        }
      }
    }
  }

  // 4. Progresso de Metas
  if (prefs.goalsProgress && data.goals) {
    data.goals.forEach(goal => {
      const current = goal.currentAmount || 0;
      const target = goal.targetAmount || 1;
      const pct = (current / target) * 100;

      if (pct >= 100) {
        const alertKey = `goal-achieved-${goal.id}`;
        if (!hasAlertSentToday(alertKey)) {
          sendLocalNotification('🎯 Meta Concluída!', {
            body: `Parabéns! Você alcançou 100% do objetivo da meta "${goal.name}".`,
            tag: `goal-${goal.id}`,
          });
          markAlertSentToday(alertKey);
        }
      }
    });
  }
}
