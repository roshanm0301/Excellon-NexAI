import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Shield } from 'lucide-react'
import { Button, Spinner, Banner } from '../../../design-system'
import {
  getConflictMatrix,
  saveConflictMatrixEntry,
  deleteConflictMatrixEntry,
  type ConflictMatrixEntry,
} from '../../../config/studioApi'

const RESOLUTION_OPTIONS = [
  { value: 'last_writer', label: 'Last Writer Wins', desc: 'Latest rule (by priority) sets the final value' },
  { value: 'first_writer', label: 'First Writer Wins', desc: 'First matching rule locks the value' },
  { value: 'most_restrictive', label: 'Most Restrictive', desc: 'Most restrictive value is chosen' },
  { value: 'custom_rule', label: 'Custom Expression', desc: 'JSONata expression resolves the conflict' },
]

interface ConflictMatrixPanelProps {
  ruleSetKey: string
}

export function ConflictMatrixPanel({ ruleSetKey }: ConflictMatrixPanelProps) {
  const queryClient = useQueryClient()
  const [newField, setNewField] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['conflict-matrix', ruleSetKey],
    queryFn: () => getConflictMatrix(ruleSetKey),
  })

  const saveMutation = useMutation({
    mutationFn: (entry: ConflictMatrixEntry) => saveConflictMatrixEntry(ruleSetKey, entry),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conflict-matrix', ruleSetKey] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (field: string) => deleteConflictMatrixEntry(ruleSetKey, field),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conflict-matrix', ruleSetKey] }),
  })

  const addEntry = () => {
    if (!newField.trim()) return
    saveMutation.mutate({ field: newField.trim(), resolution_type: 'last_writer' })
    setNewField('')
  }

  const updateEntry = (entry: ConflictMatrixEntry, updates: Partial<ConflictMatrixEntry>) => {
    saveMutation.mutate({ ...entry, ...updates })
  }

  if (isLoading) return <Spinner />
  if (error) return <Banner variant="error" title="Failed to load conflict matrix" />

  const entries = data?.items ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Shield size={16} style={{ color: 'var(--fg-tertiary)' }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>
          Define how conflicting field mutations from multiple rules are resolved.
        </span>
      </div>

      {/* Entries table */}
      {entries.length > 0 && (
        <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border-primary)' }}>Field</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border-primary)' }}>Resolution Strategy</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border-primary)' }}>Custom Expression</th>
                <th style={{ padding: '10px 12px', width: 50, borderBottom: '1px solid var(--border-primary)' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.field} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--brand-600)' }}>
                    {entry.field}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <select
                      style={{
                        height: 32, padding: '0 28px 0 10px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)',
                        color: 'var(--fg-primary)', fontSize: 'var(--text-xs)',
                        appearance: 'none',
                      }}
                      value={entry.resolution_type}
                      onChange={(e) => updateEntry(entry, { resolution_type: e.target.value as ConflictMatrixEntry['resolution_type'] })}
                    >
                      {RESOLUTION_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {entry.resolution_type === 'custom_rule' ? (
                      <input
                        style={{
                          width: '100%', height: 32, padding: '0 8px',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)',
                          fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                          color: 'var(--fg-primary)', boxSizing: 'border-box',
                        }}
                        placeholder="$prev > $next ? $prev : $next"
                        value={entry.custom_expr ?? ''}
                        onChange={(e) => updateEntry(entry, { custom_expr: e.target.value })}
                      />
                    ) : (
                      <span style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-xs)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <button
                      onClick={() => deleteMutation.mutate(entry.field)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4 }}
                      title="Remove field"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length === 0 && (
        <div style={{
          padding: 24, textAlign: 'center', border: '1px dashed var(--border-secondary)',
          borderRadius: 'var(--radius-lg)', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)',
        }}>
          No conflict resolution rules defined. Add fields that may be written by multiple rules.
        </div>
      )}

      {/* Add new field */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          style={{
            flex: 1, height: 36, padding: '0 12px',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
            color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-mono)', boxSizing: 'border-box',
          }}
          placeholder="field.path (e.g. status, amount, risk_score)"
          value={newField}
          onChange={(e) => setNewField(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addEntry() }}
        />
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addEntry} disabled={!newField.trim()}>
          Add Field
        </Button>
      </div>
    </div>
  )
}
