import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  'data-testid'?: string
}

export function Modal({ open, onClose, title, children, footer, size = 'md', 'data-testid': dataTestId }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 400, md: 560, lg: 720 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="ex-scrim" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)' }} />
      <div data-testid={dataTestId} style={{
        position: 'relative', zIndex: 101, background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-3xl)',
        width: widths[size], maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
          <h4 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--fg-primary)' }}>{title}</h4>
          <button onClick={onClose} className="ex-icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>{children}</div>
        {footer && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-secondary)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', lineHeight: 'var(--lh-sm)' }}>{message}</p>
    </Modal>
  )
}
