import React from 'react'
import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface SchemaSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const SCHEMA_TYPES = [
  { value: 'jsonSchema', label: 'JSON Schema' },
  { value: 'joiZod', label: 'Joi / Zod rules' },
  { value: 'entitySchema', label: 'Entity schema' },
]

const ON_FAILURE_OPTIONS = [
  { value: 'stop400', label: 'Stop with 400 error' },
  { value: 'continueWithWarnings', label: 'Continue with warnings' },
  { value: 'setErrorVariable', label: 'Set error variable' },
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

const JSON_SCHEMA_PLACEHOLDER =
  '{\n  "type": "object",\n  "required": ["name"],\n  "properties": { "name": { "type": "string" } }\n}'

export function SchemaSettings({ step, onChange }: SchemaSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const schemaType = String(settings.schemaType ?? 'jsonSchema')
  const onFailure = String(settings.onFailure ?? 'stop400')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const isJsonSchema = schemaType === 'jsonSchema'
  const isEntitySchema = schemaType === 'entitySchema'
  const isSetError = onFailure === 'setErrorVariable'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Input to validate</label>
        <Input
          value={String(settings.inputToValidate ?? '')}
          onChange={e => update({ inputToValidate: e.target.value })}
          placeholder="{$.body}"
          style={mono}
        />
        <div style={helpStyle}>The data to validate against the schema.</div>
      </div>

      <div>
        <label style={labelStyle}>Schema type</label>
        <Select
          value={schemaType}
          onChange={e => update({ schemaType: e.target.value })}
          options={SCHEMA_TYPES}
        />
      </div>

      {isJsonSchema && (
        <div>
          <label style={labelStyle}>JSON Schema</label>
          <Textarea
            value={String(settings.jsonSchema ?? '')}
            onChange={e => update({ jsonSchema: e.target.value })}
            rows={6}
            placeholder={JSON_SCHEMA_PLACEHOLDER}
          />
          <div style={helpStyle}>Standard JSON Schema definition.</div>
        </div>
      )}

      {isEntitySchema && (
        <div>
          <label style={labelStyle}>Entity schema name</label>
          <Input
            value={String(settings.entitySchemaName ?? '')}
            onChange={e => update({ entitySchemaName: e.target.value })}
            placeholder="Provider"
            style={{ fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>Validate against a published entity schema.</div>
        </div>
      )}

      <div>
        <label style={labelStyle}>On failure</label>
        <Select
          value={onFailure}
          onChange={e => update({ onFailure: e.target.value })}
          options={ON_FAILURE_OPTIONS}
        />
      </div>

      {isSetError && (
        <div>
          <label style={labelStyle}>Error variable</label>
          <Input
            value={String(settings.errorVar ?? '')}
            onChange={e => update({ errorVar: e.target.value })}
            placeholder="schemaErrors"
            style={mono}
          />
        </div>
      )}
    </div>
  )
}
