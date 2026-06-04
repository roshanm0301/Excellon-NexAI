import React from 'react'
import { Input, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface TrinoSettingsProps {
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

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: '0.8125rem' }

const QUERY_PLACEHOLDER =
  'SELECT status, COUNT(*) as count FROM providers GROUP BY status'

export function TrinoSettings({ step, onChange }: TrinoSettingsProps) {
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
        <label style={labelStyle}>Catalog</label>
        <Input
          value={String(settings.catalog ?? '')}
          onChange={e => update({ catalog: e.target.value })}
          placeholder="hive"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Trino catalog name.</div>
      </div>

      <div>
        <label style={labelStyle}>Schema</label>
        <Input
          value={String(settings.schema ?? '')}
          onChange={e => update({ schema: e.target.value })}
          placeholder="analytics"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The schema within the catalog.</div>
      </div>

      <div>
        <label style={labelStyle}>Query</label>
        <Textarea
          value={String(settings.query ?? '')}
          onChange={e => update({ query: e.target.value })}
          rows={6}
          placeholder={QUERY_PLACEHOLDER}
        />
        <div style={helpStyle}>Trino SQL query. Use standard ANSI SQL.</div>
      </div>

      <div>
        <label style={labelStyle}>Query timeout (seconds)</label>
        <Input
          type="number"
          value={String(settings.queryTimeoutSeconds ?? '')}
          onChange={e =>
            update({ queryTimeoutSeconds: e.target.value === '' ? '' : Number(e.target.value) })
          }
          placeholder="30"
        />
      </div>

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="analyticsResult"
          style={mono}
        />
      </div>
    </div>
  )
}
