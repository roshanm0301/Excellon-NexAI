import type { ReactNode } from 'react'
import MuiDialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
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

const SIZE_MAP: Record<string, 'xs' | 'sm' | 'md'> = {
  sm: 'xs', md: 'sm', lg: 'md',
}

export function Modal({ open, onClose, title, children, footer, size = 'md', 'data-testid': dataTestId }: ModalProps) {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      maxWidth={SIZE_MAP[size]}
      fullWidth
      data-testid={dataTestId}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        {title}
        <IconButton size="small" onClick={onClose} aria-label="Close" sx={{ color: 'var(--fg-tertiary)' }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        {children}
      </DialogContent>
      {footer && (
        <DialogActions sx={{ gap: 1 }}>
          {footer}
        </DialogActions>
      )}
    </MuiDialog>
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

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', danger = false, loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
        {message}
      </p>
    </Modal>
  )
}
