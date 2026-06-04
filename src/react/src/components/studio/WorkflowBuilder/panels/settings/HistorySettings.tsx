import React from 'react'
import { Input, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface HistorySettingsProps {
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

export function HistorySettings({ step, onChange }: HistorySettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const includeFieldDiffs = settings.includeFieldDiffs !== false

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
        <label style={labelStyle}>Entity type</label>
        <Input
          value={String(settings.entityType ?? '')}
          onChange={e => update({ entityType: e.target.value })}
          placeholder="Provider"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The entity type to fetch history for.</div>
      </div>

      <div>
        <label style={labelStyle}>Record ID</label>
        <Input
          value={String(settings.recordId ?? '')}
          onChange={e => update({ recordId: e.target.value })}
          placeholder="{$.body.id}"
          style={mono}
        />
        <div style={helpStyle}>The specific record's ID.</div>
      </div>

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
        <div style={helpStyle}>Maximum number of history entries to return.</div>
      </div>

      <div>
        <label style={labelStyle}>Include field diffs</label>
        <Toggle
          checked={includeFieldDiffs}
          onChange={checked => update({ includeFieldDiffs: checked })}
          size="sm"
        />
        <div style={helpStyle}>When on, includes what changed in each history entry.</div>
      </div>

      <div>
        <label style={labelStyle}>From date</label>
        <Input
          value={String(settings.fromDate ?? '')}
          onChange={e => update({ fromDate: e.target.value })}
          placeholder="{$.body.fromDate}"
          style={mono}
        />
        <div style={helpStyle}>Optional. Only return history entries after this date.</div>
      </div>
    </div>
  )
}
