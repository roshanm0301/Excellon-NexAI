import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import MuiSnackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  variant: ToastVariant
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (variant: ToastVariant, title: string, message?: string) => void
  /** @deprecated use toast() or success/error/warning/info helpers */
  addToast: (variant: ToastVariant, title: string, message?: string) => void
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
    addToast: add,
    success: (title, msg) => add('success', title, msg),
    error:   (title, msg) => add('error',   title, msg),
    warning: (title, msg) => add('warning', title, msg),
    info:    (title, msg) => add('info',    title, msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((t, i) => (
        <MuiSnackbar
          key={t.id}
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          style={{ bottom: 24 + i * 80 }}
        >
          <MuiAlert
            severity={t.variant}
            onClose={() => remove(t.id)}
            variant="filled"
            elevation={4}
            sx={{ minWidth: 280, maxWidth: 360, fontSize: '0.8125rem', alignItems: 'flex-start' }}
          >
            <AlertTitle sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: t.message ? 0.25 : 0 }}>
              {t.title}
            </AlertTitle>
            {t.message && <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{t.message}</span>}
          </MuiAlert>
        </MuiSnackbar>
      ))}
    </ToastContext.Provider>
  )
}
