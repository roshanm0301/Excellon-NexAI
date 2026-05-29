import { useState, useRef, useEffect, type ReactNode } from 'react'

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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="ex-icon-btn sm"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger ?? (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
            <circle cx={12} cy={5} r={1.5} />
            <circle cx={12} cy={12} r={1.5} />
            <circle cx={12} cy={19} r={1.5} />
          </svg>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          minWidth: 160,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-secondary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {items.map((item, i) => (
            <button
              key={i}
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation()
                if (!item.disabled) {
                  item.onClick()
                  setOpen(false)
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 14px',
                border: 'none',
                background: 'transparent',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                color: item.variant === 'danger' ? 'var(--error-600)' : 'var(--fg-primary)',
                opacity: item.disabled ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!item.disabled) (e.target as HTMLButtonElement).style.background = 'var(--bg-secondary)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
