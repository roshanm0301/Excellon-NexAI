interface ProgressBarProps {
  value: number
  max?: number
  color?: string
}

export function ProgressBar({ value, max = 100, color = 'var(--brand-500)' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ height: 6, background: 'var(--neutral-100)', borderRadius: 9999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 9999, transition: 'width 200ms' }} />
    </div>
  )
}

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      {steps.map((step, i) => (
        <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600,
            background: i < current ? 'var(--brand-500)' : i === current ? 'var(--brand-50)' : 'var(--neutral-100)',
            color: i <= current ? (i < current ? 'white' : 'var(--brand-700)') : 'var(--fg-tertiary)',
            border: `2px solid ${i < current ? 'var(--brand-500)' : i === current ? 'var(--brand-500)' : 'var(--border-secondary)'}`,
          }}>
            {i + 1}
          </div>
          <div style={{ fontSize: 11, color: i <= current ? 'var(--fg-primary)' : 'var(--fg-tertiary)', textAlign: 'center' }}>{step}</div>
        </div>
      ))}
    </div>
  )
}
