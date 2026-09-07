import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowDown, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 68; // pixels of pull required to trigger refresh
const MAX_PULL = 110;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    // 1. Never intercept when any modal, drawer, or dialog is active
    if (
      document.body.style.overflow === 'hidden' ||
      document.querySelector('[role="dialog"]') ||
      document.querySelector('.fixed.inset-0.z-50')
    ) {
      isPullingRef.current = false;
      return;
    }

    // 2. Never intercept if touch originates inside an inner scrollable element or form input
    const target = e.target as HTMLElement | null;
    if (target) {
      const scrollable = target.closest('.overflow-y-auto, .overflow-auto, .overflow-x-auto, [data-scrollable], [role="dialog"], form');
      if (scrollable && scrollable !== document.documentElement && scrollable !== document.body) {
        isPullingRef.current = false;
        return;
      }
    }

    // 3. Only allow pull-down if user is at the very top of page
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY <= 0 && !isRefreshing) {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return;

    // Safety: ignore if a modal opened in the meantime
    if (
      document.body.style.overflow === 'hidden' ||
      document.querySelector('[role="dialog"]') ||
      document.querySelector('.fixed.inset-0.z-50')
    ) {
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startXRef.current;
    const diffY = currentY - startYRef.current;

    // Disregard if gesture is primarily horizontal (lateral swipe)
    if (Math.abs(diffX) > Math.abs(diffY)) {
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }

    // Only handle pull down gestures past intentional threshold
    if (diffY > 12) {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY <= 0) {
        // Apply rubber-band damping (diminishing return)
        const damped = Math.min(MAX_PULL, Math.pow(diffY - 12, 0.82) * 1.8);
        setPullDistance(damped);

        // Prevent native overscroll when pulling down
        if (e.cancelable && damped > 15) {
          e.preventDefault();
        }
      }
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(52); // Keep indicator visible during refresh

      try {
        await onRefresh();
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsRefreshing(false);
          setPullDistance(0);
        }, 600);
      } catch (err) {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const rotation = isRefreshing ? 0 : progress * 180;

  return (
    <div className="relative w-full">
      {/* Pull Indicator Badge */}
      <div
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 ease-out"
        style={{
          transform: `translate(-50%, ${pullDistance > 0 || isRefreshing ? Math.min(pullDistance - 15, 55) : -60}px)`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 dark:bg-[#1E1E22]/95 backdrop-blur-md shadow-xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100">
          {isRefreshing ? (
            isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in" />
                <span className="text-emerald-500">Atualizado!</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />
                <span className="text-slate-600 dark:text-slate-300">Atualizando Finly...</span>
              </>
            )
          ) : (
            <>
              <ArrowDown
                className="w-4 h-4 text-purple-500 transition-transform duration-150"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              <span className="text-slate-600 dark:text-slate-300">
                {pullDistance >= PULL_THRESHOLD ? 'Solte para atualizar' : 'Puxe para atualizar'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content with soft vertical translation */}
      <div
        style={{
          transform: isRefreshing ? 'translateY(15px)' : pullDistance > 0 ? `translateY(${pullDistance * 0.25}px)` : 'none',
          transition: isPullingRef.current ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};
