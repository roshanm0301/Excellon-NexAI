import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface DateSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'format', label: 'Format date' },
  { value: 'add', label: 'Add/subtract time' },
  { value: 'now', label: 'Get current time' },
  { value: 'timezone', label: 'Convert timezone' },
  { value: 'diff', label: 'Calculate difference' },
]

const UNITS = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
]

const DIRECTIONS = [
  { value: 'add', label: 'Add' },
  { value: 'subtract', label: 'Subtract' },
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

export function DateSettings({ step, onChange }: DateSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'format')

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
        <label style={labelStyle}>Operation</label>
        <Select
          value={operation}
          onChange={e => update({ operation: e.target.value })}
          options={OPERATIONS}
        />
      </div>

      {operation !== 'now' && (
        <div>
          <label style={labelStyle}>Input date</label>
          <Input
            value={String(settings.inputDate ?? '')}
            onChange={e => update({ inputDate: e.target.value })}
            placeholder="{$.body.createdAt}"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>The date to operate on. Leave empty for &apos;now&apos;.</div>
        </div>
      )}

      {operation === 'format' && (
        <div>
          <label style={labelStyle}>Format</label>
          <Input
            value={String(settings.format ?? '')}
            onChange={e => update({ format: e.target.value })}
            placeholder="YYYY-MM-DD HH:mm:ss"
          />
          <div style={helpStyle}>Output format. e.g. YYYY-MM-DD, DD/MM/YYYY, ISO 8601</div>
        </div>
      )}

      {operation === 'add' && (
        <>
          <div>
            <label style={labelStyle}>Amount</label>
            <Input
              type="number"
              value={String(settings.amount ?? '')}
              onChange={e =>
                update({ amount: e.target.value === '' ? undefined : Number(e.target.value) })
              }
              placeholder="7"
            />
          </div>

          <div>
            <label style={labelStyle}>Unit</label>
            <Select
              value={String(settings.unit ?? 'days')}
              onChange={e => update({ unit: e.target.value })}
              options={UNITS}
            />
          </div>

          <div>
            <label style={labelStyle}>Direction</label>
            <Select
              value={String(settings.direction ?? 'add')}
              onChange={e => update({ direction: e.target.value })}
              options={DIRECTIONS}
            />
          </div>
        </>
      )}

      {operation === 'timezone' && (
        <div>
          <label style={labelStyle}>Target timezone</label>
          <Input
            value={String(settings.targetTimezone ?? '')}
            onChange={e => update({ targetTimezone: e.target.value })}
            placeholder="Australia/Sydney"
          />
          <div style={helpStyle}>IANA timezone name</div>
        </div>
      )}

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="formattedDate"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
      </div>
    </div>
  )
}
