import React from 'react'
import { Input } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface IdentifierSettingsProps {
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

export function IdentifierSettings({ step, onChange }: IdentifierSettingsProps) {
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
        <label style={labelStyle}>Entity type</label>
        <Input
          value={String(settings.entityType ?? '')}
          onChange={e => update({ entityType: e.target.value })}
          placeholder="Provider"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The entity type this identifier belongs to.</div>
      </div>

      <div>
        <label style={labelStyle}>Identifier field</label>
        <Input
          value={String(settings.identifierField ?? '')}
          onChange={e => update({ identifierField: e.target.value })}
          placeholder="id"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The field name that contains the identifier.</div>
      </div>

      <div>
        <label style={labelStyle}>Input value</label>
        <Input
          value={String(settings.inputValue ?? '')}
          onChange={e => update({ inputValue: e.target.value })}
          placeholder="{$.body.id}"
          style={mono}
        />
        <div style={helpStyle}>The value to look up.</div>
      </div>

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="resolvedEntity"
          style={mono}
        />
      </div>
    </div>
  )
}
