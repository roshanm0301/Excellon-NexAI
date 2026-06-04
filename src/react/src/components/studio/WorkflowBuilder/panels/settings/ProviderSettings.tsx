import React from 'react'
import { Input, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface ProviderSettingsProps {
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

const DEFAULT_CONFIG = '{\n  "amount": "{$.body.amount}",\n  "currency": "AUD"\n}'

export function ProviderSettings({ step, onChange }: ProviderSettingsProps) {
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
        <label style={labelStyle}>Provider name</label>
        <Input
          value={String(settings.providerName ?? '')}
          onChange={e => update({ providerName: e.target.value })}
          placeholder="Stripe"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Name of the external service provider (must match a registered integration).</div>
      </div>

      <div>
        <label style={labelStyle}>Operation</label>
        <Input
          value={String(settings.operation ?? '')}
          onChange={e => update({ operation: e.target.value })}
          placeholder="createCharge"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The operation to execute on the provider.</div>
      </div>

      <div>
        <label style={labelStyle}>Config</label>
        <Textarea
          value={String(settings.config ?? '')}
          onChange={e => update({ config: e.target.value })}
          rows={4}
          placeholder={DEFAULT_CONFIG}
        />
        <div style={helpStyle}>Operation-specific configuration. Keys vary by provider and operation.</div>
      </div>

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
