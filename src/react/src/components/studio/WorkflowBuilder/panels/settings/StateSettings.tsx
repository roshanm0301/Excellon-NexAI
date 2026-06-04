import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface StateSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'Read value', label: 'Read value' },
  { value: 'Write value', label: 'Write value' },
  { value: 'Delete key', label: 'Delete key' },
  { value: 'Clear all state', label: 'Clear all state' },
]

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: 4,
}

const helpStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: 'var(--color-text-muted)',
  marginTop: 2,
  marginBottom: 10,
}

export function StateSettings({ step, onChange }: StateSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const operation = String(settings.operation ?? 'Read value')
  const showKey = operation !== 'Clear all state'
  const showValue = operation === 'Write value'
  const showDefault = operation === 'Read value'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Operation</label>
        <Select
          value={operation}
          onChange={e => update({ operation: e.target.value })}
          options={OPERATIONS}
        />
      </div>

      {showKey && (
        <div>
          <label style={labelStyle}>Key</label>
          <Input
            value={String(settings.key ?? '')}
            onChange={e => update({ key: e.target.value })}
            placeholder="approvalStatus"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>The state bag key to read or write.</div>
        </div>
      )}

      {showValue && (
        <div>
          <label style={labelStyle}>Value</label>
          <Textarea
            value={String(settings.value ?? '')}
            onChange={e => update({ value: e.target.value })}
            placeholder="{$.approval.data.status}"
            rows={2}
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>The value to store.</div>
        </div>
      )}

      {showDefault && (
        <div>
          <label style={labelStyle}>Default value</label>
          <Input
            value={String(settings.defaultValue ?? '')}
            onChange={e => update({ defaultValue: e.target.value })}
            placeholder="null"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>Returned when key doesn&apos;t exist.</div>
        </div>
      )}
    </div>
  )
}
