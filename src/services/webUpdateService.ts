/**
 * Finly Web OTA & Live Update Service
 * Manages in-app React/Vite bundle updates via @capawesome/capacitor-live-update.
 * Ensures offline-first operation, SHA-256 integrity verification,
 * minNativeVersion compatibility checks, and automatic rollback on failure.
 */
import { LiveUpdate, ReadyResult } from '@capawesome/capacitor-live-update';
import { getApiUrl, PRODUCTION_API_URL } from './apiConfig';
import { APP_VERSION, isNewerVersion, isNativeCapacitor } from '../utils/appUpdateService';

export interface NativeManifestInfo {
  version: string;
  minimumVersion?: string;
  downloadUrl?: string;
}

export interface WebBundleManifestInfo {
  version: string;
  minNativeVersion?: string;
  bundleUrl: string;
  sha256?: string;
  mandatory?: boolean;
  releaseDate?: string;
  notes?: string;
}

export interface AppManifestResponse {
  native: NativeManifestInfo;
  web: WebBundleManifestInfo;
}

export interface WebUpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  minNativeVersion?: string;
  bundleUrl?: string;
  sha256?: string;
  mandatory?: boolean;
  notes?: string;
  skippedReason?: 'UP_TO_DATE' | 'NOT_NATIVE' | 'NATIVE_UPDATE_REQUIRED' | 'FETCH_ERROR';
}

const STORAGE_KEYS = {
  CURRENT_WEB_VERSION: 'finly_current_web_bundle_version',
  PREVIOUS_WEB_VERSION: 'finly_previous_web_bundle_version',
  ROLLBACK_NOTIFIED_VERSION: 'finly_rollback_notified_version',
  PENDING_WEB_UPDATE: 'finly_pending_web_bundle_version',
};

/**
 * Returns the native APK version (from package.json / Capacitor build)
 */
export const getNativeVersion = (): string => {
  return APP_VERSION;
};

/**
 * Returns the currently active web bundle version.
 * If running the built-in bundle, returns the native version.
 */
export const getCurrentWebVersion = async (): Promise<string> => {
  if (!isNativeCapacitor()) {
    return APP_VERSION;
  }
  try {
    const result = await LiveUpdate.getCurrentBundle();
    if (result && result.bundleId) {
      return result.bundleId;
    }
  } catch (err) {
    console.warn('[OTA] Error getting current bundle:', err);
  }
  return APP_VERSION;
};

/**
 * Fetches the central update manifest from VPS
 */
export const fetchAppManifest = async (): Promise<AppManifestResponse | null> => {
  const endpoints = [
    getApiUrl('/api/app/manifest'),
    `${PRODUCTION_API_URL}/api/app/manifest`,
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return (await res.json()) as AppManifestResponse;
      }
    } catch (err) {
      console.warn(`[OTA] Manifest fetch failed on ${endpoint}:`, err);
    }
  }

  return null;
};

/**
 * Checks if a newer web bundle is available and compatible with the installed native APK
 */
export const checkForWebUpdate = async (): Promise<WebUpdateCheckResult> => {
  if (!isNativeCapacitor()) {
    return {
      hasUpdate: false,
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      skippedReason: 'NOT_NATIVE',
    };
  }

  const currentWebVersion = await getCurrentWebVersion();
  const nativeVersion = getNativeVersion();

  const manifest = await fetchAppManifest();
  if (!manifest || !manifest.web || !manifest.web.version) {
    return {
      hasUpdate: false,
      currentVersion: currentWebVersion,
      latestVersion: currentWebVersion,
      skippedReason: 'FETCH_ERROR',
    };
  }

  const remoteWeb = manifest.web;
  const isNewer = isNewerVersion(remoteWeb.version, currentWebVersion);

  if (!isNewer) {
    return {
      hasUpdate: false,
      currentVersion: currentWebVersion,
      latestVersion: remoteWeb.version,
      skippedReason: 'UP_TO_DATE',
    };
  }

  // Check minNativeVersion rule: NEVER install if minNativeVersion > installed nativeVersion
  if (remoteWeb.minNativeVersion) {
    const requiresNativeUpgrade = isNewerVersion(remoteWeb.minNativeVersion, nativeVersion);
    if (requiresNativeUpgrade) {
      console.warn(
        `[OTA] Bundle web v${remoteWeb.version} requer versão nativa mínima v${remoteWeb.minNativeVersion}. ` +
        `Versão nativa instalada é v${nativeVersion}. Instalação bloqueada.`
      );
      return {
        hasUpdate: false,
        currentVersion: currentWebVersion,
        latestVersion: remoteWeb.version,
        minNativeVersion: remoteWeb.minNativeVersion,
        skippedReason: 'NATIVE_UPDATE_REQUIRED',
      };
    }
  }

  return {
    hasUpdate: true,
    currentVersion: currentWebVersion,
    latestVersion: remoteWeb.version,
    minNativeVersion: remoteWeb.minNativeVersion,
    bundleUrl: remoteWeb.bundleUrl,
    sha256: remoteWeb.sha256,
    mandatory: !!remoteWeb.mandatory,
    notes: remoteWeb.notes,
  };
};

