import React from 'react'
import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface KeycloakSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'introspectToken', label: 'Introspect token' },
  { value: 'assignRole', label: 'Assign role to user' },
  { value: 'revokeRole', label: 'Revoke role from user' },
  { value: 'getUserInfo', label: 'Get user info' },
  { value: 'checkUserHasRole', label: 'Check user has role' },
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

export function KeycloakSettings({ step, onChange }: KeycloakSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'introspectToken')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const showToken = operation === 'introspectToken' || operation === 'checkUserHasRole'
  const showUserId = operation === 'assignRole' || operation === 'revokeRole' || operation === 'getUserInfo'
  const showRole = operation === 'assignRole' || operation === 'revokeRole' || operation === 'checkUserHasRole'

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

      {showToken && (
        <div>
          <label style={labelStyle}>Token</label>
          <Input
            value={String(settings.token ?? '')}
            onChange={e => update({ token: e.target.value })}
            placeholder="{$.headers.authorization}"
            style={mono}
          />
          <div style={helpStyle}>Bearer token to introspect.</div>
        </div>
      )}

      {showUserId && (
        <div>
          <label style={labelStyle}>User ID</label>
          <Input
            value={String(settings.userId ?? '')}
            onChange={e => update({ userId: e.target.value })}
            placeholder="{$.auth.userid}"
            style={mono}
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Realm</label>
        <Input
          value={String(settings.realm ?? '')}
          onChange={e => update({ realm: e.target.value })}
          placeholder="excellon"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Keycloak realm name.</div>
      </div>

      {showRole && (
        <div>
          <label style={labelStyle}>Role name</label>
          <Input
            value={String(settings.roleName ?? '')}
            onChange={e => update({ roleName: e.target.value })}
            placeholder="PROVIDER_MANAGER"
            style={{ fontSize: '0.8125rem' }}
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="tokenInfo"
          style={mono}
        />
      </div>
    </div>
  )
}
