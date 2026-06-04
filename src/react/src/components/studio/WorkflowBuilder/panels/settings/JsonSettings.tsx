import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface JsonSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'parse', label: 'Parse string to object' },
  { value: 'stringify', label: 'Stringify object to string' },
  { value: 'pick', label: 'Pick specific fields' },
  { value: 'omit', label: 'Remove fields (omit)' },
  { value: 'merge', label: 'Merge two objects' },
  { value: 'clone', label: 'Deep clone' },
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

export function JsonSettings({ step, onChange }: JsonSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const operation = String(settings.operation ?? 'parse')
  const showFieldsInput = operation === 'pick' || operation === 'omit'
  const showSecondInput = operation === 'merge'

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

      <div>
        <label style={labelStyle}>Input</label>
        <Input
          value={String(settings.input ?? '')}
          onChange={e => update({ input: e.target.value })}
          placeholder="{$.body.jsonString}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
      </div>

      {showFieldsInput && (
        <div>
          <label style={labelStyle}>Fields</label>
          <Textarea
            value={String(settings.fields ?? '')}
            onChange={e => update({ fields: e.target.value })}
            placeholder={'id\nname\nstatus'}
            rows={4}
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>One field name per line</div>
        </div>
      )}

      {showSecondInput && (
        <div>
          <label style={labelStyle}>Second object</label>
          <Input
            value={String(settings.secondInput ?? '')}
            onChange={e => update({ secondInput: e.target.value })}
            placeholder="{$.otherStep.data}"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="parsed"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
      </div>
    </div>
  )
}
