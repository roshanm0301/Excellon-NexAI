import React from 'react'
import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface SubscriptionSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'subscribe', label: 'Subscribe' },
  { value: 'unsubscribe', label: 'Unsubscribe' },
  { value: 'checkStatus', label: 'Check subscription status' },
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

export function SubscriptionSettings({ step, onChange }: SubscriptionSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'subscribe')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const isSubscribe = operation === 'subscribe'

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
        <label style={labelStyle}>Topic</label>
        <Input
          value={String(settings.topic ?? '')}
          onChange={e => update({ topic: e.target.value })}
          placeholder="entity.updates"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The event topic to subscribe or unsubscribe from.</div>
      </div>

      <div>
        <label style={labelStyle}>Subscriber ID</label>
        <Input
          value={String(settings.subscriberId ?? '')}
          onChange={e => update({ subscriberId: e.target.value })}
          placeholder="{$.auth.userid}"
          style={mono}
        />
        <div style={helpStyle}>Who is subscribing.</div>
      </div>

      <div>
        <label style={labelStyle}>Filter expression</label>
        <Input
          value={String(settings.filterExpression ?? '')}
          onChange={e => update({ filterExpression: e.target.value })}
          placeholder="$.entityType = 'Provider'"
          style={mono}
        />
        <div style={helpStyle}>Optional. Only deliver events that match this filter.</div>
      </div>

      {isSubscribe && (
        <div>
          <label style={labelStyle}>Callback URL</label>
          <Input
            value={String(settings.callbackUrl ?? '')}
            onChange={e => update({ callbackUrl: e.target.value })}
            placeholder="{$.body.webhookUrl}"
            style={mono}
          />
          <div style={helpStyle}>Where to deliver events. Leave empty to use WebSocket delivery.</div>
        </div>
      )}
    </div>
  )
}
