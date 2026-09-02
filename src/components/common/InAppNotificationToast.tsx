import React, { useState, useEffect } from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';

interface InAppToast {
  id: string;
  title: string;
  body: string;
  tag?: string;
}

export const InAppNotificationToast: React.FC = () => {
  const [toast, setToast] = useState<InAppToast | null>(null);

  useEffect(() => {
    const handleNotification = (e: any) => {
      const detail = e.detail;
      if (!detail || !detail.title) return;

      const newToast: InAppToast = {
        id: String(Date.now()),
        title: detail.title,
        body: detail.body,
        tag: detail.tag,
      };

      setToast(newToast);

      // Auto dismiss after 5.5 seconds
      const timer = setTimeout(() => {
        setToast(current => (current?.id === newToast.id ? null : current));
      }, 5500);

      return () => clearTimeout(timer);
    };

    window.addEventListener('finly_in_app_notification', handleNotification);
    return () => window.removeEventListener('finly_in_app_notification', handleNotification);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-3 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-top-3 duration-300 pointer-events-auto">
      <div className="relative p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white shadow-2xl border border-purple-500/40 backdrop-blur-xl flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 text-purple-300 mt-0.5">
          <Bell className="w-5 h-5 text-purple-400 animate-bounce" />
        </div>

        <div className="flex-1 pr-6 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
              Notificação Finly
            </span>
          </div>

          <h4 className="text-xs font-black text-white mt-1 leading-tight truncate">
            {toast.title}
          </h4>

          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug break-words">
            {toast.body}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setToast(null)}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
