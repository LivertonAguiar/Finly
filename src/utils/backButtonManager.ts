/**
 * Finly Native Android & Mobile Back Button Manager
 * 
 * Handles Android hardware back button and edge-swipe gestures using @capacitor/app.
 * Supports a stack-based priority system so nested modals, bottom sheets,
 * and drawers close in proper LIFO (Last-In-First-Out) sequence.
 */

import { App as CapacitorApp } from '@capacitor/app';

export type BackHandler = () => void | boolean | Promise<void | boolean>;

interface RegisteredHandler {
  id: string;
  handler: BackHandler;
  priority: number;
}

const handlers: RegisteredHandler[] = [];
let isInitialized = false;
let rootBackHandler: (() => boolean) | null = null;
let lastBackPressTime = 0;
let exitToastTimeout: any = null;

export const isNativeAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

/**
 * Registers a back button handler (e.g. for closing a modal or drawer).
 * Higher priority runs first. Default priority is 10.
 * Returns an unregister function.
 */
export const registerBackHandler = (
  handler: BackHandler,
  priority: number = 10
): (() => void) => {
  const id = `back_h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  handlers.push({ id, handler, priority });
  // Keep sorted descending by priority
  handlers.sort((a, b) => b.priority - a.priority);

  initBackButtonListener();

  return () => {
    const idx = handlers.findIndex(h => h.id === id);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
  };
};

/**
 * Sets the fallback handler when no modal/drawer is open
 * (e.g. navigate back to Dashboard or exit app).
 */
export const setRootBackHandler = (handler: (() => boolean) | null) => {
  rootBackHandler = handler;
  initBackButtonListener();
};

/**
 * Executes the topmost active back handler.
 * Returns true if an action was handled, false otherwise.
 */
export const executeBackAction = (): boolean => {
  if (handlers.length > 0) {
    const top = handlers.shift();
    if (top) {
      try {
        const result = top.handler();
        // If handler explicitly returned false, it didn't consume the event
        if (result === false) {
          return executeBackAction();
        }
        return true;
      } catch (err) {
        console.error('Error executing back handler:', err);
        return true;
      }
    }
  }

  if (rootBackHandler) {
    return rootBackHandler();
  }

  return false;
};

/**
 * Displays a non-intrusive Android toast for exit confirmation
 */
const showExitPromptToast = () => {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('finly-exit-toast');
  if (existing) existing.remove();
  if (exitToastTimeout) clearTimeout(exitToastTimeout);

  const toast = document.createElement('div');
  toast.id = 'finly-exit-toast';
  toast.innerText = 'Pressione voltar novamente para sair do Finly';
  toast.style.position = 'fixed';
  toast.style.bottom = '80px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(17, 24, 39, 0.92)';
  toast.style.color = '#FFFFFF';
  toast.style.padding = '10px 18px';
  toast.style.borderRadius = '9999px';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '600';
  toast.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
  toast.style.zIndex = '999999';
  toast.style.pointerEvents = 'none';
  toast.style.transition = 'opacity 0.25s ease';
  toast.style.backdropFilter = 'blur(6px)';
  toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';

  document.body.appendChild(toast);

  exitToastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 2200);
};

/**
 * Initializes the Capacitor App backButton native listener
 */
export const initBackButtonListener = () => {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  if (isNativeAndroid()) {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const handled = executeBackAction();
      
      if (!handled) {
        // We are on the root screen with no modals open
        const now = Date.now();
        if (now - lastBackPressTime < 2400) {
          // Double-press within 2.4s -> exit app cleanly
          CapacitorApp.exitApp();
        } else {
          lastBackPressTime = now;
          showExitPromptToast();
        }
      }
    }).catch(err => {
      console.warn('Could not attach native backButton listener:', err);
    });
  }
};
