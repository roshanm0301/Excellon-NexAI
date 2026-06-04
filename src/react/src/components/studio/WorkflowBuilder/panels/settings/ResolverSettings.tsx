import { Info } from 'lucide-react'
import { Input, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface ResolverSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

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

const infoBannerStyle: React.CSSProperties = {
  borderLeft: '3px solid var(--brand-400)',
  background: 'var(--brand-50, #eff6ff)',
  borderRadius: '0 6px 6px 0',
  padding: '8px 10px',
  display: 'flex',
  gap: 8,
  alignItems: 'flex-start',
  fontSize: '0.6875rem',
  color: 'var(--brand-700, #1d4ed8)',
  lineHeight: 1.5,
}

export function ResolverSettings({ step, onChange }: ResolverSettingsProps) {
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
      <div style={infoBannerStyle}>
        <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Expressions use JSONata syntax. Reference previous steps with{' '}
          <code style={{ fontFamily: 'monospace' }}>{'${"stepId.data"}'}</code>. Available
          built-ins: <code style={{ fontFamily: 'monospace' }}>$now()</code>,{' '}
          <code style={{ fontFamily: 'monospace' }}>$string()</code>,{' '}
          <code style={{ fontFamily: 'monospace' }}>$number()</code>,{' '}
          <code style={{ fontFamily: 'monospace' }}>$boolean()</code>,{' '}
          <code style={{ fontFamily: 'monospace' }}>$count()</code>,{' '}
          <code style={{ fontFamily: 'monospace' }}>$sum()</code>,{' '}
          <code style={{ fontFamily: 'monospace' }}>$uppercase()</code>,{' '}
          <code style={{ fontFamily: 'monospace' }}>$lowercase()</code>
        </span>
      </div>

      <div>
        <label style={labelStyle}>Expression</label>
        <Textarea
          value={String(settings.expression ?? '')}
          onChange={e => update({ expression: e.target.value })}
          placeholder={"$.body.firstName & ' ' & $.body.lastName"}
          rows={6}
          style={monoStyle}
        />
        <div style={helpStyle}>
          {"JSONata expression. The result is stored as this step's output."}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Input data</label>
        <Input
          value={String(settings.input ?? '')}
          onChange={e => update({ input: e.target.value })}
          placeholder="{$.body}"
          style={monoStyle}
        />
        <div style={helpStyle}>
          What to evaluate the expression against. Leave empty to use the full workflow context.
        </div>
      </div>
    </div>
  )
}
