import { useState, useRef, useEffect } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
}

export interface MultiSelectProps {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  error?: string
  hint?: string
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  error,
  hint,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useRef(`ms-${Math.random().toString(36).slice(2)}`).current

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter(x => x !== v))
    } else {
      onChange([...value, v])
    }
  }

  const removeChip = (v: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(x => x !== v))
  }

  const selectedLabels = options.filter(o => value.includes(o.value))

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-secondary)' }}
        >
          {label}
        </label>
      )}

      {/* Selected chips */}
      {selectedLabels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {selectedLabels.map(opt => (
            <span
              key={opt.value}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                background: 'var(--brand-50)',
                border: '1px solid var(--brand-200)',
                borderRadius: '9999px',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--brand-700)',
              }}
            >
              {opt.label}
              <button
                onClick={(e) => removeChip(opt.value, e)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--brand-500)',
                  lineHeight: 1,
                }}
                aria-label={`Remove ${opt.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <div style={{ position: 'relative' }}>
        <button
          id={id}
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%',
            height: 40,
            padding: '0 36px 0 12px',
            border: `1px solid ${error ? 'var(--border-error)' : 'var(--border-primary)'}`,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-primary)',
            color: value.length > 0 ? 'var(--fg-primary)' : 'var(--fg-quaternary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value.length > 0
              ? `${value.length} selected`
              : placeholder}
          </span>
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            style={{
              flexShrink: 0,
              color: 'var(--fg-tertiary)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 150ms',
            }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-secondary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {options.length === 0 ? (
              <div style={{ padding: '8px 14px', fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)' }}>
                No options
              </div>
            ) : (
              options.map(opt => {
                const checked = value.includes(opt.value)
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--fg-primary)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <label className="ex-check" style={{ pointerEvents: 'none' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(opt.value)}
                      />
                      <span />
                    </label>
                    {opt.label}
                  </label>
                )
              })
            )}
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error-600)' }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>{hint}</span>
      )}
    </div>
  )
}
