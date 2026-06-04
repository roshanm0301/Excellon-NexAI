import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

type WaitMode = 'duration' | 'datetime'
type DurationUnit = 'seconds' | 'minutes' | 'hours' | 'days'

interface TimerSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const WAIT_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: 'duration', label: 'For a duration' },
  { value: 'datetime', label: 'Until a specific date/time' },
]

const UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
]

const DEFAULT_MODE: WaitMode = 'duration'
const DEFAULT_UNIT: DurationUnit = 'minutes'

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

export function TimerSettings({ step, onChange }: TimerSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const mode: WaitMode = (settings.mode as WaitMode | undefined) ?? DEFAULT_MODE
  const unit: DurationUnit = (settings.unit as DurationUnit | undefined) ?? DEFAULT_UNIT

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
      {/* Wait mode */}
      <div>
        <label style={labelStyle}>Wait mode</label>
        <Select
          value={mode}
          onChange={e => update({ mode: e.target.value as WaitMode })}
          options={WAIT_MODE_OPTIONS}
        />
      </div>

      {/* Duration inputs — shown when mode === 'duration' */}
      {mode === 'duration' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Amount</label>
            <Input
              type="number"
              value={String(settings.amount ?? '')}
              onChange={e =>
                update({ amount: e.target.value === '' ? undefined : Number(e.target.value) })
              }
              placeholder="5"
              min={1}
              style={{ fontSize: '0.8125rem' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Unit</label>
            <Select
              value={unit}
              onChange={e => update({ unit: e.target.value as DurationUnit })}
              options={UNIT_OPTIONS}
            />
          </div>
        </div>
      )}

      {/* Datetime expression — shown when mode === 'datetime' */}
      {mode === 'datetime' && (
        <div>
          <label style={labelStyle}>Date/time expression</label>
          <Input
            value={String(settings.until ?? '')}
            onChange={e => update({ until: e.target.value })}
            placeholder="{$.body.scheduledAt}"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>
            ISO 8601 datetime or expression that evaluates to one.
          </div>
        </div>
      )}

      {/* Resume step ID */}
      <div>
        <label style={labelStyle}>Resume step ID</label>
        <Input
          value={String(settings.resumeStepId ?? '')}
          onChange={e => update({ resumeStepId: e.target.value })}
          placeholder=""
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          After the wait completes, execution continues from here. Leave empty to continue to the
          next step.
        </div>
      </div>
    </div>
  )
}
