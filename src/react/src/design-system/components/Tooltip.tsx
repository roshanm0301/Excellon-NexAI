import { useState, type ReactNode, type CSSProperties } from 'react'

export interface TooltipProps {
  content: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const TOOLTIP_STYLE: CSSProperties = {
  position: 'absolute',
  background: 'var(--neutral-900)',
  color: 'var(--fg-on-brand)',
  borderRadius: 'var(--radius-sm)',
  boxShadow: 'var(--shadow-md)',
  padding: '4px 8px',
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  zIndex: 200,
  lineHeight: '1.4',
}

function getPlacementStyle(placement: TooltipProps['placement']): CSSProperties {
  switch (placement) {
    case 'bottom':
      return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 }
    case 'left':
      return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 }
    case 'right':
      return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 }
    case 'top':
    default:
      return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 }
  }
}

export function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{ ...TOOLTIP_STYLE, ...getPlacementStyle(placement) }}>
          {content}
        </div>
      )}
    </div>
  )
}
