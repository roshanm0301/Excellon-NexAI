import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export function Drawer({ open, onClose, title, children, footer, width = 480 }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="ex-scrim" onClick={onClose} />
      <aside className="ex-detail" style={{ width }}>
        <header>
          <div>
            <h3 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h3>
          </div>
          <button className="ex-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="ex-detail-body">{children}</div>
        {footer && <footer style={{ padding: '16px 24px', borderTop: '1px solid var(--border-secondary)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>{footer}</footer>}
      </aside>
    </>
  )
}
