import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

type OnTimeout = 'approve' | 'reject' | 'escalate' | 'pending'

interface ApprovalSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const ON_TIMEOUT_OPTIONS: { value: string; label: string }[] = [
  { value: 'approve', label: 'Auto-approve' },
  { value: 'reject', label: 'Auto-reject' },
  { value: 'escalate', label: 'Escalate to admin' },
  { value: 'pending', label: 'Leave pending' },
]

const DEFAULT_ON_TIMEOUT: OnTimeout = 'pending'

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

export function ApprovalSettings({ step, onChange }: ApprovalSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const onTimeout: OnTimeout =
    (settings.onTimeout as OnTimeout | undefined) ?? DEFAULT_ON_TIMEOUT

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
      {/* Who can approve */}
      <div>
        <label style={labelStyle}>Who can approve?</label>
        <Input
          value={String(settings.approverRole ?? '')}
          onChange={e => update({ approverRole: e.target.value })}
          placeholder="MANAGER"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          Role name or user expression. That person will receive a notification to approve or
          reject.
        </div>
      </div>

      {/* Subject */}
      <div>
        <label style={labelStyle}>Subject</label>
        <Input
          value={String(settings.subject ?? '')}
          onChange={e => update({ subject: e.target.value })}
          placeholder="Approval required: {$.body.entityName}"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Subject line of the approval request notification.</div>
      </div>

      {/* Message */}
      <div>
        <label style={labelStyle}>Message</label>
        <Textarea
          value={String(settings.message ?? '')}
          onChange={e => update({ message: e.target.value })}
          placeholder="Please review and approve the request."
          rows={3}
          style={{ fontSize: '0.8125rem', resize: 'vertical' }}
        />
        <div style={helpStyle}>Body of the approval request notification.</div>
      </div>

      {/* Approval timeout */}
      <div>
        <label style={labelStyle}>Approval timeout (hours)</label>
        <Input
          type="number"
          value={String(settings.timeoutHours ?? '')}
          onChange={e =>
            update({ timeoutHours: e.target.value === '' ? undefined : Number(e.target.value) })
          }
          placeholder="72"
          min={1}
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Hours to wait for approval before timing out.</div>
      </div>

      {/* On timeout */}
      <div>
        <label style={labelStyle}>On timeout</label>
        <Select
          value={onTimeout}
          onChange={e => update({ onTimeout: e.target.value as OnTimeout })}
          options={ON_TIMEOUT_OPTIONS}
        />
      </div>

      {/* Escalate to — only shown when onTimeout === 'escalate' */}
      {onTimeout === 'escalate' && (
        <div>
          <label style={labelStyle}>Escalate to</label>
          <Input
            value={String(settings.escalateTo ?? '')}
            onChange={e => update({ escalateTo: e.target.value })}
            placeholder="ADMIN"
            style={{ fontSize: '0.8125rem' }}
          />
        </div>
      )}
    </div>
  )
}
