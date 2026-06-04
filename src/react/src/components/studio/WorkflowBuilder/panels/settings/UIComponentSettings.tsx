import React from 'react'
import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface UIComponentSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'updateState', label: 'Update component state' },
  { value: 'triggerRerender', label: 'Trigger re-render' },
  { value: 'showComponent', label: 'Show component' },
  { value: 'hideComponent', label: 'Hide component' },
  { value: 'navigateToPage', label: 'Navigate to page' },
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

const PAYLOAD_PLACEHOLDER = '{ "data": "{$.queryResult.data}" }'

export function UIComponentSettings({ step, onChange }: UIComponentSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'updateState')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const showPayload = operation === 'updateState' || operation === 'triggerRerender'
  const showPagePath = operation === 'navigateToPage'

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
        <label style={labelStyle}>Component ID</label>
        <Input
          value={String(settings.componentId ?? '')}
          onChange={e => update({ componentId: e.target.value })}
          placeholder="providerListTable"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The unique ID of the UI component to interact with.</div>
      </div>

      {showPayload && (
        <div>
          <label style={labelStyle}>Payload</label>
          <Textarea
            value={String(settings.payload ?? '')}
            onChange={e => update({ payload: e.target.value })}
            rows={3}
            placeholder={PAYLOAD_PLACEHOLDER}
          />
          <div style={helpStyle}>Data to send to the component.</div>
        </div>
      )}

      {showPagePath && (
        <div>
          <label style={labelStyle}>Page path</label>
          <Input
            value={String(settings.pagePath ?? '')}
            onChange={e => update({ pagePath: e.target.value })}
            placeholder="/admin/providers/{$.body.id}"
            style={mono}
          />
          <div style={helpStyle}>The route to navigate to.</div>
        </div>
      )}
    </div>
  )
}
