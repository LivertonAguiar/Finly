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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Modal / Bottom Sheet Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-[#18181B] border-t sm:border border-slate-200/80 dark:border-slate-800/80 rounded-t-[28px] sm:rounded-[25px] shadow-2xl overflow-hidden flex flex-col h-[90dvh] sm:h-auto sm:max-h-[88dvh] max-h-[94dvh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250 text-slate-900 dark:text-white cursor-default`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

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

        {/* Modal Content with Smooth Momentum Scrolling */}
        <div className={`overflow-y-auto overscroll-contain flex-1 ${bodyClassName || 'p-4 sm:p-6 pb-6'}`}>
          {children}
        </div>

        {/* Sticky Fixed Footer (if provided) */}
        {footer && (
          <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
