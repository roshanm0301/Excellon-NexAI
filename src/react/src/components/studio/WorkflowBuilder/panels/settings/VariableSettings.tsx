import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface VariableSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const DATA_TYPES = [
  { value: 'String', label: 'String' },
  { value: 'Number', label: 'Number' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'Object', label: 'Object' },
  { value: 'Array', label: 'Array' },
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

export function VariableSettings({ step, onChange }: VariableSettingsProps) {
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
        <label style={labelStyle}>Variable name</label>
        <Input
          value={String(settings.variableName ?? '')}
          onChange={e => update({ variableName: e.target.value })}
          placeholder="counter"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Reference this variable as {'{$.variableName}'}</div>
      </div>

      <div>
        <label style={labelStyle}>Data type</label>
        <Select
          value={String(settings.dataType ?? 'String')}
          onChange={e => update({ dataType: e.target.value })}
          options={DATA_TYPES}
        />
      </div>

      <div>
        <label style={labelStyle}>Initial value</label>
        <Textarea
          value={String(settings.initialValue ?? '')}
          onChange={e => update({ initialValue: e.target.value })}
          placeholder='""'
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          The starting value. Use an expression or a literal. e.g. 0 for a counter, [] for an empty
          list.
        </div>
      </div>
    </div>
  )
}
