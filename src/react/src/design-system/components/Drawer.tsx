import type { ReactNode } from 'react'
import MuiDrawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
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
  return (
    <MuiDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'var(--bg-primary)',
          },
        },
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid var(--border-secondary)', flexShrink: 0,
      }}>
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--fg-primary)' }}>
          {title}
        </h3>
        <IconButton size="small" onClick={onClose} aria-label="Close" sx={{ color: 'var(--fg-secondary)' }}>
          <X size={18} />
        </IconButton>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</div>
      {footer && (
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-secondary)',
          display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0,
        }}>
          {footer}
        </div>
      )}
    </MuiDrawer>
  )
}
