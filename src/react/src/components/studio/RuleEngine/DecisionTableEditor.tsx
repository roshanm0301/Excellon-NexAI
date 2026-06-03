import { useState, useCallback } from 'react'
import { Plus, Trash2, GripVertical, ToggleLeft } from 'lucide-react'
import { Button, Select, Input, Toggle, Badge } from '../../../design-system'
import type { DecisionTable, DTColumn, DTRow, DTCell, HitPolicy } from '../../../config/studioApi'

const HIT_POLICY_OPTIONS = [
  { value: 'FIRST', label: 'First — first matching row wins' },
  { value: 'UNIQUE', label: 'Unique — exactly one row must match' },
  { value: 'ANY', label: 'Any — all matching rows must agree' },
  { value: 'COLLECT', label: 'Collect — all matching row outputs collected' },
  { value: 'PRIORITY', label: 'Priority — highest priority row wins' },
  { value: 'RULE_ORDER', label: 'Rule Order — all matches in declaration order' },
]

const DATA_TYPE_OPTIONS = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
]

interface DecisionTableEditorProps {
  table: DecisionTable
  onChange: (table: DecisionTable) => void
}

export function DecisionTableEditor({ table, onChange }: DecisionTableEditorProps) {
  const [editingCol, setEditingCol] = useState<string | null>(null)

  const inputCols = table.columns.filter(c => c.direction === 'input')
  const outputCols = table.columns.filter(c => c.direction === 'output')

  const addColumn = (direction: 'input' | 'output') => {
    const id = `col_${Date.now()}`
    const newCol: DTColumn = {
      id,
      name: direction === 'input' ? `Condition ${inputCols.length + 1}` : `Output ${outputCols.length + 1}`,
      fieldPath: '',
      direction,
      dataType: 'string',
    }
    // Add empty cells to all existing rows
    const updatedRows = table.rows.map(row => ({
      ...row,
      cells: [...row.cells, { columnId: id, expression: '' }],
    }))
    onChange({ ...table, columns: [...table.columns, newCol], rows: updatedRows })
  }

  const removeColumn = (colId: string) => {
    const updatedCols = table.columns.filter(c => c.id !== colId)
    const updatedRows = table.rows.map(row => ({
      ...row,
      cells: row.cells.filter(c => c.columnId !== colId),
    }))
    onChange({ ...table, columns: updatedCols, rows: updatedRows })
  }

  const updateColumn = (colId: string, updates: Partial<DTColumn>) => {
    const updatedCols = table.columns.map(c => c.id === colId ? { ...c, ...updates } : c)
    onChange({ ...table, columns: updatedCols })
  }

  const addRow = () => {
    const id = `row_${Date.now()}`
    const cells: DTCell[] = table.columns.map(col => ({ columnId: col.id, expression: '' }))
    const newRow: DTRow = { id, cells, enabled: true, priority: table.rows.length + 1 }
    onChange({ ...table, rows: [...table.rows, newRow] })
  }

  const removeRow = (rowId: string) => {
    onChange({ ...table, rows: table.rows.filter(r => r.id !== rowId) })
  }

  const toggleRow = (rowId: string) => {
    const updatedRows = table.rows.map(r => r.id === rowId ? { ...r, enabled: !r.enabled } : r)
    onChange({ ...table, rows: updatedRows })
  }

  const updateCell = (rowId: string, columnId: string, expression: string) => {
    const updatedRows = table.rows.map(row => {
      if (row.id !== rowId) return row
      const updatedCells = row.cells.map(cell =>
        cell.columnId === columnId ? { ...cell, expression } : cell
      )
      return { ...row, cells: updatedCells }
    })
    onChange({ ...table, rows: updatedRows })
  }

  const setHitPolicy = (hp: string) => {
    onChange({ ...table, hitPolicy: hp as HitPolicy })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hit Policy Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)' }}>
          Hit Policy:
        </label>
        <select
          style={{
            height: 34, padding: '0 28px 0 10px',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
            color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)', appearance: 'none',
          }}
          value={table.hitPolicy}
          onChange={(e) => setHitPolicy(e.target.value)}
        >
          {HIT_POLICY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Badge variant="info">{table.rows.length} row{table.rows.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            {/* Direction header row */}
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th style={{ width: 40, padding: '6px 8px', borderBottom: '1px solid var(--border-primary)' }}></th>
              <th style={{ width: 40, padding: '6px 8px', borderBottom: '1px solid var(--border-primary)' }}></th>
              {inputCols.length > 0 && (
                <th
                  colSpan={inputCols.length}
                  style={{
                    padding: '6px 12px', borderBottom: '1px solid var(--border-primary)',
                    borderLeft: '2px solid var(--brand-400)',
                    color: 'var(--brand-700)', fontWeight: 700, fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}
                >
                  Conditions (Input)
                </th>
              )}
              {outputCols.length > 0 && (
                <th
                  colSpan={outputCols.length}
                  style={{
                    padding: '6px 12px', borderBottom: '1px solid var(--border-primary)',
                    borderLeft: '2px solid var(--success-400)',
                    color: 'var(--success-700)', fontWeight: 700, fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}
                >
                  Actions (Output)
                </th>
              )}
              <th style={{ width: 60, padding: '6px 8px', borderBottom: '1px solid var(--border-primary)' }}></th>
            </tr>
            {/* Column headers */}
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid var(--border-secondary)', width: 40 }}></th>
              <th style={{ padding: '8px', borderBottom: '1px solid var(--border-secondary)', width: 40, textAlign: 'center' }}>
                <ToggleLeft size={14} style={{ color: 'var(--fg-tertiary)' }} />
              </th>
              {[...inputCols, ...outputCols].map(col => (
                <th
                  key={col.id}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-secondary)',
                    borderLeft: col.direction === 'output' && col === outputCols[0] ? '2px solid var(--success-400)' : col.direction === 'input' && col === inputCols[0] ? '2px solid var(--brand-400)' : undefined,
                    minWidth: 160,
                    cursor: 'pointer',
                  }}
                  onClick={() => setEditingCol(editingCol === col.id ? null : col.id)}
                >
                  {editingCol === col.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input
                        style={{
                          width: '100%', height: 28, padding: '0 6px',
                          border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-xs)', fontWeight: 600,
                        }}
                        value={col.name}
                        onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <input
                        style={{
                          width: '100%', height: 28, padding: '0 6px',
                          border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                        }}
                        placeholder="field.path"
                        value={col.fieldPath}
                        onChange={(e) => updateColumn(col.id, { fieldPath: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div style={{ display: 'flex', gap: 4 }}>
                        <select
                          style={{ flex: 1, height: 24, fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}
                          value={col.dataType ?? 'string'}
                          onChange={(e) => updateColumn(col.id, { dataType: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {DATA_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 2 }}
                          onClick={(e) => { e.stopPropagation(); removeColumn(col.id) }}
                          title="Remove column"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>{col.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {col.fieldPath || '(click to configure)'}
                      </div>
                    </div>
                  )}
                </th>
              ))}
              <th style={{ padding: '8px', borderBottom: '1px solid var(--border-secondary)', width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr
                key={row.id}
                style={{
                  opacity: row.enabled ? 1 : 0.5,
                  background: rowIdx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                }}
              >
                <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-secondary)', textAlign: 'center', color: 'var(--fg-tertiary)' }}>
                  <GripVertical size={14} />
                </td>
                <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-secondary)', textAlign: 'center' }}>
                  <Toggle checked={row.enabled} onChange={() => toggleRow(row.id)} size="sm" />
                </td>
                {[...inputCols, ...outputCols].map(col => {
                  const cell = row.cells.find(c => c.columnId === col.id)
                  return (
                    <td
                      key={col.id}
                      style={{
                        padding: '4px 6px',
                        borderBottom: '1px solid var(--border-secondary)',
                        borderLeft: col.direction === 'output' && col === outputCols[0] ? '2px solid var(--success-400)' : col.direction === 'input' && col === inputCols[0] ? '2px solid var(--brand-400)' : undefined,
                      }}
                    >
                      <input
                        style={{
                          width: '100%', height: 30, padding: '0 8px',
                          border: '1px solid var(--border-secondary)',
                          borderRadius: 'var(--radius-md)',
                          background: row.enabled ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                          color: 'var(--fg-primary)',
                          fontSize: 'var(--text-xs)',
                          fontFamily: 'var(--font-mono)',
                          boxSizing: 'border-box',
                        }}
                        placeholder={col.direction === 'input' ? '= expression' : 'output value'}
                        value={cell?.expression ?? ''}
                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                      />
                    </td>
                  )
                })}
                <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-secondary)', textAlign: 'center' }}>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4 }}
                    onClick={() => removeRow(row.id)}
                    title="Delete row"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => addColumn('input')}>
          Add Input Column
        </Button>
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => addColumn('output')}>
          Add Output Column
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={addRow}>
            Add Row
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper to create a blank decision table
export function createBlankDecisionTable(): DecisionTable {
  return {
    columns: [],
    rows: [],
    hitPolicy: 'FIRST',
  }
}
