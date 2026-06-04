import { Input, Textarea, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface EmailSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'text', label: 'Plain text' },
  { value: 'html', label: 'HTML' },
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

const monoStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
}

export function EmailSettings({ step, onChange }: EmailSettingsProps) {
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
        <label style={labelStyle}>To</label>
        <Input
          value={String(settings.to ?? '')}
          onChange={e => update({ to: e.target.value })}
          placeholder="{$.body.email}"
          style={monoStyle}
        />
        <div style={helpStyle}>Email address to send to. Can be an expression.</div>
      </div>

      <div>
        <label style={labelStyle}>CC</label>
        <Input
          value={String(settings.cc ?? '')}
          onChange={e => update({ cc: e.target.value })}
          placeholder="{$.body.managerEmail}"
          style={monoStyle}
        />
        <div style={helpStyle}>Optional. Separate multiple addresses with commas.</div>
      </div>

      <div>
        <label style={labelStyle}>BCC</label>
        <Input
          value={String(settings.bcc ?? '')}
          onChange={e => update({ bcc: e.target.value })}
          placeholder=""
          style={monoStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Subject</label>
        <Input
          value={String(settings.subject ?? '')}
          onChange={e => update({ subject: e.target.value })}
          placeholder="Your request has been processed"
        />
      </div>

      <div>
        <label style={labelStyle}>Body</label>
        <Textarea
          value={String(settings.body ?? '')}
          onChange={e => update({ body: e.target.value })}
          rows={6}
          placeholder="Write your email body here…"
        />
        <div style={helpStyle}>
          {'Email body. Use {$.stepId.data} to insert data from previous steps.'}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Content type</label>
        <Select
          value={String(settings.contentType ?? 'text')}
          onChange={e => update({ contentType: e.target.value as 'text' | 'html' })}
          options={CONTENT_TYPE_OPTIONS}
        />
      </div>

      <div>
        <label style={labelStyle}>From name</label>
        <Input
          value={String(settings.fromName ?? '')}
          onChange={e => update({ fromName: e.target.value })}
          placeholder="NexAI Platform"
        />
        <div style={helpStyle}>{"Display name shown in the 'From' field."}</div>
      </div>

      <div>
        <label style={labelStyle}>Reply-to</label>
        <Input
          value={String(settings.replyTo ?? '')}
          onChange={e => update({ replyTo: e.target.value })}
          placeholder=""
          style={monoStyle}
        />
        <div style={helpStyle}>Optional reply-to email address.</div>
      </div>
    </div>
  )
}
