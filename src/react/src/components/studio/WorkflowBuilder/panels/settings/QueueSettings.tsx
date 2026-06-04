import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface QueueSettingsProps {
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

export function QueueSettings({ step, onChange }: QueueSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const brokerType = String(settings.brokerType ?? 'Kafka')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Broker type</label>
        <Select
          value={brokerType}
          onChange={e => update({ brokerType: e.target.value })}
          options={[
            { value: 'Kafka', label: 'Kafka' },
            { value: 'RabbitMQ', label: 'RabbitMQ' },
            { value: 'AWS SQS', label: 'AWS SQS' },
            { value: 'Redis Stream', label: 'Redis Stream' },
          ]}
        />
      </div>

      <div>
        <label style={labelStyle}>Topic / Queue name</label>
        <Input
          value={String(settings.topicName ?? '')}
          onChange={e => update({ topicName: e.target.value })}
          placeholder="entity.events"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The topic or queue to publish to.</div>
      </div>

      <div>
        <label style={labelStyle}>Partition key</label>
        <Input
          value={String(settings.partitionKey ?? '')}
          onChange={e => update({ partitionKey: e.target.value })}
          placeholder="{$.body.tenantId}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          Used by Kafka for consistent routing. Leave empty for round-robin.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Message</label>
        <Textarea
          value={String(settings.message ?? '')}
          onChange={e => update({ message: e.target.value })}
          placeholder={'{"type": "CREATED", "payload": "{$.step.data}"}'}
          rows={4}
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The message payload to publish.</div>
      </div>

      {brokerType === 'AWS SQS' && (
        <div>
          <label style={labelStyle}>Delay (seconds)</label>
          <Input
            type="number"
            value={String(settings.delaySeconds ?? '')}
            onChange={e => update({ delaySeconds: e.target.value })}
            placeholder="0"
          />
          <div style={helpStyle}>SQS only. Delay before the message becomes visible.</div>
        </div>
      )}
    </div>
  )
}
