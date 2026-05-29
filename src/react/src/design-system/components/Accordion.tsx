import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionRowProps {
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  dragHandle?: boolean
}

export function AccordionRow({ title, subtitle, right, children, defaultOpen = false, dragHandle = false }: AccordionRowProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', marginBottom: 8, background: 'var(--bg-primary)' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
          cursor: 'pointer', userSelect: 'none',
        }}
        onClick={() => setOpen(v => !v)}
      >
        {dragHandle && <DragHandle />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
        <ChevronDown
          size={16}
          style={{ color: 'var(--fg-tertiary)', transition: 'transform 180ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        />
      </div>
      {open && <div style={{ padding: '0 16px 16px' }}>{children}</div>}
    </div>
  )
}

export function DragHandle() {
  return (
    <svg width={16} height={20} viewBox="0 0 16 20" fill="var(--neutral-400)" style={{ cursor: 'grab', flexShrink: 0 }}>
      <circle cx={5} cy={6} r={1.5} /><circle cx={11} cy={6} r={1.5} />
      <circle cx={5} cy={10} r={1.5} /><circle cx={11} cy={10} r={1.5} />
      <circle cx={5} cy={14} r={1.5} /><circle cx={11} cy={14} r={1.5} />
    </svg>
  )
}
