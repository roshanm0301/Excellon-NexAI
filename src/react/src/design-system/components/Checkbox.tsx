interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  indeterminate?: boolean
}

export function Checkbox({ checked, onChange, label, disabled, indeterminate }: CheckboxProps) {
  return (
    <label className="ex-check" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        ref={el => { if (el) el.indeterminate = !!indeterminate }}
        style={{ display: 'none' }}
      />
      <span style={{
        width: 18, height: 18,
        border: `1px solid ${checked || indeterminate ? 'var(--brand-500)' : 'var(--border-primary)'}`,
        background: checked || indeterminate ? 'var(--brand-500)' : 'var(--bg-primary)',
        borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, opacity: disabled ? 0.5 : 1,
      }}>
        {checked && <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>}
        {indeterminate && !checked && <svg width={10} height={2} viewBox="0 0 10 2"><rect width={10} height={2} rx={1} fill="white" /></svg>}
      </span>
      {label && <span className="label" style={{ color: disabled ? 'var(--fg-disabled)' : 'var(--fg-primary)' }}>{label}</span>}
    </label>
  )
}
