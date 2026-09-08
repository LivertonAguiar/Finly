/**
 * Finly - Notification Engine (Native Mobile Android/iOS & Web PWA)
 * Supports Capacitor Local Notifications, browser notifications, in-app alerts, audio chimes, and scheduled check triggers.
 */
import { LocalNotifications } from '@capacitor/local-notifications';

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

export const isNativePlatform = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

/**
 * Initializes notification channels for Android 8+ (Oreo and higher) with custom chime
 */
export async function initializeNotificationChannels() {
  if (!isNativePlatform()) return;
  try {
    // Delete legacy channel without custom sound so Android applies finly_chime.wav cleanly
    try {
      await LocalNotifications.deleteChannel({ id: 'finly-alerts' });
    } catch (_) {}

    await LocalNotifications.createChannel({
      id: 'finly-alerts-v2',
      name: 'Alertas Financeiros Finly',
      description: 'Lembretes de vencimento de faturas, contas a pagar e orçamentos do Finly',
      importance: 5, // High importance (heads-up notification)
      visibility: 1, // Public visibility on lockscreen
      sound: 'finly_chime.wav',
      vibration: true,
      lights: true,
      lightColor: '#7C4DFF',
    });
  } catch (e) {
    console.warn('Could not initialize Capacitor notification channel:', e);
  }
}

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
 * Checks current permission (Native or Browser)
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined') return 'denied';

  if (isNativePlatform()) {
    const prefs = getStoredNotificationPrefs();
    return prefs.enabled ? 'granted' : 'default';
  }

  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Requests notification permission from user (Native Android or Browser)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  // 1. Native Mobile (Capacitor Android/iOS)
  if (isNativePlatform()) {
    try {
      await initializeNotificationChannels();
      const res = await LocalNotifications.requestPermissions();
      if (res.display === 'granted') {
        saveNotificationPrefs({ enabled: true });
        return 'granted';
      }
      return 'denied';
    } catch (e) {
      console.warn('Native requestPermissions error:', e);
      return 'denied';
    }
  }

  // 2. Browser Fallback
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
function playSynthesizedChime() {
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
 * Plays the official Finly financial audio chime (via /sounds/finly_chime.wav or Web Audio synthesizer)
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/sounds/finly_chime.wav');
    audio.volume = 0.5;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        playSynthesizedChime();
      });
    }
  } catch (_) {
    playSynthesizedChime();
  }
}

/**
 * Sends a local notification (Native Android APK, Mobile PWA, or Desktop Browser)
 */
export async function sendLocalNotification(
  title: string,
  options: {
    body: string;
    tag?: string;
    icon?: string;
    badge?: string;
    data?: any;
    id?: number;
    force?: boolean;
  }
): Promise<boolean> {
  // Always emit an in-app notification event so active users see a visual toast immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('finly_in_app_notification', {
        detail: {
          title,
          body: options.body,
          tag: options.tag,
        },
      })
    );
  }

  const prefs = getStoredNotificationPrefs();
  const isPriorityAlert = options.force || options.tag === 'app_update' || options.tag === 'app_up_to_date' || options.tag === 'test-notification';
  if (!prefs.enabled && !isPriorityAlert) return false;

  // Audio chime:
  // On Web / PWA / Desktop, play audio directly in-app.
  // On Native Mobile (Android APK), Android OS triggers finly_chime.wav externally on the notification stream.
  if ((prefs.sound || isPriorityAlert) && !isNativePlatform()) {
    playNotificationSound();
  }

  // Device vibration
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([60, 40, 60]);
    } catch (_) {}
  }

  // 1. Native Capacitor (Android APK)
  if (isNativePlatform()) {
    try {
      await initializeNotificationChannels();
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') {
          // Fallback to in-app chime if system notification permission is denied
          if (prefs.sound || isPriorityAlert) {
            playNotificationSound();
          }
          return true;
        }
      }

      const notifId = options.id || Math.floor(Math.random() * 100000) + 1;

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options.body,
            id: notifId,
            channelId: 'finly-alerts-v2',
            sound: 'finly_chime.wav',
            schedule: { at: new Date(Date.now() + 150) },
            extra: options.data,
            smallIcon: 'ic_stat_finly_notification',
            iconColor: '#7C4DFF',
          },
        ],
      });

      return true;
    } catch (err) {
      console.warn('LocalNotifications native schedule error:', err);
      if (prefs.sound || isPriorityAlert) {
        playNotificationSound();
      }
    }
  }

  // 2. Service Worker (Mobile PWA)
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: options.body,
          icon: options.icon || '/finly-logo.png',
          badge: options.badge || '/icon-192.png',
          tag: options.tag || 'finly-alert',
          data: options.data,
        });
        return true;
      }
    }
  } catch (_) {}

  // 3. Desktop Browser Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options.body,
        icon: options.icon || '/finly-logo.png',
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
    }
  }

  return true;
}

/**
 * Sends an immediate test notification with visual and sound feedback
 */
export async function sendTestNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') return false;

  return sendLocalNotification('🎉 Finly - Notificações Ativadas!', {
    body: 'Você receberá lembretes inteligentes de contas, faturas e controle de orçamento no seu celular.',
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