/**
 * Downloads the ZIP bundle, validates SHA-256 checksum, and marks it as the next bundle
 */
export const downloadAndApplyWebBundle = async (
  updateInfo: WebUpdateCheckResult,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> => {
  if (!isNativeCapacitor()) {
    return { success: false, error: 'Plataforma não suporta Live Update' };
  }

  if (!updateInfo.bundleUrl || !updateInfo.latestVersion) {
    return { success: false, error: 'URL do bundle ou versão ausente' };
  }

  try {
    const bundleId = updateInfo.latestVersion;
    const checksum = updateInfo.sha256 ? updateInfo.sha256.trim().toLowerCase() : undefined;

    console.log(`[OTA] Iniciando download do bundle web v${bundleId} (${updateInfo.bundleUrl})...`);

    // Listen for progress events if callback provided
    let removeListener: (() => void) | null = null;
    if (onProgress) {
      const handle = await LiveUpdate.addListener('downloadBundleProgress', (event) => {
        if (event.bundleId === bundleId) {
          onProgress(event.progress);
        }
      });
      removeListener = () => handle.remove();
    }

    try {
      await LiveUpdate.downloadBundle({
        bundleId,
        url: updateInfo.bundleUrl,
        checksum,
        artifactType: 'zip',
      });
    } finally {
      if (removeListener) removeListener();
    }

    console.log(`[OTA] Bundle v${bundleId} baixado e verificado com sucesso. Ativando como próximo bundle...`);
    await LiveUpdate.setNextBundle({ bundleId });

    // Store in localStorage for audit
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_WEB_UPDATE, bundleId);
    } catch (_) {}

    // Clean up older bundles while preserving current and previous
    await cleanOldBundlesPreservingRollback(bundleId);

    // If mandatory, reload immediately; otherwise notify UI
    if (updateInfo.mandatory) {
      console.log(`[OTA] Atualização obrigatória. Recarregando WebView...`);
      await LiveUpdate.reload();
    } else {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('finly_web_update_ready', {
            detail: {
              version: bundleId,
              notes: updateInfo.notes,
            },
          })
        );
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[OTA] Falha ao baixar ou ativar bundle:', err);
    return { success: false, error: err?.message || 'Erro desconhecido durante o download do bundle' };
  }
};

let isConfirmedReady = false;
let bootstrapErrorDetected = false;

/**
 * Signals that an uncaught error occurred during app startup/bootstrap.
 * Prevents LiveUpdate.ready() from falsely declaring a broken bundle as healthy.
 */
export const markBootstrapError = (): void => {
  bootstrapErrorDetected = true;
  console.warn('[OTA] Erro de bootstrap sinalizado. Confirmação de bundle bloqueada.');
};

/**
 * Confirms that the current bundle loaded successfully.
 * This cancels the rollback safety timer.
 */
export const confirmWebBundleReady = async (): Promise<ReadyResult | null> => {
  if (!isNativeCapacitor()) return null;

  try {
    const result = await LiveUpdate.ready();
    console.log('[OTA] LiveUpdate.ready() confirmado com sucesso:', result);

    if (result.rollback) {
      console.warn(
        `[OTA ALERTA] Ocorreu um rollback automático! Bundle anterior: ${result.previousBundleId} -> Revertido para: ${result.currentBundleId || 'Bundle embutido no APK'}`
      );
      try {
        if (result.previousBundleId) {
          localStorage.setItem(STORAGE_KEYS.ROLLBACK_NOTIFIED_VERSION, result.previousBundleId);
        }
      } catch (_) {}
    } else if (result.currentBundleId) {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_WEB_VERSION, result.currentBundleId);
        if (result.previousBundleId) {
          localStorage.setItem(STORAGE_KEYS.PREVIOUS_WEB_VERSION, result.previousBundleId);
        }
      } catch (_) {}
    }

    return result;
  } catch (err) {
    console.warn('[OTA] Erro ao chamar LiveUpdate.ready():', err);
    return null;
  }
};

