import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
}

export function Select({ label, hint, error, options, placeholder, id, ...props }: SelectProps) {
  const selectId = id ?? `select-${Math.random().toString(36).slice(2)}`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && <label htmlFor={selectId} className="label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <select
          id={selectId}
          style={{
            width: '100%', height: 40, padding: '0 36px 0 12px',
            border: `1px solid ${error ? 'var(--border-error)' : 'var(--border-primary)'}`,
            borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
            color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)', appearance: 'none', outline: 'none',
            cursor: 'pointer', boxSizing: 'border-box',
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--fg-tertiary)', pointerEvents: 'none',
          }}
        />
      </div>
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error-600)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>{hint}</span>}
    </div>
  )
}
