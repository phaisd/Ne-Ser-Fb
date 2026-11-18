'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { toast, ToastItem, ToastType } from '@/lib/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          wrapper: 'bg-emerald-50 border-emerald-300 text-emerald-950',
          title: 'text-emerald-900',
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          wrapper: 'bg-rose-50 border-rose-300 text-rose-950',
          title: 'text-rose-900',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          wrapper: 'bg-amber-50 border-amber-300 text-amber-950',
          title: 'text-amber-900',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
          wrapper: 'bg-sky-50 border-sky-300 text-sky-950',
          title: 'text-sky-900',
        };
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => {
        const styles = getToastStyles(item.type);
        return (
          <div
            key={item.id}
            role={item.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg backdrop-blur-xs transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${styles.wrapper}`}
          >
            {styles.icon}
            <div className="flex-1 text-xs">
              {item.title && (
                <div className={`font-bold mb-0.5 ${styles.title}`}>{item.title}</div>
              )}
              <div className="font-medium leading-relaxed break-words">{item.message}</div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 transition cursor-pointer"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
