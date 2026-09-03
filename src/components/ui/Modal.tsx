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

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 animate-in fade-in duration-200 cursor-pointer"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        paddingLeft: 'max(12px, env(safe-area-inset-left, 12px))',
        paddingRight: 'max(12px, env(safe-area-inset-right, 12px))',
      }}
    >
      {/* Centered Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 rounded-[24px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white cursor-default will-change-transform`}
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
          className={`overflow-y-auto overscroll-y-contain flex-1 touch-pan-y ${bodyClassName || 'p-4 sm:p-6 pb-6'}`}
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