/**
 * Confirms that the current bundle loaded successfully only after the critical bootstrap
 * is fully functional and stable (DOM rendered, contexts initialized and no uncaught exceptions).
 * Delay default: 3500ms (gives ample time to verify auth, stores and avoids premature ready()).
 * LiveUpdate plugin readyTimeout is 10000ms, so 3.5s is well within safe bounds.
 */
export const confirmWebBundleReadyWhenStable = async (options?: { delayMs?: number }): Promise<ReadyResult | null> => {
  if (!isNativeCapacitor()) return null;
  if (isConfirmedReady) return null;

  const delay = options?.delayMs ?? 3500;
  await new Promise(r => setTimeout(r, delay));

  // If an error was caught during the initial grace period, abort confirmation immediately!
  if (bootstrapErrorDetected) {
    console.error('[OTA] ABORTADO: Erro de bootstrap detectado durante o período de carência. O bundle NÃO será confirmado.');
    return null;
  }

  // Sanity check: Ensure root DOM element has rendered content (not white screen of death)
  if (typeof document !== 'undefined') {
    const root = document.getElementById('root');
    if (!root || !root.firstElementChild) {
      console.error('[OTA] ABORTADO: Elemento root vazio após 3.5s (possível tela branca). O bundle NÃO será confirmado.');
      markBootstrapError();
      return null;
    }
  }

  isConfirmedReady = true;
  return await confirmWebBundleReady();
};

/**
 * Triggers an immediate rollback to the previous bundle or native bundle
 * Used by ErrorBoundary in case of fatal crash on startup
 */
export const triggerEmergencyRollback = async (): Promise<void> => {
  if (!isNativeCapacitor()) {
    window.location.reload();
    return;
  }

  try {
    console.warn('[OTA] Acionando ROLLBACK DE EMERGÊNCIA para bundle nativo/anterior...');
    let previousBundleId: string | null = null;
    try {
      previousBundleId = localStorage.getItem(STORAGE_KEYS.PREVIOUS_WEB_VERSION);
    } catch (_) {}

    if (previousBundleId) {
      await LiveUpdate.setNextBundle({ bundleId: previousBundleId });
    } else {
      await LiveUpdate.reset();
    }
    await LiveUpdate.reload();
  } catch (err) {
    console.error('[OTA] Falha no rollback de emergência, resetando WebView para padrão:', err);
    try {
      await LiveUpdate.reset();
      await LiveUpdate.reload();
    } catch (_) {
      window.location.reload();
    }
  }
};

/**
 * Helper to delete obsolete bundles from app storage, keeping current, next, and previous
 */
const cleanOldBundlesPreservingRollback = async (incomingBundleId: string): Promise<void> => {
  try {
    const result = await LiveUpdate.getBundles();
    if (!result || !result.bundleIds || result.bundleIds.length <= 2) {
      return;
    }

    const currentResult = await LiveUpdate.getCurrentBundle();
    const currentBundleId = currentResult?.bundleId;

    let previousBundleId: string | null = null;
    try {
      previousBundleId = localStorage.getItem(STORAGE_KEYS.PREVIOUS_WEB_VERSION);
    } catch (_) {}

    for (const id of result.bundleIds) {
      // Never delete the incoming bundle, the currently active bundle, or the rollback candidate
      if (id === incomingBundleId || id === currentBundleId || id === previousBundleId) {
        continue;
      }
      try {
        console.log(`[OTA] Removendo bundle antigo do disco para liberar espaço: ${id}`);
        await LiveUpdate.deleteBundle({ bundleId: id });
      } catch (e) {
        console.warn(`[OTA] Falha ao deletar bundle antigo ${id}:`, e);
      }
    }
  } catch (err) {
    console.warn('[OTA] Erro durante a faxina de bundles antigos:', err);
  }
};

/**
 * Manually reloads the WebView to apply a downloaded pending update
 */
export const reloadToApplyWebUpdate = async (): Promise<void> => {
  if (isNativeCapacitor()) {
    await LiveUpdate.reload();
  } else {
    window.location.reload();
  }
};
