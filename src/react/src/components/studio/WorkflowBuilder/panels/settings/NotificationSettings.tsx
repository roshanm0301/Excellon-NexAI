import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface NotificationSettingsProps {
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

export function NotificationSettings({ step, onChange }: NotificationSettingsProps) {
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
        <label style={labelStyle}>Channel</label>
        <Select
          value={String(settings.channel ?? 'Push notification')}
          onChange={e => update({ channel: e.target.value })}
          options={[
            { value: 'Push notification', label: 'Push notification' },
            { value: 'WebSocket event', label: 'WebSocket event' },
            { value: 'In-app notification', label: 'In-app notification' },
            { value: 'Email digest', label: 'Email digest' },
          ]}
        />
      </div>

      <div>
        <label style={labelStyle}>Recipient</label>
        <Input
          value={String(settings.recipient ?? '')}
          onChange={e => update({ recipient: e.target.value })}
          placeholder="{$.auth.userid}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>User ID or role to notify.</div>
      </div>

      <div>
        <label style={labelStyle}>Title</label>
        <Input
          value={String(settings.title ?? '')}
          onChange={e => update({ title: e.target.value })}
          placeholder="Request approved"
        />
      </div>

      <div>
        <label style={labelStyle}>Message</label>
        <Textarea
          value={String(settings.message ?? '')}
          onChange={e => update({ message: e.target.value })}
          placeholder="Your request {$.body.id} has been approved."
          rows={2}
        />
      </div>

      <div>
        <label style={labelStyle}>Event name</label>
        <Input
          value={String(settings.eventName ?? '')}
          onChange={e => update({ eventName: e.target.value })}
          placeholder="request.approved"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          Used for WebSocket routing. Clients subscribed to this event will receive it.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Payload</label>
        <Textarea
          value={String(settings.payload ?? '')}
          onChange={e => update({ payload: e.target.value })}
          placeholder={'{ "id": "{$.body.id}" }'}
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Extra data to include with the notification.</div>
      </div>
    </div>
  )
}
