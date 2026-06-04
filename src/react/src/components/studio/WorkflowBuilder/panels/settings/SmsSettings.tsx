import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface SmsSettingsProps {
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

export function SmsSettings({ step, onChange }: SmsSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const messageText = String(settings.message ?? '')
  const charCount = messageText.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Provider</label>
        <Select
          value={String(settings.provider ?? 'Twilio')}
          onChange={e => update({ provider: e.target.value })}
          options={[
            { value: 'Twilio', label: 'Twilio' },
            { value: 'AWS SNS', label: 'AWS SNS' },
            { value: 'MessageBird', label: 'MessageBird' },
            { value: 'Custom', label: 'Custom' },
          ]}
        />
      </div>

      <div>
        <label style={labelStyle}>To (phone number)</label>
        <Input
          value={String(settings.to ?? '')}
          onChange={e => update({ to: e.target.value })}
          placeholder="{$.body.phoneNumber}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Phone number in E.164 format: +61400000000</div>
      </div>

      <div>
        <label style={labelStyle}>Message</label>
        <Textarea
          value={messageText}
          onChange={e => update({ message: e.target.value })}
          placeholder="Your OTP is: {$.otp.data}"
          rows={3}
        />
        <div style={helpStyle}>
          SMS message text. Keep under 160 characters to avoid splitting.
        </div>
        <div style={helpStyle}>{charCount} / 160 characters</div>
      </div>

      <div>
        <label style={labelStyle}>From number</label>
        <Input
          value={String(settings.from ?? '')}
          onChange={e => update({ from: e.target.value })}
          placeholder="+61400000000"
        />
        <div style={helpStyle}>The sender ID or phone number.</div>
      </div>
    </div>
  )
}
