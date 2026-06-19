import type { ReactNode } from 'react'
import MuiTooltip from '@mui/material/Tooltip'

export interface TooltipProps {
  content: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  return (
    <MuiTooltip title={content} placement={placement} arrow>
      {/* MUI Tooltip requires a single DOM-forwardable child */}
      <span style={{ display: 'inline-flex' }}>{children}</span>
    </MuiTooltip>
  )
}
