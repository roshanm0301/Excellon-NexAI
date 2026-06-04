import { useState } from 'react'
import { Plus, Trash2, GripVertical, ToggleLeft } from 'lucide-react'
import { Button, Toggle, Badge } from '../../../design-system'
import type { ActionTypeV2, DecisionTable, DTColumn, DTRow, DTCell, HitPolicy } from '../../../config/studioApi'

const HIT_POLICY_OPTIONS: { value: HitPolicy; label: string }[] = [
  { value: 'First', label: 'First - first matching row wins' },
  { value: 'Unique', label: 'Unique - exactly one row must match' },
  { value: 'Any', label: 'Any - all matching rows must agree' },
  { value: 'Collect', label: 'Collect - all matching row outputs collected' },
  { value: 'Priority', label: 'Priority - highest priority row wins' },
  { value: 'RuleOrder', label: 'Rule Order - all matches in declaration order' },
]

const OUTPUT_ACTION_OPTIONS: { value: ActionTypeV2; label: string }[] = [
  { value: 'SET_FIELD', label: 'Set Field' },
  { value: 'BLOCK', label: 'Block' },
  { value: 'WARN', label: 'Warn' },
  { value: 'REQUIRE_APPROVAL', label: 'Require Approval' },
  { value: 'FIELD_BEHAVIOR', label: 'Field Behavior' },
]

interface DecisionTableEditorProps {
  table: DecisionTable
  onChange: (table: DecisionTable) => void
}

export function DecisionTableEditor({ table, onChange }: DecisionTableEditorProps) {
  const [editingCol, setEditingCol] = useState<string | null>(null)
  const inputCols = table.columns.filter(c => c.column_type === 'input')
  const outputCols = table.columns.filter(c => c.column_type === 'output')

  const addColumn = (columnType: 'input' | 'output') => {
    const key = `col_${Date.now()}`
    const newCol: DTColumn = {
      key,
      label: columnType === 'input' ? `Condition ${inputCols.length + 1}` : `Output ${outputCols.length + 1}`,
      column_type: columnType,
      field_path: columnType === 'input' ? '' : undefined,
      field_name: columnType === 'output' ? '' : undefined,
      action_type: columnType === 'output' ? 'SET_FIELD' : undefined,
    }
    const rows = table.rows.map(row => ({
      ...row,
      cells: [...row.cells, { column_key: key, expression: '' }],
    }))
    onChange({ ...table, columns: [...table.columns, newCol], rows })
  }

  const removeColumn = (key: string) => {
    onChange({
      ...table,
      columns: table.columns.filter(c => c.key !== key),
      rows: table.rows.map(row => ({ ...row, cells: row.cells.filter(c => c.column_key !== key) })),
    })
  }

  const updateColumn = (key: string, updates: Partial<DTColumn>) => {
    onChange({ ...table, columns: table.columns.map(c => c.key === key ? { ...c, ...updates } : c) })
  }

  const addRow = () => {
    const id = `row_${Date.now()}`
    const cells: DTCell[] = table.columns.map(col => ({ column_key: col.key, expression: '' }))
    const row: DTRow = { id, cells, enabled: true, priority: table.rows.length + 1 }
    onChange({ ...table, rows: [...table.rows, row] })
  }

  const removeRow = (rowId: string) => {
    onChange({ ...table, rows: table.rows.filter(r => r.id !== rowId) })
  }

  const toggleRow = (rowId: string) => {
    onChange({ ...table, rows: table.rows.map(r => r.id === rowId ? { ...r, enabled: !r.enabled } : r) })
  }

  const updateCell = (rowId: string, columnKey: string, expression: string) => {
    onChange({
      ...table,
      rows: table.rows.map(row => row.id === rowId
        ? { ...row, cells: row.cells.map(cell => cell.column_key === columnKey ? { ...cell, expression } : cell) }
        : row),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)' }}>
          Hit Policy
        </label>
        <select style={selectStyle} value={table.hit_policy} onChange={(e) => onChange({ ...table, hit_policy: e.target.value as HitPolicy })}>
          {HIT_POLICY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Badge variant="info">{table.rows.length} row{table.rows.length !== 1 ? 's' : ''}</Badge>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th style={{ width: 40, padding: '6px 8px', borderBottom: '1px solid var(--border-primary)' }} />
              <th style={{ width: 40, padding: '6px 8px', borderBottom: '1px solid var(--border-primary)' }} />
              {inputCols.length > 0 && <GroupHeader colSpan={inputCols.length} label="Conditions" color="var(--brand-700)" border="var(--brand-400)" />}
              {outputCols.length > 0 && <GroupHeader colSpan={outputCols.length} label="Outputs" color="var(--success-700)" border="var(--success-400)" />}
              <th style={{ width: 60, padding: '6px 8px', borderBottom: '1px solid var(--border-primary)' }} />
            </tr>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th style={{ padding: 8, borderBottom: '1px solid var(--border-secondary)', width: 40 }} />
              <th style={{ padding: 8, borderBottom: '1px solid var(--border-secondary)', width: 40, textAlign: 'center' }}>
                <ToggleLeft size={14} style={{ color: 'var(--fg-tertiary)' }} />
              </th>
              {[...inputCols, ...outputCols].map(col => (
                <th
                  key={col.key}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-secondary)',
                    borderLeft: col.column_type === 'output' && col === outputCols[0] ? '2px solid var(--success-400)' : col.column_type === 'input' && col === inputCols[0] ? '2px solid var(--brand-400)' : undefined,
                    minWidth: 180,
                    cursor: 'pointer',
                  }}
                  onClick={() => setEditingCol(editingCol === col.key ? null : col.key)}
                >
                  {editingCol === col.key ? (
                    <ColumnEditor col={col} onChange={(updates) => updateColumn(col.key, updates)} onRemove={() => removeColumn(col.key)} />
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>{col.label}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {(col.column_type === 'output' ? col.field_name : col.field_path) || '(click to configure)'}
                      </div>
                    </div>
                  )}
                </th>
              ))}
              <th style={{ padding: 8, borderBottom: '1px solid var(--border-secondary)', width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr key={row.id} style={{ opacity: row.enabled ? 1 : 0.5, background: rowIdx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)' }}>
                <td style={bodyCellStyle}><GripVertical size={14} /></td>
                <td style={bodyCellStyle}><Toggle checked={row.enabled} onChange={() => toggleRow(row.id)} /></td>
                {[...inputCols, ...outputCols].map(col => {
                  const cell = row.cells.find(c => c.column_key === col.key)
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: '4px 6px',
                        borderBottom: '1px solid var(--border-secondary)',
                        borderLeft: col.column_type === 'output' && col === outputCols[0] ? '2px solid var(--success-400)' : col.column_type === 'input' && col === inputCols[0] ? '2px solid var(--brand-400)' : undefined,
                      }}
                    >
                      <input
                        style={cellInputStyle}
                        placeholder={col.column_type === 'input' ? 'JSONata condition' : 'output expression/value'}
                        value={cell?.expression ?? ''}
                        onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                      />
                    </td>
                  )
                })}
                <td style={bodyCellStyle}>
                  <button onClick={() => removeRow(row.id)} style={iconButtonStyle} title="Delete row">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => addColumn('input')}>Add Input Column</Button>
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => addColumn('output')}>Add Output Column</Button>
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={addRow}>Add Row</Button>
        </div>
      </div>
    </div>
  )
}

