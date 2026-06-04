import React from 'react'
import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface CryptoSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'encrypt', label: 'Encrypt' },
  { value: 'decrypt', label: 'Decrypt' },
  { value: 'hash', label: 'Hash (one-way)' },
  { value: 'verifyHash', label: 'Verify hash' },
]

const ENCRYPTION_ALGORITHMS = [
  { value: 'AES-256-GCM', label: 'AES-256-GCM' },
  { value: 'AES-128-CBC', label: 'AES-128-CBC' },
]

const HASH_ALGORITHMS = [
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-512', label: 'SHA-512' },
  { value: 'bcrypt', label: 'bcrypt' },
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

export function CryptoSettings({ step, onChange }: CryptoSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'encrypt')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const isEncryptDecrypt = operation === 'encrypt' || operation === 'decrypt'
  const isHashOrVerify = operation === 'hash' || operation === 'verifyHash'
  const isVerifyHash = operation === 'verifyHash'

  const algorithmOptions = isHashOrVerify ? HASH_ALGORITHMS : ENCRYPTION_ALGORITHMS
  const currentAlgorithm = String(settings.algorithm ?? '')
  const resolvedAlgorithm = algorithmOptions.some(o => o.value === currentAlgorithm)
    ? currentAlgorithm
    : algorithmOptions[0].value

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Operation</label>
        <Select
          value={operation}
          onChange={e => update({ operation: e.target.value, algorithm: '' })}
          options={OPERATIONS}
        />
      </div>

      <div>
        <label style={labelStyle}>Algorithm</label>
        <Select
          value={resolvedAlgorithm}
          onChange={e => update({ algorithm: e.target.value })}
          options={algorithmOptions}
        />
      </div>

      <div>
        <label style={labelStyle}>Input</label>
        <Input
          value={String(settings.input ?? '')}
          onChange={e => update({ input: e.target.value })}
          placeholder="{$.body.sensitiveData}"
          style={mono}
        />
        <div style={helpStyle}>Data to encrypt or hash.</div>
      </div>

      {isEncryptDecrypt && (
        <div>
          <label style={labelStyle}>Key / Secret</label>
          <Input
            value={String(settings.keySecret ?? '')}
            onChange={e => update({ keySecret: e.target.value })}
            placeholder="{$.auth.encryptionKey}"
            style={mono}
          />
          <div style={helpStyle}>Encryption key or secret. Use an expression to avoid hardcoding.</div>
        </div>
      )}

      {isVerifyHash && (
        <>
          <div>
            <label style={labelStyle}>Original value</label>
            <Input
              value={String(settings.originalValue ?? '')}
              onChange={e => update({ originalValue: e.target.value })}
              placeholder="{$.body.plaintext}"
              style={mono}
            />
            <div style={helpStyle}>The original value to compare against the hash.</div>
          </div>

          <div>
            <label style={labelStyle}>Hash to verify</label>
            <Input
              value={String(settings.hashToVerify ?? '')}
              onChange={e => update({ hashToVerify: e.target.value })}
              placeholder="{$.body.hash}"
              style={mono}
            />
          </div>
        </>
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
