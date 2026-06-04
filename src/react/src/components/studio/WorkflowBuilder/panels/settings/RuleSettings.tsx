import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface RuleSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const ON_BLOCK_OPTIONS = [
  { value: 'stop', label: 'Stop workflow and return error' },
  { value: 'continue', label: 'Continue workflow' },
  { value: 'warn', label: 'Log warning only' },
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

const monoStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
}

export function RuleSettings({ step, onChange }: RuleSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const onBlock = String(settings.onBlock ?? 'stop') as 'stop' | 'continue' | 'warn'

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
        <label style={labelStyle}>Rule set</label>
        <Input
          value={String(settings.ruleSet ?? '')}
          onChange={e => update({ ruleSet: e.target.value })}
          placeholder="ProviderApprovalRules"
        />
        <div style={helpStyle}>
          Name of the rule set to evaluate. Rule sets are defined in the Rules Engine.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Input expression</label>
        <Input
          value={String(settings.input ?? '')}
          onChange={e => update({ input: e.target.value })}
          placeholder="{$.body}"
          style={monoStyle}
        />
        <div style={helpStyle}>
          The data to evaluate the rules against. Usually the request body or a step output.
        </div>
      </div>

      <div>
        <label style={labelStyle}>On BLOCK action</label>
        <Select
          value={onBlock}
          onChange={e => update({ onBlock: e.target.value as 'stop' | 'continue' | 'warn' })}
          options={ON_BLOCK_OPTIONS}
        />
      </div>

      {onBlock === 'stop' && (
        <div>
          <label style={labelStyle}>Error message</label>
          <Input
            value={String(settings.errorMessage ?? '')}
            onChange={e => update({ errorMessage: e.target.value })}
            placeholder="Request blocked by rule: {$.ruleName}"
          />
          <div style={helpStyle}>
            Message returned when a rule blocks the request. Shown only when action is 'Stop'.
          </div>
        </div>
      )}
    </div>
  )
}
