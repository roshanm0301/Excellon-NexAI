import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

type BannerVariant = 'success' | 'error' | 'warning' | 'info'

interface BannerProps {
  variant?: BannerVariant
  /** Short bold heading. Omit when using children for custom content. */
  title?: string
  /** Secondary body text below the title. */
  message?: string
  /** Custom content — rendered instead of title/message when provided. */
  children?: ReactNode
  onClose?: () => void
  action?: ReactNode
}

const BANNER_CONFIG = {
  success: { icon: CheckCircle, bg: 'var(--success-50)', color: 'var(--success-700)', border: 'var(--success-500)' },
  error: { icon: AlertCircle, bg: 'var(--error-50)', color: 'var(--error-700)', border: 'var(--error-500)' },
  warning: { icon: AlertTriangle, bg: 'var(--warning-50)', color: 'var(--warning-700)', border: 'var(--warning-500)' },
  info: { icon: Info, bg: 'var(--info-50)', color: 'var(--info-700)', border: 'var(--info-500)' },
}

export function Banner({ variant = 'info', title, message, children, onClose, action }: BannerProps) {
  const cfg = BANNER_CONFIG[variant]
  const Icon = cfg.icon
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-lg)', padding: '12px 16px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <Icon size={18} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        {children ?? (
          <>
            {title && <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: cfg.color }}>{title}</div>}
            {message && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', marginTop: title ? 4 : 0 }}>{message}</div>}
          </>
        )}
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </div>
      {onClose && <button onClick={onClose} className="ex-icon-btn"><X size={14} /></button>}
    </div>
  )
}
