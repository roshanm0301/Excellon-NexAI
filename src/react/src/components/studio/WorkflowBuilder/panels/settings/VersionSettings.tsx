import React from 'react'
import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface VersionSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const ARTIFACT_TYPES = [
  { value: 'entitySchema', label: 'Entity schema' },
  { value: 'ruleSet', label: 'Rule set' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'overlay', label: 'Overlay' },
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

export function VersionSettings({ step, onChange }: VersionSettingsProps) {
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
        <label style={labelStyle}>Artifact type</label>
        <Select
          value={String(settings.artifactType ?? 'entitySchema')}
          onChange={e => update({ artifactType: e.target.value })}
          options={ARTIFACT_TYPES}
        />
      </div>

      <div>
        <label style={labelStyle}>Artifact ID</label>
        <Input
          value={String(settings.artifactId ?? '')}
          onChange={e => update({ artifactId: e.target.value })}
          placeholder="{$.body.artifactId}"
          style={mono}
        />
        <div style={helpStyle}>The ID of the artifact to read versions for.</div>
      </div>

      <div>
        <label style={labelStyle}>Version number</label>
        <Input
          value={String(settings.versionNumber ?? '')}
          onChange={e => update({ versionNumber: e.target.value })}
          placeholder="latest"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Specific version number, or 'latest' for the published version.</div>
      </div>

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="artifactVersion"
          style={mono}
        />
      </div>
    </div>
  )
}
