import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface SecuritySettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const ASSERTION_TYPES = [
  { value: 'hasRole', label: 'User has role' },
  { value: 'hasPermission', label: 'User has permission' },
  { value: 'ownsRecord', label: 'User owns this record' },
  { value: 'tenantMatches', label: 'Tenant matches' },
]

const FAILURE_ACTIONS = [
  { value: 'block', label: 'Block request (403 error)' },
  { value: 'warn', label: 'Log warning and continue' },
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

export function SecuritySettings({ step, onChange }: SecuritySettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const assertionType = String(settings.assertionType ?? 'hasRole')
  const showRolePermission = assertionType === 'hasRole' || assertionType === 'hasPermission'
  const showOwnerField = assertionType === 'ownsRecord'

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
        <label style={labelStyle}>Assertion type</label>
        <Select
          value={assertionType}
          onChange={e => update({ assertionType: e.target.value })}
          options={ASSERTION_TYPES}
        />
      </div>

      {showRolePermission && (
        <div>
          <label style={labelStyle}>Role / permission name</label>
          <Input
            value={String(settings.roleName ?? '')}
            onChange={e => update({ roleName: e.target.value })}
            placeholder="ADMIN"
          />
          <div style={helpStyle}>
            The role or permission to check against the current user.
          </div>
        </div>
      )}

      {showOwnerField && (
        <div>
          <label style={labelStyle}>Record owner field</label>
          <Input
            value={String(settings.ownerField ?? '')}
            onChange={e => update({ ownerField: e.target.value })}
            placeholder="{$.record.data.createdBy}"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>
            The field that contains the owner&apos;s user ID.
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle}>On failure</label>
        <Select
          value={String(settings.onFailure ?? 'block')}
          onChange={e => update({ onFailure: e.target.value })}
          options={FAILURE_ACTIONS}
        />
      </div>

      <div>
        <label style={labelStyle}>Error message</label>
        <Input
          value={String(settings.errorMessage ?? '')}
          onChange={e => update({ errorMessage: e.target.value })}
          placeholder="You don't have permission to perform this action."
        />
      </div>
    </div>
  )
}
