/**
 * Finly App Update & Cache Service
 * Handles in-app version inspection, manual cache clearing, and APK update downloads.
 */

export const APP_VERSION = '1.1.0';
export const APP_BUILD_DATE = '2026-09-02';
export const GITHUB_REPO_URL = 'https://github.com/LivertonAguiar/planner-financeiro';
export const GITHUB_ACTIONS_URL = 'https://github.com/LivertonAguiar/planner-financeiro/actions';
export const GITHUB_RELEASES_URL = 'https://github.com/LivertonAguiar/planner-financeiro/releases';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  notes?: string;
  downloadUrl?: string;
}

export const isNativeCapacitor = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

export const checkForAppUpdates = async (): Promise<UpdateCheckResult> => {
  try {
    // 1. If in service-worker supported browser/PWA, check registration update
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          return {
            hasUpdate: true,
            latestVersion: 'Nova versão pronta!',
            notes: 'Uma nova versão do Finly já foi baixada e está pronta para ser ativada.',
          };
        }
      }
    }

    // 2. Query GitHub Releases API
    const response = await fetch('https://api.github.com/repos/LivertonAguiar/planner-financeiro/releases/latest', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (response.ok) {
      const data = await response.json();
      const tagName = (data.tag_name || '').replace(/^v/, '');
      if (tagName && tagName !== APP_VERSION) {
        // Find APK asset if present
        const apkAsset = Array.isArray(data.assets)
          ? data.assets.find((a: any) => a.name && a.name.endsWith('.apk'))
          : null;

        return {
          hasUpdate: true,
          latestVersion: tagName,
          notes: data.body || 'Melhorias de desempenho e novas funcionalidades financeiras.',
          downloadUrl: apkAsset ? apkAsset.browser_download_url : data.html_url,
        };
      }
    }
  } catch (e) {
    console.warn('Update check fallback:', e);
  }

  return {
    hasUpdate: false,
    latestVersion: APP_VERSION,
    notes: 'Você já está utilizando a versão mais recente do Finly.',
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
