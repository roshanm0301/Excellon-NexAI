import type { ReactNode, HTMLAttributes } from 'react'
import MuiPaper from '@mui/material/Paper'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: number | string
}

export function Card({ children, padding = 24, style, ...props }: CardProps) {
  return (
    <MuiPaper
      elevation={0}
      sx={{
        bgcolor: 'var(--bg-primary)',
        border: '1px solid var(--border-secondary)',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-xs)',
        p: typeof padding === 'number' ? `${padding}px` : padding,
      }}
      style={style}
      {...(props as object)}
    >
      {children}
    </MuiPaper>
  )
}
