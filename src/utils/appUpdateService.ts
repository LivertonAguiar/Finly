/**
 * Finly App Update & Cache Service
 * Handles in-app version inspection, manual cache clearing, and APK update downloads.
 */
import { getApiUrl, PRODUCTION_API_URL } from '../services/apiConfig';
import { sendLocalNotification } from './notificationEngine';
import { CURRENT_VERSION, CURRENT_BUILD_DATE, CURRENT_RELEASE } from '../data/releases';

export const APP_VERSION = CURRENT_VERSION;
export const APP_BUILD_DATE = CURRENT_BUILD_DATE;
export const GITHUB_REPO_URL = 'https://github.com/LivertonAguiar/Finly';
export const GITHUB_ACTIONS_URL = 'https://github.com/LivertonAguiar/Finly/actions';
export const GITHUB_RELEASES_URL = 'https://github.com/LivertonAguiar/Finly/releases';

const LAST_NOTIFIED_VERSION_KEY = 'finly_last_notified_update_version';

export const shouldNotifyVersion = (version: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const lastNotified = localStorage.getItem(LAST_NOTIFIED_VERSION_KEY);
    return lastNotified !== version;
  } catch (_) {
    return true;
  }
};

export const markVersionNotified = (version: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_NOTIFIED_VERSION_KEY, version);
  } catch (_) {}
};

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  notes?: string;
  downloadUrl?: string;
  source?: 'api' | 'sw' | 'github' | 'local';
}

export function isNewerVersion(latest: string, current: string): boolean {
  if (!latest || !current) return false;
  const parse = (v: string) =>
    v.replace(/^[^\d]*/, '')
      .split('.')
      .map(n => parseInt(n, 10) || 0);

  const l = parse(latest);
  const c = parse(current);
  const maxLen = Math.max(l.length, c.length);

  for (let i = 0; i < maxLen; i++) {
    const lPart = l[i] || 0;
    const cPart = c[i] || 0;
    if (lPart > cPart) return true;
    if (lPart < cPart) return false;
  }
  return false;
}

export const isNativeCapacitor = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getPlatformLabel = (): string => {
  if (isNativeCapacitor()) return 'App Android Nativo';
  if (isMobileDevice()) return 'Mobile Web / PWA';
  return 'Web Desktop / PWA';
};

/**
 * Dispatches a global event to open the AppUpdateModal from anywhere in the app
 */
export const openAppUpdateModal = (autoCheck: boolean = true) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('finly_open_update_modal', { detail: { autoCheck } }));
  }
};

/**
 * Opens an external URL safely in mobile Android WebView or Desktop browser
 */
export const openExternalUrl = (url: string) => {
  if (typeof window === 'undefined') return;

  try {
    // In Android WebView/Capacitor, '_system' delegates to external browser (Chrome, Samsung Internet, etc.)
    const win = window.open(url, '_system');
    if (!win) {
      window.location.href = url;
    }
  } catch (_) {
    window.location.href = url;
  }
};

let activeCheckPromise: Promise<UpdateCheckResult> | null = null;

export const checkForAppUpdates = async (options?: {
  notifyIfFound?: boolean;
  isManualCheck?: boolean;
}): Promise<UpdateCheckResult> => {
  if (activeCheckPromise) {
    return activeCheckPromise;
  }

  activeCheckPromise = (async () => {
    try {
      return await performCheck(options);
    } finally {
      activeCheckPromise = null;
    }
  })();

  return activeCheckPromise;
};

