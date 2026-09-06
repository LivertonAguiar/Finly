/**
 * Finly API Configuration
 * Supports web proxy, custom production endpoints, and Capacitor mobile environments.
 */

export const PRODUCTION_API_URL = 'https://finly.lpaguiar.com.br';

export const isNativeCapacitorPlatform = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  (isNativeCapacitorPlatform() ? PRODUCTION_API_URL : '');

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = API_BASE_URL || (isNativeCapacitorPlatform() ? PRODUCTION_API_URL : '');
  if (!base) {
    return cleanEndpoint;
  }
  return `${base.replace(/\/$/, '')}${cleanEndpoint}`;
}

