import { Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface TransactionSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

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

export function TransactionSettings({ step, onChange }: TransactionSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Description</label>
        <Textarea
          value={String(settings.description ?? '')}
          onChange={e => update({ description: e.target.value })}
          placeholder="Describe what this transaction does..."
          rows={2}
        />
        <div style={helpStyle}>
          All steps inside run as a unit. If any step fails, the rollback steps run automatically.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Isolation level</label>
        <Select
          value={String(settings.isolationLevel ?? 'Default')}
          onChange={e => update({ isolationLevel: e.target.value })}
          options={[
            { value: 'Default', label: 'Default' },
            { value: 'Read committed', label: 'Read committed' },
            { value: 'Serializable', label: 'Serializable' },
          ]}
        />
      </div>
    </div>
  )
}
