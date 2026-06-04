import { Input, Select, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface StringSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'format', label: 'Format' },
  { value: 'split', label: 'Split' },
  { value: 'join', label: 'Join' },
  { value: 'replace', label: 'Replace' },
  { value: 'trim', label: 'Trim' },
  { value: 'changeCase', label: 'Change case' },
  { value: 'regex', label: 'Extract with regex' },
]

const CASE_OPTIONS = [
  { value: 'upper', label: 'UPPER' },
  { value: 'lower', label: 'lower' },
  { value: 'title', label: 'Title Case' },
  { value: 'camel', label: 'camelCase' },
  { value: 'snake', label: 'snake_case' },
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

export function StringSettings({ step, onChange }: StringSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'format')

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
        <label style={labelStyle}>Operation</label>
        <Select
          value={operation}
          onChange={e => update({ operation: e.target.value })}
          options={OPERATIONS}
        />
      </div>

      <div>
        <label style={labelStyle}>Input</label>
        <Input
          value={String(settings.input ?? '')}
          onChange={e => update({ input: e.target.value })}
          placeholder="{$.body.name}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The string to process.</div>
      </div>

      {operation === 'format' && (
        <div>
          <label style={labelStyle}>Template</label>
          <Input
            value={String(settings.template ?? '')}
            onChange={e => update({ template: e.target.value })}
            placeholder="Hello, {name}!"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>Use {'{fieldName}'} placeholders</div>
        </div>
      )}

      {operation === 'split' && (
        <div>
          <label style={labelStyle}>Separator</label>
          <Input
            value={String(settings.separator ?? '')}
            onChange={e => update({ separator: e.target.value })}
            placeholder=","
          />
        </div>
      )}

      {operation === 'join' && (
        <>
          <div>
            <label style={labelStyle}>Array</label>
            <Input
              value={String(settings.joinArray ?? '')}
              onChange={e => update({ joinArray: e.target.value })}
              placeholder="{$.body.items}"
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Separator</label>
            <Input
              value={String(settings.separator ?? '')}
              onChange={e => update({ separator: e.target.value })}
              placeholder=", "
            />
          </div>
        </>
      )}

      {operation === 'replace' && (
        <>
          <div>
            <label style={labelStyle}>Find</label>
            <Input
              value={String(settings.find ?? '')}
              onChange={e => update({ find: e.target.value })}
              placeholder=""
            />
          </div>
          <div>
            <label style={labelStyle}>Replace with</label>
            <Input
              value={String(settings.replaceWith ?? '')}
              onChange={e => update({ replaceWith: e.target.value })}
              placeholder=""
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Toggle
              checked={Boolean(settings.isRegex)}
              onChange={checked => update({ isRegex: checked })}
              label="Is regex"
              size="sm"
            />
          </div>
        </>
      )}

      {operation === 'changeCase' && (
        <div>
          <label style={labelStyle}>Target case</label>
          <Select
            value={String(settings.targetCase ?? 'upper')}
            onChange={e => update({ targetCase: e.target.value })}
            options={CASE_OPTIONS}
          />
        </div>
      )}

      {operation === 'regex' && (
        <>
          <div>
            <label style={labelStyle}>Pattern</label>
            <Input
              value={String(settings.pattern ?? '')}
              onChange={e => update({ pattern: e.target.value })}
              placeholder="\\d+"
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Capture group</label>
            <Input
              type="number"
              value={String(settings.captureGroup ?? 0)}
              onChange={e =>
                update({ captureGroup: e.target.value === '' ? 0 : Number(e.target.value) })
              }
              placeholder="0"
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
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
      </div>
    </div>
  )
}
