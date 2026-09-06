import { useEffect, useRef } from 'react';
import { registerBackHandler, isNativeAndroid } from '../utils/backButtonManager';

/**
 * Hook to intercept Android hardware back button & swipe gestures
 * when a modal, drawer, or bottom sheet is open.
 * 
 * Works seamlessly in both:
 * 1. Capacitor Native Android (via @capacitor/app listener)
 * 2. Mobile Chrome/Safari PWA (via history.pushState & popstate fallback)
 */
export const useBackButton = (
  isOpen: boolean,
  onBack: () => void,
  priority: number = 10
) => {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const historyPushedRef = useRef(false);
  const isRevertingRef = useRef(false);
  const modalStateIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Native Capacitor Android handler (primary for mobile app)
    const unregister = registerBackHandler(() => {
      onBackRef.current();
      return true;
    }, priority);

    // 2. Web / PWA browser back-gesture fallback
    // Only push history state on touch devices (mobile web/PWA) where back gestures are used
    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    if (!isNativeAndroid() && isTouchDevice && typeof window !== 'undefined') {
      const modalStateId = `modal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      modalStateIdRef.current = modalStateId;
      window.history.pushState({ modalStateId }, '');
      historyPushedRef.current = true;
      isRevertingRef.current = false;
      const mountTimestamp = Date.now();

      const handlePopState = (e: PopStateEvent) => {
        // If we are programmatically reverting history during unmount, ignore this popstate
        if (isRevertingRef.current) {
          isRevertingRef.current = false;
          return;
        }

        // Ignore popstate events that fire prematurely (e.g. React StrictMode or event race)
        if (Date.now() - mountTimestamp < 300) {
          return;
        }

        if (historyPushedRef.current) {
          historyPushedRef.current = false;
          onBackRef.current();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        unregister();
        window.removeEventListener('popstate', handlePopState);
        // If modal was closed programmatically, revert the history entry safely
        if (historyPushedRef.current) {
          historyPushedRef.current = false;
          isRevertingRef.current = true;
          if (window.history.state?.modalStateId === modalStateId) {
            window.history.back();
          }
        }
      };
    }

    return () => {
      unregister();
    };
  }, [isOpen, priority]);
};
