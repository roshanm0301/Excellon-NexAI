import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

type LoopType = 'condition' | 'count'

interface LoopSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const LOOP_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'condition', label: 'While condition is true' },
  { value: 'count', label: 'Fixed number of times' },
]

const LOOP_TYPE_DEFAULT: LoopType = 'condition'

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

export function LoopSettings({ step, onChange }: LoopSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const loopType: LoopType = (settings.loopType as LoopType | undefined) ?? LOOP_TYPE_DEFAULT

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
      {/* Loop mode */}
      <div>
        <label style={labelStyle}>Loop over</label>
        <Select
          value={loopType}
          onChange={e => update({ loopType: e.target.value as LoopType })}
          options={LOOP_TYPE_OPTIONS}
        />
      </div>

      {/* Condition expression — shown when loopType === 'condition' */}
      {loopType === 'condition' && (
        <div>
          <label style={labelStyle}>Condition expression</label>
          <Input
            value={String(settings.condition ?? '')}
            onChange={e => update({ condition: e.target.value })}
            placeholder="{$.step.data.hasMore}"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>
            Loop continues as long as this expression evaluates to true.
          </div>
        </div>
      )}

      {/* Count — shown when loopType === 'count' */}
      {loopType === 'count' && (
        <div>
          <label style={labelStyle}>Number of times</label>
          <Input
            type="number"
            value={String(settings.count ?? '')}
            onChange={e => update({ count: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="10"
            min={1}
            style={{ fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>How many times to repeat the loop body.</div>
        </div>
      )}

      {/* Item variable */}
      <div>
        <label style={labelStyle}>Item variable</label>
        <Input
          value={String(settings.itemVar ?? '')}
          onChange={e => update({ itemVar: e.target.value })}
          placeholder="item"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          In each iteration, the current value is available as {'{$.item}'}
        </div>
      </div>

      {/* Max iterations */}
      <div>
        <label style={labelStyle}>Max iterations</label>
        <Input
          type="number"
          value={String(settings.maxIterations ?? 1000)}
          onChange={e =>
            update({ maxIterations: e.target.value === '' ? 1000 : Number(e.target.value) })
          }
          placeholder="1000"
          min={1}
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          Safety limit. Loop stops after this many iterations even if condition is still true.
        </div>
      </div>
    </div>
  )
}
