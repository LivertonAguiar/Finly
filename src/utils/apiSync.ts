import { getApiUrl } from '../services/apiConfig';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

class ApiSyncService {
  private syncTimer: any = null;
  private pendingPayload: any = null;
  private pendingUserId: string | null = null;
  private isPushInFlight = false;
  private activePushController: AbortController | null = null;
  private activePushCompletion: Promise<void> | null = null;
  private pushGeneration = 0;
  private currentUserId: string | null = null;
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  public currentStatus: SyncStatus = 'synced';
  private initialConnected = false;

  private eventSource: EventSource | null = null;
  private realtimeListeners: ((event: { type: string; store?: any; timestamp?: string }) => void)[] = [];

  public setUserId(userId: string | null) {
    if (this.currentUserId === userId) return;
    this.currentUserId = userId;
    this.pushGeneration += 1;
    this.pendingUserId = null;
    this.pendingPayload = null;
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    // A request already sent keeps its original explicit user headers/body.
    // Abort only on account switches; reset uses an awaited barrier below.
    this.activePushController?.abort();
    if (userId && this.realtimeListeners.length > 0) {
      this.ensureEventSourceConnected();
    }
  }

  public subscribeRealtimeEvents(listener: (event: { type: string; store?: any; timestamp?: string }) => void) {
    this.realtimeListeners.push(listener);
    this.ensureEventSourceConnected();
    return () => {
      this.realtimeListeners = this.realtimeListeners.filter(l => l !== listener);
      if (this.realtimeListeners.length === 0 && this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  private ensureEventSourceConnected() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) return;

    const userId = this.currentUserId;
    if (!userId || userId === 'guest' || userId === 'usr-demo-financeiro') return;

    let token = '';
    try {
      token = localStorage.getItem('finly_auth_token') || '';
    } catch (_) {}

    const url = getApiUrl(`/api/sync/events?userId=${encodeURIComponent(userId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`);
    try {
      const es = new EventSource(url);
      this.eventSource = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.type === 'STORE_UPDATED') {
            this.realtimeListeners.forEach(cb => cb(data));
          }
        } catch (_) {}
      };

      es.onerror = () => {
        // Will auto-reconnect automatically by standard browser EventSource
      };
    } catch (_) {}
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

  private getAuthHeaders(userId: string | null = this.currentUserId): Record<string, string> {
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
      if (userId) {
        headers['x-user-id'] = userId;
      }
    }
    return headers;
  }

  // Pull latest data from server (Authenticated)
  public async fetchServerStore(userId: string): Promise<any | null> {
    try {
      this.setStatus('syncing');

      const authHeaders = this.getAuthHeaders(userId);
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
    if (this.currentUserId === null) this.setUserId(userId);
    // Ignore a callback left behind by a previous account. The active account
    // effect will enqueue its own current snapshot.
    if (this.currentUserId !== userId) return;
    this.pendingUserId = userId;
    this.pendingPayload = store;

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    if (immediate) {
      void this.executePush();
    } else {
      this.setStatus('syncing');
      this.syncTimer = setTimeout(() => {
        this.syncTimer = null;
        void this.executePush();
      }, 800); // 800ms debounce
    }
  }

  private async executePush() {
    if (this.isPushInFlight || !this.pendingUserId || !this.pendingPayload) return;

    const userId = this.pendingUserId;
    const store = this.pendingPayload;
    const generation = this.pushGeneration;
    this.pendingUserId = null;
    this.pendingPayload = null;
    this.isPushInFlight = true;
    const controller = new AbortController();
    this.activePushController = controller;
    let completePush!: () => void;
    const pushCompletion = new Promise<void>(resolve => {
      completePush = resolve;
    });
    this.activePushCompletion = pushCompletion;
    const pushTimeout = setTimeout(() => controller.abort(), 15000);
    let saved = false;

    try {
      this.setStatus('syncing');
      const res = await fetch(getApiUrl('/api/user/store'), {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(userId),
        },
        body: JSON.stringify({ userId, store }),
      });

      if (res.ok) {
        saved = true;
        this.setStatus('synced');
      } else {
        this.setStatus('offline');
      }
    } catch (e) {
      this.setStatus('offline');
    } finally {
      clearTimeout(pushTimeout);
      this.isPushInFlight = false;
      if (this.activePushController === controller) {
        this.activePushController = null;
      }
      completePush();
      if (this.activePushCompletion === pushCompletion) {
        this.activePushCompletion = null;
      }

      // Keep the latest failed payload for retry. If a newer payload arrived
      // while this request was running, that newer snapshot already wins.
      if (!saved && generation === this.pushGeneration && !this.pendingPayload) {
        this.pendingUserId = userId;
        this.pendingPayload = store;
      }

      // Only start the next request after the previous one has completed. This
      // guarantees that an older whole-store snapshot cannot win by finishing last.
      if (this.pendingPayload && !this.syncTimer) {
        if (saved || generation !== this.pushGeneration) {
          void this.executePush();
        } else {
          this.syncTimer = setTimeout(() => {
            this.syncTimer = null;
            void this.executePush();
          }, 3000);
        }
      }
    }
  }

  // Delete / Reset server store immediately on disk
  public async resetServerStore(userId: string): Promise<boolean> {
    try {
      if (this.currentUserId !== userId) this.setUserId(userId);
      this.pushGeneration += 1;
      this.pendingUserId = null;
      this.pendingPayload = null;
      if (this.syncTimer) {
        clearTimeout(this.syncTimer);
        this.syncTimer = null;
      }

      // Do not abort a POST for this user: the server may already be writing
      // it. Wait for that request to settle, then send DELETE as the final
      // operation so stale data cannot be written after the reset.
      const activePush = this.activePushCompletion;
      if (activePush) await activePush;
      this.pendingUserId = null;
      this.pendingPayload = null;

      this.setStatus('syncing');
      const res = await fetch(getApiUrl('/api/user/store'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(userId),
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
