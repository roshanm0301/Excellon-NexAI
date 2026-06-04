// ============================================================================
// TOAST NOTIFICATION SYSTEM
// Non-intrusive feedback for user actions
// ============================================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import './Toast.scss';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
}

interface ToastContextValue {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
      }, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div className={`saas-toast saas-toast--${toast.type} ${exiting ? 'saas-toast--exiting' : ''}`}>
      <div className="saas-toast__icon">{ICONS[toast.type]}</div>
      <div className="saas-toast__content">
        <div className="saas-toast__title">{toast.title}</div>
        {toast.description && <div className="saas-toast__description">{toast.description}</div>}
      </div>
      {(toast.dismissible !== false) && (
        <button className="saas-toast__close" onClick={handleDismiss} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="saas-toast-container" role="alert" aria-live="polite">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
