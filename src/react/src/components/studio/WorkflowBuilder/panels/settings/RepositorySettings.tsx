import React from 'react'
import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface RepositorySettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'findOne', label: 'Find one' },
  { value: 'findMany', label: 'Find many' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'count', label: 'Count' },
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

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: '0.8125rem' }

export function RepositorySettings({ step, onChange }: RepositorySettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'findOne')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const showData = operation === 'create' || operation === 'update'
  const showLimit = operation === 'findMany'

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
        <label style={labelStyle}>Collection</label>
        <Input
          value={String(settings.collection ?? '')}
          onChange={e => update({ collection: e.target.value })}
          placeholder="providers"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The data collection or repository name.</div>
      </div>

      <div>
        <label style={labelStyle}>Filter</label>
        <Textarea
          value={String(settings.filter ?? '')}
          onChange={e => update({ filter: e.target.value })}
          rows={3}
          placeholder='{ "id": "{$.body.id}" }'
        />
        <div style={helpStyle}>JSON filter conditions.</div>
      </div>

      {showData && (
        <div>
          <label style={labelStyle}>Data</label>
          <Textarea
            value={String(settings.data ?? '')}
            onChange={e => update({ data: e.target.value })}
            rows={3}
            placeholder='{ "name": "{$.body.name}" }'
          />
          <div style={helpStyle}>Data to create or update with.</div>
        </div>
      )}

      <div>
        <label style={labelStyle}>Sort</label>
        <Input
          value={String(settings.sort ?? '')}
          onChange={e => update({ sort: e.target.value })}
          placeholder='{ "createdAt": -1 }'
          style={mono}
        />
      </div>

      {showLimit && (
        <div>
          <label style={labelStyle}>Limit</label>
          <Input
            type="number"
            value={String(settings.limit ?? '')}
            onChange={e =>
              update({ limit: e.target.value === '' ? '' : Number(e.target.value) })
            }
            placeholder="20"
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="result"
          style={mono}
        />
      </div>
    </div>
  )
}
