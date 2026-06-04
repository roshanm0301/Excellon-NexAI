import { Textarea, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface SequenceSettingsProps {
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

export function SequenceSettings({ step, onChange }: SequenceSettingsProps) {
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
          placeholder="Describe what this sequence does..."
          rows={2}
        />
        <div style={helpStyle}>
          Optional description. The sequence&apos;s steps are shown on the canvas below.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Break on error</label>
        <Toggle
          checked={Boolean(settings.breakOnError ?? true)}
          onChange={checked => update({ breakOnError: checked })}
        />
        <div style={helpStyle}>When on, the sequence stops if any step fails.</div>
      </div>
    </div>
  )
}
