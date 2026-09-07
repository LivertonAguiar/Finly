import { registerPlugin, Capacitor } from '@capacitor/core';

/**
 * Finly Security & Biometric Lock Manager
 * Provides SHA-256 hashed PIN protection and WebAuthn / Capacitor biometric authentication.
 */

const PIN_ENABLED_KEY = 'finly_pin_enabled';
const PIN_HASH_KEY = 'finly_pin_hash';
const BIOMETRIC_ENABLED_KEY = 'finly_biometric_enabled';
const LOCK_TIMEOUT_KEY = 'finly_lock_timeout_mins'; // 0 = immediate, 1 = 1min, 5 = 5min, 15 = 15min
const LAST_ACTIVE_KEY = 'finly_last_active_ts';
const SESSION_LOCKED_KEY = 'finly_session_locked';

// Simple salt for client-side hashing
const PIN_SALT = 'finly_secure_vault_2026_';

/**
 * Generates a SHA-256 hash of the PIN
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(PIN_SALT + pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isPinConfigured(): boolean {
  try {
    const hash = localStorage.getItem(PIN_HASH_KEY);
    return !!hash && hash.length > 0;
  } catch (e) {
    return false;
  }
}

export function isSecurityLockEnabled(): boolean {
  try {
    const enabled = localStorage.getItem(PIN_ENABLED_KEY);
    return enabled === 'true' && isPinConfigured();
  } catch (e) {
    return false;
  }
}

export function setSecurityLockEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PIN_ENABLED_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      sessionStorage.removeItem(SESSION_LOCKED_KEY);
    }
  } catch (e) {}
}

export async function setPinCode(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
  localStorage.setItem(PIN_ENABLED_KEY, 'true');
}

export async function verifyPinCode(pin: string): Promise<boolean> {
  const storedHash = localStorage.getItem(PIN_HASH_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPin(pin);
  return storedHash === inputHash;
}

export function removePinCode(): void {
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(PIN_ENABLED_KEY);
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  sessionStorage.removeItem(SESSION_LOCKED_KEY);
}

export function getLockTimeoutMinutes(): number {
  try {
    const val = localStorage.getItem(LOCK_TIMEOUT_KEY);
    return val !== null ? parseInt(val, 10) : 1; // Default 1 minute
  } catch (e) {
    return 1;
  }
}

export function setLockTimeoutMinutes(minutes: number): void {
  localStorage.setItem(LOCK_TIMEOUT_KEY, minutes.toString());
}

export interface FinlyBiometricPlugin {
  isAvailable(): Promise<{
    isAvailable: boolean;
    hasEnrolledBiometrics: boolean;
    code?: string;
    reason?: string;
    error?: string;
  }>;
  authenticate(options?: {
    title?: string;
    subtitle?: string;
    description?: string;
    negativeButtonText?: string;
  }): Promise<{ success: boolean; error?: string; errorCode?: number }>;
}

const FinlyBiometric = registerPlugin<FinlyBiometricPlugin>('FinlyBiometric');

export interface BiometricStatusInfo {
  supported: boolean;
  enrolled: boolean;
  reason?: string;
}

export function isBiometricEnabled(): boolean {
  try {
    return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setBiometricEnabled(enabled: boolean): void {
  localStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Checks detailed device biometric capabilities (sensor availability & enrolled fingerprints)
 */
export async function getBiometricStatus(): Promise<BiometricStatusInfo> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await FinlyBiometric.isAvailable();
      return {
        supported: !!res.isAvailable,
        enrolled: !!res.hasEnrolledBiometrics,
        reason: res.reason,
      };
    } catch (e: any) {
      return {
        supported: false,
        enrolled: false,
        reason: e?.message || 'Falha ao acessar o sensor biométrico nativo.',
      };
    }
  }

  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return { supported: !!available, enrolled: !!available };
    } catch (e: any) {
      return { supported: false, enrolled: false, reason: e?.message };
    }
  }

  return { supported: false, enrolled: false, reason: 'Dispositivo sem suporte a biometria.' };
}

/**
 * Checks if device supports biometric authentication (Native Android BiometricPrompt or WebAuthn)
 */
export async function isBiometricSupported(): Promise<boolean> {
  const status = await getBiometricStatus();
  return status.supported;
}

/**
 * Performs biometric authentication via Native Android BiometricPrompt or WebAuthn
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Native Capacitor platform (Android BiometricPrompt)
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await FinlyBiometric.authenticate({
        title: 'Finly',
        subtitle: 'Toque no sensor biométrico',
        description: 'Autentique com sua impressão digital para desbloquear',
        negativeButtonText: 'Usar PIN',
      });
      return !!res.success;
    } catch (err: any) {
      console.warn('[FinlyBiometric] Native authentication error:', err);
      return false;
    }
  }

  // 2. Web fallback (WebAuthn prompt)
  if (window.PublicKeyCredential) {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
          rpId: window.location.hostname || 'localhost',
        },
      });

      return !!credential;
    } catch (err: any) {
      console.warn('WebAuthn biometric failed or dismissed:', err?.message);
      return false;
    }
  }

  return false;
}

/**
 * Session Lock Management
 */
export function isAppLocked(): boolean {
  if (!isSecurityLockEnabled()) return false;
  try {
    const isLocked = sessionStorage.getItem(SESSION_LOCKED_KEY);
    return isLocked === 'true';
  } catch (e) {
    return false;
  }
}

export function lockApp(): void {
  if (isSecurityLockEnabled()) {
    sessionStorage.setItem(SESSION_LOCKED_KEY, 'true');
    window.dispatchEvent(new CustomEvent('finly_lock_state_changed', { detail: { locked: true } }));
  }
}

export function unlockApp(): void {
  sessionStorage.removeItem(SESSION_LOCKED_KEY);
  recordActivity();
  window.dispatchEvent(new CustomEvent('finly_lock_state_changed', { detail: { locked: false } }));
}

export function recordActivity(): void {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch (e) {}
}

export function shouldLockDueToInactivity(): boolean {
  if (!isSecurityLockEnabled()) return false;

  const timeoutMinutes = getLockTimeoutMinutes();
  if (timeoutMinutes === 0) return true; // Immediate lock

  try {
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!lastActiveStr) return true;
    const lastActive = parseInt(lastActiveStr, 10);
    const elapsedMinutes = (Date.now() - lastActive) / (1000 * 60);
    return elapsedMinutes >= timeoutMinutes;
  } catch (e) {
    return true;
  }
}
