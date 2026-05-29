import { NumberInput, Toggle } from '../../../design-system'

export interface RetentionConfig {
  pipelineMode?: 'SIMPLE' | 'ARCHIVE' | 'GDPR'
  retentionDays?: number
  legalHold?: boolean
}

interface RetentionPanelProps {
  value: RetentionConfig
  onChange: (v: RetentionConfig) => void
}

interface StageInfo {
  label: string
  days: string
}

function getStages(mode: 'SIMPLE' | 'ARCHIVE' | 'GDPR', retentionDays: number): StageInfo[] {
  if (mode === 'SIMPLE') {
    return [
      { label: 'Recycle Bin', days: '0d' },
      { label: 'Pending Purge', days: `${retentionDays}d` },
      { label: 'Hard Delete', days: `${retentionDays + 30}d` },
    ]
  }
  if (mode === 'ARCHIVE') {
    return [
      { label: 'Recycle Bin', days: '0d' },
      { label: 'Archived', days: `${retentionDays}d (1×)` },
      { label: 'Pending Purge', days: `${retentionDays * 2}d (2×)` },
      { label: 'Hard Delete', days: `${retentionDays * 3}d (3×)` },
    ]
  }
  // GDPR
  return [
    { label: 'Recycle Bin', days: '0d' },
    { label: 'Archived', days: `${retentionDays}d (1×)` },
    { label: 'Anonymised', days: `${retentionDays * 2}d (2×)` },
    { label: 'Pending Purge', days: `${retentionDays * 3}d (3×)` },
    { label: 'Hard Delete', days: `${retentionDays * 4}d (4×)` },
  ]
}

export function RetentionPanel({ value, onChange }: RetentionPanelProps) {
  const mode = value.pipelineMode ?? 'SIMPLE'
  const retentionDays = value.retentionDays ?? 365
  const stages = getStages(mode, retentionDays)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Pipeline mode */}
      <fieldset style={{ border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
        <legend style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-tertiary)', padding: '0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pipeline Mode
        </legend>
        <div style={{ display: 'flex', gap: 20 }}>
          {(['SIMPLE', 'ARCHIVE', 'GDPR'] as const).map(m => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>
              <input
                type="radio"
                name="pipeline-mode"
                value={m}
                checked={mode === m}
                onChange={() => onChange({ ...value, pipelineMode: m })}
              />
              {m}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Settings */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
        <div style={{ width: 200 }}>
          <NumberInput
            label="Retention Days"
            value={retentionDays}
            onChange={v => onChange({ ...value, retentionDays: typeof v === 'number' ? v : 365 })}
            min={1}
          />
        </div>
        <div style={{ paddingBottom: 4 }}>
          <Toggle
            label="Legal Hold"
            checked={value.legalHold ?? false}
            onChange={legalHold => onChange({ ...value, legalHold })}
          />
        </div>
      </div>

      {/* Visual pipeline */}
      <div>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Pipeline Diagram
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          {stages.map((stage, i) => (
            <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid var(--brand-500)`,
                background: 'var(--brand-50)',
                textAlign: 'center',
                minWidth: 100,
              }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand-700)' }}>
                  {stage.label}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-500)', marginTop: 2 }}>
                  {stage.days}
                </div>
              </div>
              {i < stages.length - 1 && (
                <span style={{ color: 'var(--fg-tertiary)', fontSize: 18, lineHeight: 1 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