const performCheck = async (options?: {
  notifyIfFound?: boolean;
  isManualCheck?: boolean;
}): Promise<UpdateCheckResult> => {
  const notifyIfFound = options?.notifyIfFound ?? false;

  try {
    // 1. Check server API first with primary and fallback endpoints
    let apiRes: Response | null = null;
    try {
      const apiEndpoint = getApiUrl('/api/app/version');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      apiRes = await fetch(apiEndpoint, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (primaryErr) {
      console.warn('Primary version check failed, attempting direct production fallback:', primaryErr);
      try {
        const fallbackUrl = `${PRODUCTION_API_URL}/api/app/version`;
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 4500);
        apiRes = await fetch(fallbackUrl, { signal: controller2.signal });
        clearTimeout(timeoutId2);
      } catch (_) {}
    }

    if (apiRes && apiRes.ok) {
      const serverInfo = await apiRes.json();
      const serverVer = (serverInfo.latestVersion || serverInfo.version || '').replace(/^v/, '');
      const hasUpdate = isNewerVersion(serverVer, APP_VERSION);
      const downloadUrl = serverInfo.downloadUrl || GITHUB_RELEASES_URL;

      const result: UpdateCheckResult = {
        hasUpdate,
        latestVersion: serverVer || APP_VERSION,
        notes: serverInfo.notes || CURRENT_RELEASE.summary,
        downloadUrl,
        source: 'api',
      };

      if (hasUpdate) {
        if (notifyIfFound && isNativeCapacitor() && shouldNotifyVersion(serverVer)) {
          markVersionNotified(serverVer);
          sendLocalNotification('🚀 Nova Atualização do Finly Disponível!', {
            body: `A versão v${serverVer} está disponível para download. Toque para atualizar o app.`,
            tag: 'app_update',
            id: 99999,
            force: false,
            data: { url: downloadUrl, version: serverVer },
          }).catch(() => {});
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finly_app_update_available', { detail: result }));
        }
      }

      return result;
    }
  } catch (err) {
    console.warn('API version check error, falling back to GitHub/PWA:', err);
  }

  // 1.5 Fallback to GitHub Releases API if server is offline or unreachable
  try {
    const ghController = new AbortController();
    const ghTimeout = setTimeout(() => ghController.abort(), 3500);
    const ghRes = await fetch('https://api.github.com/repos/LivertonAguiar/Finly/releases/latest', {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: ghController.signal,
    });
    clearTimeout(ghTimeout);

    if (ghRes.ok) {
      const ghData = await ghRes.json();
      const ghVer = (ghData.tag_name || '').replace(/^v/, '');
      if (ghVer) {
        const hasUpdate = isNewerVersion(ghVer, APP_VERSION);
        const apkAsset = ghData.assets?.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.apk'));
        const downloadUrl = apkAsset?.browser_download_url || ghData.html_url || GITHUB_RELEASES_URL;
        const result: UpdateCheckResult = {
          hasUpdate,
          latestVersion: ghVer,
          notes: ghData.body || CURRENT_RELEASE.summary,
          downloadUrl,
          source: 'github',
        };

        if (hasUpdate) {
          if (notifyIfFound && isNativeCapacitor() && shouldNotifyVersion(ghVer)) {
            markVersionNotified(ghVer);
            sendLocalNotification('🚀 Nova Atualização do Finly Disponível!', {
              body: `A versão v${ghVer} está disponível para download. Toque para atualizar o app.`,
              tag: 'app_update',
              id: 99999,
              force: false,
              data: { url: downloadUrl, version: ghVer },
            }).catch(() => {});
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('finly_app_update_available', { detail: result }));
          }
        }

        return result;
      }
    }
  } catch (_) {}

  // 2. If in service-worker supported browser/PWA, check registration update
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          const swResult: UpdateCheckResult = {
            hasUpdate: true,
            latestVersion: 'Nova versão pronta!',
            notes: 'Uma nova versão do Finly já foi baixada e está pronta para ser ativada.',
            source: 'sw',
          };

          if (notifyIfFound && shouldNotifyVersion('sw_new')) {
            markVersionNotified('sw_new');
            sendLocalNotification('🚀 Nova Versão do Finly!', {
              body: 'Uma nova versão do Finly já foi baixada e está pronta para ser ativada.',
              tag: 'app_update',
              id: 99999,
              force: false,
            }).catch(() => {});
          }

          return swResult;
        }
      }
    }
  } catch (_) {}

  return {
    hasUpdate: false,
    latestVersion: APP_VERSION,
    notes: 'Você já está utilizando a versão mais recente do Finly.',
    downloadUrl: GITHUB_RELEASES_URL,
    source: 'local',
  };
};

/**
 * Force clears client caches, unregisters old service worker, and reloads latest assets
 */
export const forceAppReload = async (): Promise<void> => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
  } catch (e) {
    console.error('Error clearing caches:', e);
  } finally {
    window.location.reload();
  }
};
