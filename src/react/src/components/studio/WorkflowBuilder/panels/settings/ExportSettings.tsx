import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface ExportSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

interface ColumnEntry {
  id: string
  header: string
  fieldPath: string
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

export function ExportSettings({ step, onChange }: ExportSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const columns = (settings.columns as ColumnEntry[] | undefined) ?? []

  const [newHeader, setNewHeader] = useState('')
  const [newFieldPath, setNewFieldPath] = useState('')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addColumn() {
    if (!newHeader.trim()) return
    update({
      columns: [
        ...columns,
        { id: `col-${Date.now()}`, header: newHeader.trim(), fieldPath: newFieldPath.trim() },
      ],
    })
    setNewHeader('')
    setNewFieldPath('')
  }

  function removeColumn(id: string) {
    update({ columns: columns.filter(c => c.id !== id) })
  }

  const format = String(settings.format ?? 'CSV')
  const showHeaders = format === 'CSV' || format === 'Excel (XLSX)'
  const showSheetName = format === 'Excel (XLSX)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Format</label>
        <Select
          value={format}
          onChange={e => update({ format: e.target.value })}
          options={[
            { value: 'CSV', label: 'CSV' },
            { value: 'Excel (XLSX)', label: 'Excel (XLSX)' },
            { value: 'PDF', label: 'PDF' },
            { value: 'JSON', label: 'JSON' },
          ]}
        />
      </div>

      <div>
        <label style={labelStyle}>Data source</label>
        <Input
          value={String(settings.dataSource ?? '')}
          onChange={e => update({ dataSource: e.target.value })}
          placeholder="{$.queryResult.data}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Array of objects to export.</div>
      </div>

      <div>
        <label style={labelStyle}>Columns</label>

        {columns.length > 0 && (
          <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {columns.map(col => (
              <div key={col.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Input
                  value={col.header}
                  onChange={e =>
                    update({
                      columns: columns.map(x =>
                        x.id === col.id ? { ...x, header: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="Column header"
                  style={{ flex: 1, fontSize: '0.75rem' }}
                />
                <Input
                  value={col.fieldPath}
                  onChange={e =>
                    update({
                      columns: columns.map(x =>
                        x.id === col.id ? { ...x, fieldPath: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="fieldPath"
                  style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => removeColumn(col.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--error-500)',
                  }}
                  aria-label="Remove column"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Input
            value={newHeader}
            onChange={e => setNewHeader(e.target.value)}
            placeholder="Column header"
            style={{ flex: 1, fontSize: '0.75rem' }}
            onKeyDown={e => e.key === 'Enter' && addColumn()}
          />
          <Input
            value={newFieldPath}
            onChange={e => setNewFieldPath(e.target.value)}
            placeholder="fieldPath"
            style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
            onKeyDown={e => e.key === 'Enter' && addColumn()}
          />
          <button
            onClick={addColumn}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              cursor: 'pointer',
              padding: '3px 6px',
              color: 'var(--brand-600)',
            }}
            aria-label="Add column"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>File name</label>
        <Input
          value={String(settings.fileName ?? '')}
          onChange={e => update({ fileName: e.target.value })}
          placeholder="export-{$.now}.csv"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The downloaded file name.</div>
      </div>

      {showHeaders && (
        <div>
          <label style={labelStyle}>Include headers</label>
          <Toggle
            checked={Boolean(settings.includeHeaders ?? true)}
            onChange={checked => update({ includeHeaders: checked })}
          />
        </div>
      )}

      {showSheetName && (
        <div>
          <label style={labelStyle}>Sheet name</label>
          <Input
            value={String(settings.sheetName ?? '')}
            onChange={e => update({ sheetName: e.target.value })}
            placeholder="Sheet1"
          />
        </div>
      )}
    </div>
  )
}
