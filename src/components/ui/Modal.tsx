import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useBackButton } from '../../hooks/useBackButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  bodyClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  bodyClassName = '',
}) => {
  // Intercept Android hardware back button and edge swipe gestures
  useBackButton(isOpen, onClose);

  const mountTimeRef = React.useRef<number>(Date.now());
  const isBackdropPointerDownRef = React.useRef<boolean>(false);
  const modalContainerRef = React.useRef<HTMLDivElement>(null);
  const modalBodyRef = React.useRef<HTMLDivElement>(null);

  const [isKeyboardActive, setIsKeyboardActive] = React.useState(false);
  const [viewportStyle, setViewportStyle] = React.useState<{
    height?: string;
    top?: string;
    maxHeight?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      mountTimeRef.current = Date.now();
      isBackdropPointerDownRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Monitor virtual keyboard and visual viewport adjustments
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const updateViewport = () => {
      if (!isMounted) return;
      const vv = window.visualViewport;
      if (vv) {
        // Height reduction threshold indicates active soft keyboard
        const heightDiff = window.innerHeight - vv.height;
        const isKb = heightDiff > 120;
        setIsKeyboardActive(isKb);

        setViewportStyle({
          height: `${vv.height}px`,
          top: `${vv.offsetTop}px`,
          maxHeight: `${vv.height}px`,
        });
      } else {
        setIsKeyboardActive(false);
        setViewportStyle({});
      }
    };

    updateViewport();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateViewport);
      vv.addEventListener('scroll', updateViewport);
    }

    // Native Capacitor Keyboard plugin listeners
    let showHandle: { remove: () => void } | null = null;
    let hideHandle: { remove: () => void } | null = null;

    import('@capacitor/keyboard')
      .then(({ Keyboard }) => {
        if (!isMounted) return;
        Keyboard.addListener('keyboardWillShow', () => {
          if (!isMounted) return;
          setIsKeyboardActive(true);
          updateViewport();
        }).then((h) => {
          showHandle = h;
        });

        Keyboard.addListener('keyboardWillHide', () => {
          if (!isMounted) return;
          setIsKeyboardActive(false);
          updateViewport();
        }).then((h) => {
          hideHandle = h;
        });
      })
      .catch(() => {
        // In browser / PWA visualViewport is the standard handler
      });

    return () => {
      isMounted = false;
      if (vv) {
        vv.removeEventListener('resize', updateViewport);
        vv.removeEventListener('scroll', updateViewport);
      }
      if (showHandle?.remove) showHandle.remove();
      if (hideHandle?.remove) hideHandle.remove();
    };
  }, [isOpen]);

  // Smooth auto-scroll to focused form controls (inputs, textareas, selects)
  useEffect(() => {
    if (!isOpen) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        const scrollToElement = () => {
          if (!target || !target.isConnected) return;
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        };

        requestAnimationFrame(scrollToElement);
        setTimeout(scrollToElement, 150);
        setTimeout(scrollToElement, 350);
      }
    };

    const container = modalContainerRef.current;
    if (container) {
      container.addEventListener('focusin', handleFocusIn);
    }

    return () => {
      if (container) {
        container.removeEventListener('focusin', handleFocusIn);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    isBackdropPointerDownRef.current = (e.target === e.currentTarget);
  };

  const handleBackdropTouchStart = (e: React.TouchEvent) => {
    isBackdropPointerDownRef.current = (e.target === e.currentTarget);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 1. Strict target check: must be directly on the outer backdrop container
    if (e.target !== e.currentTarget) return;

    // 2. Ghost tap suppression: ignore click if modal opened less than 350ms ago
    if (Date.now() - mountTimeRef.current < 350) return;

    // 3. Pointer-down origin check: ensure the interaction actually started on the backdrop
    if (!isBackdropPointerDownRef.current) return;

    onClose();
  };

  return (
    <div
      onMouseDown={handleBackdropMouseDown}
      onTouchStart={handleBackdropTouchStart}
      onClick={handleBackdropClick}
      className={`fixed inset-x-0 z-[100] flex justify-center p-3 sm:p-4 bg-black/70 animate-in fade-in duration-200 cursor-pointer ${
        isKeyboardActive ? 'items-start pt-2 sm:pt-3' : 'items-center'
      }`}
      style={{
        top: viewportStyle.top || '0px',
        height: viewportStyle.height || '100dvh',
        maxHeight: viewportStyle.maxHeight || '100dvh',
        paddingTop: isKeyboardActive
          ? '8px'
          : 'max(12px, env(safe-area-inset-top, 12px), var(--safe-area-inset-top, 12px))',
        paddingBottom: isKeyboardActive
          ? '8px'
          : 'max(16px, env(safe-area-inset-bottom, 16px), var(--safe-area-inset-bottom, 16px))',
        paddingLeft: 'max(12px, env(safe-area-inset-left, 12px), var(--safe-area-inset-left, 12px))',
        paddingRight: 'max(12px, env(safe-area-inset-right, 12px), var(--safe-area-inset-right, 12px))',
      }}
    >
      {/* Centered / Keyboard-Aware Modal Card */}
      <div
        ref={modalContainerRef}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={`w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 rounded-[24px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white cursor-default will-change-transform ${
          isKeyboardActive ? 'max-h-[calc(100%-8px)]' : 'max-h-[88dvh]'
        }`}
      >

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white truncate pr-2">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content with Hardware-Accelerated Momentum Scrolling */}
        <div
          ref={modalBodyRef}
          className={`overflow-y-auto overscroll-y-contain flex-1 touch-pan-y ${
            bodyClassName || 'p-4 sm:p-6 pb-6'
          } ${isKeyboardActive ? 'pb-20' : ''}`}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {children}
        </div>

        {/* Sticky Fixed Footer (Solid background for maximum GPU scroll performance) */}
        {footer && (
          <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#18181B]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
