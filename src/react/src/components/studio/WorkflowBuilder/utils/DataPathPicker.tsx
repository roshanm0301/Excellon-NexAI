/**
 * DataPathPicker — a button that opens a dropdown of available upstream
 * step output paths. Clicking an option inserts/appends the path into the
 * controlling input field.
 */
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { WorkflowStep } from '../../../../types/workflowBuilder'

interface DataPathPickerProps {
  /** Called with the chosen path string when user selects an option */
  onSelect: (path: string) => void
  /** Upstream steps available as data sources */
  upstreamSteps: WorkflowStep[]
}

const BUILTIN_PATHS = [
  { label: 'Request body field', path: '{$.body.fieldName}', group: 'Request' },
  { label: 'URL query parameter', path: '{$.query.paramName}', group: 'Request' },
  { label: 'Logged-in user ID', path: '{$.auth.userid}', group: 'Auth' },
  { label: 'Tenant ID', path: '{$.auth.tenantId}', group: 'Auth' },
  { label: 'Current timestamp', path: '{$.const.now}', group: 'Constants' },
  { label: 'True', path: '{$.const.true}', group: 'Constants' },
  { label: 'False', path: '{$.const.false}', group: 'Constants' },
]

export function DataPathPicker({ onSelect, upstreamSteps }: DataPathPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const stepOptions = upstreamSteps
    .filter(s => s.type !== 'start' && s.type !== 'end')
    .map(s => ({
      label: s.name || s.id,
      path: `{$.${s.id}.data}`,
      group: 'Previous steps',
    }))

  const allOptions = [...stepOptions, ...BUILTIN_PATHS]

  // Group them
  const groups: Record<string, typeof allOptions> = {}
  for (const opt of allOptions) {
    if (!groups[opt.group]) groups[opt.group] = []
    groups[opt.group].push(opt)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          padding: '3px 7px',
          background: 'var(--brand-50, #eff6ff)',
          border: '1px solid var(--brand-200, #bfdbfe)',
          borderRadius: 5,
          cursor: 'pointer',
          fontSize: '0.6875rem',
          color: 'var(--brand-600, #2563eb)',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        title="Insert data from a previous step"
      >
        Insert
        <ChevronDown size={10} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 100,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            minWidth: 220,
            maxHeight: 300,
            overflowY: 'auto',
            marginTop: 4,
          }}
        >
          {Object.entries(groups).map(([group, opts]) => (
            <div key={group}>
              <div
                style={{
                  padding: '5px 10px 2px',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {group}
              </div>
              {opts.map(opt => (
                <button
                  key={opt.path}
                  type="button"
                  onClick={() => {
                    onSelect(opt.path)
                    setOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                    padding: '5px 10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: 1 }}>
                    {opt.path}
                  </span>
                </button>
              ))}
            </div>
          ))}

          {allOptions.length === 0 && (
            <div style={{ padding: '12px 10px', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              No previous steps available
            </div>
          )}
        </div>
      )}
    </div>
  )
}
