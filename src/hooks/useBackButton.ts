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

  useEffect(() => {
    if (!isOpen) return;

    // 1. Native Capacitor Android handler
    const unregister = registerBackHandler(() => {
      onBackRef.current();
      return true;
    }, priority);

    // 2. Web / PWA browser back-gesture fallback
    if (!isNativeAndroid() && typeof window !== 'undefined') {
      const modalStateId = `modal_${Date.now()}`;
      window.history.pushState({ modalStateId }, '');
      historyPushedRef.current = true;

      const handlePopState = (e: PopStateEvent) => {
        if (historyPushedRef.current) {
          historyPushedRef.current = false;
          onBackRef.current();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        unregister();
        window.removeEventListener('popstate', handlePopState);
        // If modal was closed programmatically (e.g. X button or save), revert the history entry
        if (historyPushedRef.current) {
          historyPushedRef.current = false;
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
