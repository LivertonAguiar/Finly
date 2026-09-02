/**
 * Finly API Configuration
 * Supports web proxy, custom production endpoints, and Capacitor mobile environments.
 */

export const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string) || '';

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL.replace(/\/$/, '')}${cleanEndpoint}`;
}
