import React from 'react'
import { Input, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface EsQuerySettingsProps {
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

const QUERY_PLACEHOLDER = '{\n  "match": { "status": "ACTIVE" }\n}'

export function EsQuerySettings({ step, onChange }: EsQuerySettingsProps) {
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
        <label style={labelStyle}>Index</label>
        <Input
          value={String(settings.index ?? '')}
          onChange={e => update({ index: e.target.value })}
          placeholder="providers"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The Elasticsearch index to query.</div>
      </div>

      <div>
        <label style={labelStyle}>Query DSL</label>
        <Textarea
          value={String(settings.queryDsl ?? '')}
          onChange={e => update({ queryDsl: e.target.value })}
          rows={6}
          placeholder={QUERY_PLACEHOLDER}
        />
        <div style={helpStyle}>Elasticsearch Query DSL. The query object (not the full request body).</div>
      </div>

      <div>
        <label style={labelStyle}>Size (limit)</label>
        <Input
          type="number"
          value={String(settings.size ?? '')}
          onChange={e =>
            update({ size: e.target.value === '' ? '' : Number(e.target.value) })
          }
          placeholder="10"
        />
      </div>

      <div>
        <label style={labelStyle}>From (offset)</label>
        <Input
          type="number"
          value={String(settings.from ?? '')}
          onChange={e =>
            update({ from: e.target.value === '' ? '' : Number(e.target.value) })
          }
          placeholder="0"
        />
      </div>

      <div>
        <label style={labelStyle}>Sort</label>
        <Input
          value={String(settings.sort ?? '')}
          onChange={e => update({ sort: e.target.value })}
          placeholder='[{ "createdAt": "desc" }]'
          style={mono}
        />
      </div>

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="searchResults"
          style={mono}
        />
      </div>
    </div>
  )
}
