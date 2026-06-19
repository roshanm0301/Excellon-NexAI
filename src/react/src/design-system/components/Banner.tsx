import type { ReactNode } from 'react'
import MuiAlert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

type BannerVariant = 'success' | 'error' | 'warning' | 'info'

interface BannerProps {
  variant?: BannerVariant
  title?: string
  message?: string
  children?: ReactNode
  onClose?: () => void
  action?: ReactNode
}

export function Banner({ variant = 'info', title, message, children, onClose, action }: BannerProps) {
  return (
    <MuiAlert
      severity={variant}
      onClose={onClose}
      sx={{
        borderRadius: 2,
        fontSize: '0.8125rem',
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      {children ?? (
        <>
          {title && <AlertTitle sx={{ fontWeight: 600, fontSize: '0.8125rem', mb: message ? 0.5 : 0 }}>{title}</AlertTitle>}
          {message && <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)' }}>{message}</span>}
        </>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </MuiAlert>
  )
}
