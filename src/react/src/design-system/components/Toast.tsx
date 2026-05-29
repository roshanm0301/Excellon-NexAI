import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  variant: ToastVariant
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (variant: ToastVariant, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts(ts => ts.filter(t => t.id !== id))
  }, [])

  const add = useCallback((variant: ToastVariant, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(ts => [...ts, { id, variant, title, message }])
    setTimeout(() => remove(id), 5000)
  }, [remove])

  const value: ToastContextValue = {
    toast: add,
    success: (title, msg) => add('success', title, msg),
    error: (title, msg) => add('error', title, msg),
    warning: (title, msg) => add('warning', title, msg),
    info: (title, msg) => add('info', title, msg),
  }

  const icons = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info }
  const colors = {
    success: 'var(--success-500)', error: 'var(--error-500)',
    warning: 'var(--warning-500)', info: 'var(--info-500)',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
        {toasts.map(t => {
          const Icon = icons[t.variant]
          return (
            <div key={t.id} style={{
              background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)',
              borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
              padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
              animation: 'slideInRight 150ms ease-out',
            }}>
              <style>{`@keyframes slideInRight { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }`}</style>
              <Icon size={18} style={{ color: colors[t.variant], flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>{t.title}</div>
                {t.message && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', marginTop: 2 }}>{t.message}</div>}
              </div>
              <button onClick={() => remove(t.id)} className="ex-icon-btn" style={{ marginTop: -2 }}>
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