function GroupHeader({ colSpan, label, color, border }: { colSpan: number; label: string; color: string; border: string }) {
  return (
    <th colSpan={colSpan} style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-primary)', borderLeft: `2px solid ${border}`, color, fontWeight: 700, fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>
      {label}
    </th>
  )
}

function ColumnEditor({ col, onChange, onRemove }: { col: DTColumn; onChange: (updates: Partial<DTColumn>) => void; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <input style={headerInputStyle} value={col.label} onChange={(e) => onChange({ label: e.target.value })} onClick={(e) => e.stopPropagation()} autoFocus />
      <input
        style={{ ...headerInputStyle, fontFamily: 'var(--font-mono)' }}
        placeholder={col.column_type === 'output' ? 'output field name' : 'input field path'}
        value={col.column_type === 'output' ? (col.field_name ?? '') : (col.field_path ?? '')}
        onChange={(e) => onChange(col.column_type === 'output' ? { field_name: e.target.value } : { field_path: e.target.value })}
        onClick={(e) => e.stopPropagation()}
      />
      <div style={{ display: 'flex', gap: 4 }}>
        {col.column_type === 'output' && (
          <select style={{ ...headerInputStyle, flex: 1, height: 24 }} value={col.action_type ?? 'SET_FIELD'} onChange={(e) => onChange({ action_type: e.target.value as ActionTypeV2 })} onClick={(e) => e.stopPropagation()}>
            {OUTPUT_ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        <button style={iconButtonStyle} onClick={(e) => { e.stopPropagation(); onRemove() }} title="Remove column">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

export function createBlankDecisionTable(): DecisionTable {
  return {
    columns: [],
    rows: [],
    hit_policy: 'First',
  }
}

const selectStyle: React.CSSProperties = {
  height: 34,
  padding: '0 28px 0 10px',
  border: '1px solid var(--border-primary)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-primary)',
  color: 'var(--fg-primary)',
  fontSize: 'var(--text-sm)',
  appearance: 'none',
}

const headerInputStyle: React.CSSProperties = {
  width: '100%',
  height: 28,
  padding: '0 6px',
  border: '1px solid var(--border-primary)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  boxSizing: 'border-box',
}

const cellInputStyle: React.CSSProperties = {
  width: '100%',
  height: 30,
  padding: '0 8px',
  border: '1px solid var(--border-secondary)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-primary)',
  color: 'var(--fg-primary)',
  fontSize: 'var(--text-xs)',
  fontFamily: 'var(--font-mono)',
  boxSizing: 'border-box',
}

const bodyCellStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderBottom: '1px solid var(--border-secondary)',
  textAlign: 'center',
  color: 'var(--fg-tertiary)',
}

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--error-500)',
  padding: 4,
}

