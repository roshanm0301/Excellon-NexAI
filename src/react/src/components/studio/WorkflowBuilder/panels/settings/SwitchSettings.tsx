import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface SwitchCase {
  id: string
  label: string
  branch: string
}

interface SwitchSettingsProps {
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

/** Convert a human label to camelCase for use as a branch name. */
function toCamelCase(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('')
}

export function SwitchSettings({ step, onChange }: SwitchSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const cases = (settings.cases as SwitchCase[] | undefined) ?? []
  const defaultLabel = (settings.defaultLabel as string | undefined) ?? 'Otherwise'

  // Track which case branch fields have been manually edited so auto-suggest
  // does not overwrite intentional changes.
  const [manualBranch, setManualBranch] = useState<Set<string>>(new Set())

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addCase() {
    const newCase: SwitchCase = {
      id: `case-${Date.now()}`,
      label: '',
      branch: '',
    }
    update({ cases: [...cases, newCase] })
  }

  function removeCase(id: string) {
    setManualBranch(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    update({ cases: cases.filter(c => c.id !== id) })
  }

  function updateCaseLabel(id: string, label: string) {
    update({
      cases: cases.map(c => {
        if (c.id !== id) return c
        // Auto-suggest branch from label only if branch has not been manually edited.
        const suggestedBranch = manualBranch.has(id) ? c.branch : toCamelCase(label)
        return { ...c, label, branch: suggestedBranch }
      }),
    })
  }

  function updateCaseBranch(id: string, branch: string) {
    setManualBranch(prev => new Set(prev).add(id))
    update({
      cases: cases.map(c => (c.id === id ? { ...c, branch } : c)),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Switch expression */}
      <div>
        <label style={labelStyle}>Switch expression</label>
        <Input
          value={String(settings.switchExpression ?? '')}
          onChange={e => update({ switchExpression: e.target.value })}
          placeholder="{$.step.data.status}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          The value to test. Each case below will be compared against this.
        </div>
      </div>

      {/* Cases */}
      <div>
        <label style={labelStyle}>Cases</label>

        {cases.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            {cases.map((c, idx) => (
              <div
                key={c.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '10px 10px 4px',
                  position: 'relative',
                  background: 'var(--color-surface-raised, var(--bg-secondary))',
                }}
              >
                {/* Remove button */}
                <button
                  onClick={() => removeCase(c.id)}
                  aria-label={`Remove case ${idx + 1}`}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--error-500)',
                    lineHeight: 1,
                  }}
                >
                  <Trash2 size={13} />
                </button>

                {/* Case label */}
                <div style={{ marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 3 }}>Case label</label>
                  <Input
                    value={c.label}
                    onChange={e => updateCaseLabel(c.id, e.target.value)}
                    placeholder="ACTIVE"
                    style={{ fontSize: '0.8125rem' }}
                  />
                  <div style={helpStyle}>When the expression equals this value…</div>
                </div>

                {/* Branch name */}
                <div>
                  <label style={{ ...labelStyle, marginBottom: 3 }}>Branch name</label>
                  <Input
                    value={c.branch}
                    onChange={e => updateCaseBranch(c.id, e.target.value)}
                    placeholder="activeCase"
                    style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add case button */}
        <button
          onClick={addCase}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: '1px dashed var(--color-border)',
            borderRadius: 6,
            cursor: 'pointer',
            padding: '5px 10px',
            fontSize: '0.75rem',
            color: 'var(--brand-600)',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <Plus size={13} />
          Add case
        </button>
      </div>

      {/* Default case label */}
      <div>
        <label style={labelStyle}>Default case label</label>
        <Input
          value={defaultLabel}
          onChange={e => update({ defaultLabel: e.target.value })}
          placeholder="Otherwise"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          Runs when no case matches. Leave empty to do nothing.
        </div>
      </div>
    </div>
  )
}
