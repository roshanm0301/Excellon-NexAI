import { useState, type ReactNode } from 'react'
import MuiMenu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MuiIconButton from '@mui/material/IconButton'

export interface ActionMenuItem {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export interface ActionMenuProps {
  items: ActionMenuItem[]
  trigger?: ReactNode
}

export function ActionMenu({ items, trigger }: ActionMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setAnchor(e.currentTarget)
  }

  const handleClose = () => setAnchor(null)

  return (
    <>
      <MuiIconButton
        size="small"
        onClick={handleOpen}
        aria-haspopup="true"
        aria-expanded={open}
        sx={{ color: 'var(--fg-tertiary)', '&:hover': { color: 'var(--fg-primary)' } }}
      >
        {trigger ?? (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
            <circle cx={12} cy={5} r={1.5} />
            <circle cx={12} cy={12} r={1.5} />
            <circle cx={12} cy={19} r={1.5} />
          </svg>
        )}
      </MuiIconButton>

      <MuiMenu
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 160,
              border: '1px solid var(--border-secondary)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '8px',
            },
          },
        }}
      >
        {items.map((item, i) => (
          <MenuItem
            key={i}
            disabled={item.disabled}
            onClick={e => {
              e.stopPropagation()
              if (!item.disabled) {
                item.onClick()
                handleClose()
              }
            }}
            sx={{
              fontSize: '0.8125rem',
              color: item.variant === 'danger' ? 'var(--error-600)' : 'var(--fg-primary)',
              fontFamily: 'var(--font-sans)',
              py: '7px',
              px: '14px',
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </MuiMenu>
    </>
  )
}
