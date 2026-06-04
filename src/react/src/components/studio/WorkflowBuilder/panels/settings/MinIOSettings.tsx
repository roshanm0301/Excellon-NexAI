import React from 'react'
import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface MinIOSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'uploadFile', label: 'Upload file' },
  { value: 'downloadFile', label: 'Download file' },
  { value: 'deleteFile', label: 'Delete file' },
  { value: 'getPresignedUrl', label: 'Get presigned URL' },
  { value: 'listFiles', label: 'List files' },
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

export function MinIOSettings({ step, onChange }: MinIOSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'uploadFile')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const isUpload = operation === 'uploadFile'
  const isPresigned = operation === 'getPresignedUrl'

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
        <label style={labelStyle}>Bucket name</label>
        <Input
          value={String(settings.bucketName ?? '')}
          onChange={e => update({ bucketName: e.target.value })}
          placeholder="documents"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The MinIO/S3 bucket to operate on.</div>
      </div>

      <div>
        <label style={labelStyle}>Object key</label>
        <Input
          value={String(settings.objectKey ?? '')}
          onChange={e => update({ objectKey: e.target.value })}
          placeholder="{$.body.fileName}"
          style={mono}
        />
        <div style={helpStyle}>Path/filename within the bucket.</div>
      </div>

      {isUpload && (
        <>
          <div>
            <label style={labelStyle}>File content</label>
            <Input
              value={String(settings.fileContent ?? '')}
              onChange={e => update({ fileContent: e.target.value })}
              placeholder="{$.body.fileBase64}"
              style={mono}
            />
            <div style={helpStyle}>Base64-encoded file content. Required for upload.</div>
          </div>

          <div>
            <label style={labelStyle}>Content type</label>
            <Input
              value={String(settings.contentType ?? '')}
              onChange={e => update({ contentType: e.target.value })}
              placeholder="application/pdf"
              style={{ fontSize: '0.8125rem' }}
            />
          </div>
        </>
      )}

      {isPresigned && (
        <div>
          <label style={labelStyle}>Expiry (seconds)</label>
          <Input
            type="number"
            value={String(settings.expirySeconds ?? '')}
            onChange={e =>
              update({ expirySeconds: e.target.value === '' ? '' : Number(e.target.value) })
            }
            placeholder="3600"
          />
          <div style={helpStyle}>How long the presigned URL is valid.</div>
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
