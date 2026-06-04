import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface AiSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const PROVIDERS = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini (OpenAI)' },
  { value: 'gemini-pro', label: 'Gemini Pro (Google)' },
]

const OUTPUT_FORMATS = [
  { value: 'text', label: 'Plain text' },
  { value: 'json', label: 'JSON object' },
  { value: 'array', label: 'Array' },
  { value: 'boolean', label: 'Boolean (yes/no)' },
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

export function AiSettings({ step, onChange }: AiSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const outputFormat = String(settings.outputFormat ?? 'text')
  const showSchema = outputFormat === 'json' || outputFormat === 'array'

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
        <label style={labelStyle}>Provider</label>
        <Select
          value={String(settings.provider ?? 'claude')}
          onChange={e => update({ provider: e.target.value })}
          options={PROVIDERS}
        />
      </div>

      <div>
        <label style={labelStyle}>System prompt</label>
        <Textarea
          value={String(settings.systemPrompt ?? '')}
          onChange={e => update({ systemPrompt: e.target.value })}
          placeholder="You are a helpful assistant that extracts structured data from text."
          rows={4}
        />
        <div style={helpStyle}>
          Instructions that define how the AI should behave.
        </div>
      </div>

      <div>
        <label style={labelStyle}>User prompt</label>
        <Textarea
          value={String(settings.userPrompt ?? '')}
          onChange={e => update({ userPrompt: e.target.value })}
          placeholder="Extract the key information from: {$.body.text}"
          rows={4}
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          The actual request. Use {'{$.stepId.data}'} to include data from previous steps.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Expected output format</label>
        <Select
          value={outputFormat}
          onChange={e => update({ outputFormat: e.target.value })}
          options={OUTPUT_FORMATS}
        />
      </div>

      {showSchema && (
        <div>
          <label style={labelStyle}>Output schema</label>
          <Textarea
            value={String(settings.outputSchema ?? '')}
            onChange={e => update({ outputSchema: e.target.value })}
            placeholder='{ "name": "string", "amount": "number" }'
            rows={3}
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>
            Describe the JSON structure you expect back. The AI will try to match it.
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle}>Temperature</label>
        <Input
          type="number"
          step={0.1}
          min={0}
          max={2}
          value={String(settings.temperature ?? '')}
          onChange={e =>
            update({ temperature: e.target.value === '' ? undefined : Number(e.target.value) })
          }
          placeholder="0.3"
        />
        <div style={helpStyle}>
          0 = focused/deterministic, 1 = creative, 2 = very random
        </div>
      </div>
    </div>
  )
}
