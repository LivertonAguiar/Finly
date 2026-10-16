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

const PIN_SALT_KEY = 'finly_pin_salt';
const PIN_ATTEMPTS_KEY = 'finly_pin_failed_attempts';
const PIN_LOCKOUT_KEY = 'finly_pin_lockout_until';

// Legacy salt for transparent backwards compatibility
const LEGACY_PIN_SALT = 'finly_secure_vault_2026_';

/**
 * Gets or creates a cryptographically secure dynamic salt per installation
 */
export function getOrCreatePinSalt(): string {
  try {
    let salt = localStorage.getItem(PIN_SALT_KEY);
    if (!salt) {
      const randomValues = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randomValues);
        salt = Array.from(randomValues).map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        salt = 'finly_salt_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
      localStorage.setItem(PIN_SALT_KEY, salt);
    }
    return salt;
  } catch (e) {
    return 'finly_dynamic_fallback_salt_2026';
  }
}

/**
 * Generates a PBKDF2 derived hash of the PIN with 100,000 iterations
 */
export async function hashPin(pin: string, customSalt?: string): Promise<string> {
  const salt = customSalt || getOrCreatePinSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${salt}:${hex}`;
}

/**
 * Legacy single-round SHA-256 hash for backward compatibility
 */
export async function legacyHashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(LEGACY_PIN_SALT + pin);
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

const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key);
    } catch (e) {}
  },
};

export function setSecurityLockEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PIN_ENABLED_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      safeSessionStorage.removeItem(SESSION_LOCKED_KEY);
    }
  } catch (e) {}
}

export async function setPinCode(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
  localStorage.setItem(PIN_ENABLED_KEY, 'true');
  resetFailedPinAttempts();
}

/**
 * Checks remaining lockout seconds if the user exceeded failed attempts
 */
export function getPinLockoutRemainingSeconds(): number {
  try {
    const lockoutUntilStr = localStorage.getItem(PIN_LOCKOUT_KEY);
    if (!lockoutUntilStr) return 0;
    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      localStorage.removeItem(PIN_LOCKOUT_KEY);
      return 0;
    }
    return remaining;
  } catch (e) {
    return 0;
  }
}

export function isPinLocked(): boolean {
  return getPinLockoutRemainingSeconds() > 0;
}

export function recordFailedPinAttempt(): { locked: boolean; remainingSeconds: number; attempts: number } {
  try {
    const attemptsStr = localStorage.getItem(PIN_ATTEMPTS_KEY);
    const attempts = (attemptsStr ? parseInt(attemptsStr, 10) : 0) + 1;
    localStorage.setItem(PIN_ATTEMPTS_KEY, attempts.toString());

    if (attempts >= 10) {
      // Lock for 5 minutes (300 seconds)
      const lockUntil = Date.now() + 300 * 1000;
      localStorage.setItem(PIN_LOCKOUT_KEY, lockUntil.toString());
      return { locked: true, remainingSeconds: 300, attempts };
    } else if (attempts >= 5) {
      // Lock for 30 seconds
      const lockUntil = Date.now() + 30 * 1000;
      localStorage.setItem(PIN_LOCKOUT_KEY, lockUntil.toString());
      return { locked: true, remainingSeconds: 30, attempts };
    }

    return { locked: false, remainingSeconds: 0, attempts };
  } catch (e) {
    return { locked: false, remainingSeconds: 0, attempts: 1 };
  }
}

export function resetFailedPinAttempts(): void {
  try {
    localStorage.removeItem(PIN_ATTEMPTS_KEY);
    localStorage.removeItem(PIN_LOCKOUT_KEY);
  } catch (e) {}
}

export async function verifyPinCode(pin: string): Promise<{ success: boolean; locked?: boolean; remainingSeconds?: number }> {
  const remainingLockout = getPinLockoutRemainingSeconds();
  if (remainingLockout > 0) {
    return { success: false, locked: true, remainingSeconds: remainingLockout };
  }

  const storedHash = localStorage.getItem(PIN_HASH_KEY);
  if (!storedHash) return { success: false };

  // 1. Verify PBKDF2 format (pbkdf2:<salt>:<hex>)
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHex = parts[2];
      const computed = await hashPin(pin, salt);
      const computedHex = computed.split(':')[2];
      if (computedHex === expectedHex) {
        resetFailedPinAttempts();
        return { success: true };
      }
    }
  } else {
    // 2. Legacy single-round SHA-256 hash check
    const legacy = await legacyHashPin(pin);
    if (storedHash === legacy) {
      // Seamless automatic migration to PBKDF2 with dynamic salt
      await setPinCode(pin);
      resetFailedPinAttempts();
      return { success: true };
    }
  }

  // Record failed attempt and compute lockout
  const attemptResult = recordFailedPinAttempt();
  return {
    success: false,
    locked: attemptResult.locked,
    remainingSeconds: attemptResult.remainingSeconds,
  };
}

export function removePinCode(): void {
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(PIN_ENABLED_KEY);
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  localStorage.removeItem(PIN_SALT_KEY);
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
  localStorage.removeItem(PIN_LOCKOUT_KEY);
  safeSessionStorage.removeItem(SESSION_LOCKED_KEY);
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
    const isLocked = safeSessionStorage.getItem(SESSION_LOCKED_KEY);
    return isLocked === 'true';
  } catch (e) {
    return false;
  }
}

export function lockApp(): void {
  if (isSecurityLockEnabled()) {
    safeSessionStorage.setItem(SESSION_LOCKED_KEY, 'true');
    window.dispatchEvent(new CustomEvent('finly_lock_state_changed', { detail: { locked: true } }));
  }
}

export function unlockApp(): void {
  safeSessionStorage.removeItem(SESSION_LOCKED_KEY);
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
