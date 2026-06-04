import { Input, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface MathSettingsProps {
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

export function MathSettings({ step, onChange }: MathSettingsProps) {
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
        <label style={labelStyle}>Expression</label>
        <Textarea
          value={String(settings.expression ?? '')}
          onChange={e => update({ expression: e.target.value })}
          placeholder="$.price * (1 + $.taxRate / 100)"
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>JSONata math expression. Use standard operators: + - * / %</div>
      </div>

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="totalPrice"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
      </div>
    </div>
  )
}
