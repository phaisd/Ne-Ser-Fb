'use client';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toast: ToastItem) => void;

const listeners = new Set<ToastListener>();

export const toast = {
  subscribe(fn: ToastListener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  show(item: Omit<ToastItem, 'id'>) {
    const fullToast: ToastItem = {
      ...item,
      id: `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      duration: item.duration ?? 4000,
    };
    listeners.forEach((fn) => fn(fullToast));
  },

  success(message: string, title?: string) {
    this.show({ type: 'success', message, title });
  },

  error(message: string, title?: string) {
    this.show({ type: 'error', message, title, duration: 6000 });
  },

  info(message: string, title?: string) {
    this.show({ type: 'info', message, title });
  },

  warning(message: string, title?: string) {
    this.show({ type: 'warning', message, title, duration: 5000 });
  },
};
