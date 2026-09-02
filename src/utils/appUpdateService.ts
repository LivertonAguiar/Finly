/**
 * Finly App Update & Cache Service
 * Handles in-app version inspection, manual cache clearing, and APK update downloads.
 */
import { getApiUrl } from '../services/apiConfig';

export const APP_VERSION = '1.1.3';
export const APP_BUILD_DATE = '2026-09-02';
export const GITHUB_REPO_URL = 'https://github.com/LivertonAguiar/planner-financeiro';
export const GITHUB_ACTIONS_URL = 'https://github.com/LivertonAguiar/planner-financeiro/actions';
export const GITHUB_RELEASES_URL = 'https://github.com/LivertonAguiar/planner-financeiro/releases';

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

export const checkForAppUpdates = async (): Promise<UpdateCheckResult> => {
  try {
    // 1. Check local server API first
    const apiEndpoint = getApiUrl('/api/app/version');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const apiRes = await fetch(apiEndpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const serverInfo = await apiRes.json();
      const serverVer = (serverInfo.version || '').replace(/^v/, '');
      const hasUpdate = isNewerVersion(serverVer, APP_VERSION);
      
      return {
        hasUpdate,
        latestVersion: serverVer || APP_VERSION,
        notes: serverInfo.notes || 'Melhorias de desempenho e novas funcionalidades financeiras.',
        downloadUrl: serverInfo.downloadUrl || GITHUB_RELEASES_URL,
        source: 'api',
      };
    }
  } catch (err) {
    console.warn('API version check error, falling back to PWA/Local:', err);
  }

  // 2. If in service-worker supported browser/PWA, check registration update
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          return {
            hasUpdate: true,
            latestVersion: 'Nova versão pronta!',
            notes: 'Uma nova versão do Finly já foi baixada e está pronta para ser ativada.',
            source: 'sw',
          };
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
