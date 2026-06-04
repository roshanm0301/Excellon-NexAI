import { Input } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface FilterSettingsProps {
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

const monoStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
}

export function FilterSettings({ step, onChange }: FilterSettingsProps) {
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
        <label style={labelStyle}>Array to filter</label>
        <Input
          value={String(settings.source ?? '')}
          onChange={e => update({ source: e.target.value })}
          placeholder="{$.queryResults.data}"
          style={monoStyle}
        />
        <div style={helpStyle}>
          The array you want to filter. Must be an expression that evaluates to an array.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Keep items where</label>
        <Input
          value={String(settings.condition ?? '')}
          onChange={e => update({ condition: e.target.value })}
          placeholder="$.status = 'ACTIVE'"
          style={monoStyle}
        />
        <div style={helpStyle}>
          JSONata condition. Items that match this condition are kept.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="filteredItems"
          style={monoStyle}
        />
        <div style={helpStyle}>
          Store the filtered result in this variable. Reference it as{' '}
          {'{$.'}{String(settings.outputVar || 'filteredItems')}{'.data}'}
        </div>
      </div>

    </div>
  )
}
