import { Input, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface IteratorSettingsProps {
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

export function IteratorSettings({ step, onChange }: IteratorSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const parallel = (settings.parallel as boolean | undefined) ?? false

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
      {/* Collection to iterate */}
      <div>
        <label style={labelStyle}>Collection to iterate</label>
        <Input
          value={String(settings.collection ?? '')}
          onChange={e => update({ collection: e.target.value })}
          placeholder="{$.queryResults.data}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          The array to loop through. Each item is processed one at a time.
        </div>
      </div>

      {/* Item variable name */}
      <div>
        <label style={labelStyle}>Item variable name</label>
        <Input
          value={String(settings.itemVar ?? '')}
          onChange={e => update({ itemVar: e.target.value })}
          placeholder="item"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          Available inside the loop as {'{$.item}'}
        </div>
      </div>

      {/* Index variable name */}
      <div>
        <label style={labelStyle}>Index variable name</label>
        <Input
          value={String(settings.indexVar ?? '')}
          onChange={e => update({ indexVar: e.target.value })}
          placeholder="index"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          Current position (0-based) available as {'{$.index}'}
        </div>
      </div>

      {/* Run in parallel */}
      <div>
        <div style={{ marginBottom: 6 }}>
          <Toggle
            checked={parallel}
            onChange={checked => update({ parallel: checked })}
            label="Process all items at once (parallel)"
          />
        </div>
        <div style={helpStyle}>
          When on, all items run simultaneously. When off, items process one by one in order.
        </div>
      </div>
    </div>
  )
}
