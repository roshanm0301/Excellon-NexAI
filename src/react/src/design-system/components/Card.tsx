import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: number | string
}

export function Card({ children, padding = 24, style, ...props }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-secondary)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xs)',
        padding,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
