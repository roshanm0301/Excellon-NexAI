import React from 'react'
import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface AzureSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const AZURE_SERVICES = [
  { value: 'blobStorage', label: 'Blob Storage' },
  { value: 'serviceBus', label: 'Service Bus' },
  { value: 'azureFunctions', label: 'Azure Functions' },
  { value: 'tableStorage', label: 'Table Storage' },
  { value: 'keyVault', label: 'Key Vault' },
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

export function AzureSettings({ step, onChange }: AzureSettingsProps) {
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
        <label style={labelStyle}>Azure service</label>
        <Select
          value={String(settings.azureService ?? 'blobStorage')}
          onChange={e => update({ azureService: e.target.value })}
          options={AZURE_SERVICES}
        />
      </div>

      <div>
        <label style={labelStyle}>Operation</label>
        <Input
          value={String(settings.operation ?? '')}
          onChange={e => update({ operation: e.target.value })}
          placeholder="uploadBlob"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The operation to perform. Varies by service.</div>
      </div>

      <div>
        <label style={labelStyle}>Container / Queue / Function</label>
        <Input
          value={String(settings.resourceName ?? '')}
          onChange={e => update({ resourceName: e.target.value })}
          placeholder="documents"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Target resource name in Azure.</div>
      </div>

      <div>
        <label style={labelStyle}>Input</label>
        <Textarea
          value={String(settings.input ?? '')}
          onChange={e => update({ input: e.target.value })}
          rows={3}
          placeholder="{$.body}"
        />
        <div style={helpStyle}>Data to send to the Azure service.</div>
      </div>

      <div>
        <label style={labelStyle}>Connection string ref</label>
        <Input
          value={String(settings.connectionStringRef ?? '')}
          onChange={e => update({ connectionStringRef: e.target.value })}
          placeholder="{$.const.azureConnectionString}"
          style={mono}
        />
        <div style={helpStyle}>Expression resolving to the Azure connection string.</div>
      </div>

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
