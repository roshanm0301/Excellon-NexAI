import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Textarea, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface ParallelSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

interface BranchEntry {
  id: string
  label: string
  key: string
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ParallelSettings({ step, onChange }: ParallelSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const branches = (settings.branches as BranchEntry[] | undefined) ?? []

  const [newLabel, setNewLabel] = useState('')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addBranch() {
    if (!newLabel.trim()) return
    const label = newLabel.trim()
    update({
      branches: [
        ...branches,
        { id: `b-${Date.now()}`, label, key: slugify(label) },
      ],
    })
    setNewLabel('')
  }

  function removeBranch(id: string) {
    update({ branches: branches.filter(b => b.id !== id) })
  }

  function updateBranchLabel(id: string, label: string) {
    update({
      branches: branches.map(b =>
        b.id === id ? { ...b, label, key: slugify(label) } : b
      ),
    })
  }

  function updateBranchKey(id: string, key: string) {
    update({
      branches: branches.map(b =>
        b.id === id ? { ...b, key } : b
      ),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Description</label>
        <Textarea
          value={String(settings.description ?? '')}
          onChange={e => update({ description: e.target.value })}
          placeholder="Describe what runs in parallel..."
          rows={2}
        />
        <div style={helpStyle}>
          The branches inside all run at the same time. Execution continues after all branches
          complete.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Wait for all</label>
        <Toggle
          checked={Boolean(settings.waitForAll ?? true)}
          onChange={checked => update({ waitForAll: checked })}
        />
        <div style={helpStyle}>
          When on, waits for all branches to finish before continuing. When off, continues after
          the first branch finishes.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Branch labels</label>

        {branches.length > 0 && (
          <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {branches.map(b => (
              <div key={b.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Input
                  value={b.label}
                  onChange={e => updateBranchLabel(b.id, e.target.value)}
                  placeholder="Branch label"
                  style={{ flex: 1, fontSize: '0.75rem' }}
                />
                <Input
                  value={b.key}
                  onChange={e => updateBranchKey(b.id, e.target.value)}
                  placeholder="branch-key"
                  style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => removeBranch(b.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--error-500)',
                  }}
                  aria-label="Remove branch"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Branch label"
            style={{ flex: 1, fontSize: '0.75rem' }}
            onKeyDown={e => e.key === 'Enter' && addBranch()}
          />
          <button
            onClick={addBranch}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              cursor: 'pointer',
              padding: '3px 6px',
              color: 'var(--brand-600)',
            }}
            aria-label="Add branch"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
