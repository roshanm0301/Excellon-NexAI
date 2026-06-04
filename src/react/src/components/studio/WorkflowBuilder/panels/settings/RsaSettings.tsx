import React from 'react'
import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface RsaSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'signPayload', label: 'Sign payload' },
  { value: 'verifySignature', label: 'Verify signature' },
  { value: 'encrypt', label: 'Encrypt' },
  { value: 'decrypt', label: 'Decrypt' },
]

const ALGORITHMS = [
  { value: 'RS256', label: 'RS256' },
  { value: 'RS384', label: 'RS384' },
  { value: 'RS512', label: 'RS512' },
  { value: 'PS256', label: 'PS256' },
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

export function RsaSettings({ step, onChange }: RsaSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'signPayload')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const isVerify = operation === 'verifySignature'

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
        <label style={labelStyle}>Payload</label>
        <Input
          value={String(settings.payload ?? '')}
          onChange={e => update({ payload: e.target.value })}
          placeholder="{$.body}"
          style={mono}
        />
        <div style={helpStyle}>The data to sign or encrypt.</div>
      </div>

      <div>
        <label style={labelStyle}>Key reference</label>
        <Input
          value={String(settings.keyReference ?? '')}
          onChange={e => update({ keyReference: e.target.value })}
          placeholder="{$.auth.privateKey}"
          style={mono}
        />
        <div style={helpStyle}>Expression that resolves to the RSA key (PEM format).</div>
      </div>

      <div>
        <label style={labelStyle}>Algorithm</label>
        <Select
          value={String(settings.algorithm ?? 'RS256')}
          onChange={e => update({ algorithm: e.target.value })}
          options={ALGORITHMS}
        />
      </div>

      {isVerify && (
        <div>
          <label style={labelStyle}>Signature</label>
          <Input
            value={String(settings.signature ?? '')}
            onChange={e => update({ signature: e.target.value })}
            placeholder="{$.body.signature}"
            style={mono}
          />
          <div style={helpStyle}>The signature to verify.</div>
        </div>
      )}

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
