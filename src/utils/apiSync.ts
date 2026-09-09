import { getApiUrl } from '../services/apiConfig';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

class ApiSyncService {
  private syncTimer: any = null;
  private pendingPayload: any = null;
  private currentUserId: string | null = null;
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  public currentStatus: SyncStatus = 'synced';
  private initialConnected = false;

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
  }

  public subscribeStatus(listener: (status: SyncStatus) => void) {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private setStatus(status: SyncStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach(l => l(status));
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('finly_auth_token');
      // If native token is absent, check for active Supabase session token in localStorage
      if (!token) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase')) && key.endsWith('-auth-token')) {
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.access_token) {
                  token = parsed.access_token;
                  break;
                }
              }
            }
          }
        } catch (_) {}
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (this.currentUserId) {
        headers['x-user-id'] = this.currentUserId;
      }
    }
    return headers;
  }

  // Pull latest data from server (Authenticated)
  public async fetchServerStore(userId: string): Promise<any | null> {
    try {
      this.setStatus('syncing');
      this.currentUserId = userId;

      const authHeaders = this.getAuthHeaders();
      const res = await fetch(getApiUrl('/api/user/store'), {
        headers: authHeaders,
      });

      if (!res.ok) {
        this.setStatus('offline');
        return null;
      }

      const data = await res.json();
      this.setStatus('synced');

      // Subtle haptic confirmation on initial server connection only
      if (!this.initialConnected) {
        this.initialConnected = true;
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(25);
          }
        } catch (_) {}
      }

      return data.store || null;
    } catch (e) {
      this.setStatus('offline');
      return null;
    }
  }

  // Push local data to server with continuous debounce (Authenticated)
  public pushStore(userId: string, store: any, immediate = false) {
    this.currentUserId = userId;
    this.pendingPayload = store;

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    if (immediate) {
      this.executePush();
    } else {
      this.setStatus('syncing');
      this.syncTimer = setTimeout(() => {
        this.executePush();
      }, 800); // 800ms debounce
    }
  }

  private async executePush() {
    if (!this.currentUserId || !this.pendingPayload) return;
    const userId = this.currentUserId;
    const store = this.pendingPayload;

    try {
      this.setStatus('syncing');
      const res = await fetch(getApiUrl('/api/user/store'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ userId, store }),
      });

      if (res.ok) {
        this.setStatus('synced');
      } else {
        this.setStatus('offline');
      }
    } catch (e) {
      this.setStatus('offline');
    }
  }

  // Delete / Reset server store immediately on disk
  public async resetServerStore(userId: string): Promise<boolean> {
    try {
      this.currentUserId = userId;
      this.pendingPayload = null;
      if (this.syncTimer) {
        clearTimeout(this.syncTimer);
        this.syncTimer = null;
      }

      this.setStatus('syncing');
      const res = await fetch(getApiUrl('/api/user/store'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      if (res.ok) {
        this.setStatus('synced');
        return true;
      }
      this.setStatus('offline');
      return false;
    } catch (e) {
      this.setStatus('offline');
      return false;
    }
  }
}

export const apiSync = new ApiSyncService();
