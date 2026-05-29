import { Trash2, Plus, Sparkles } from 'lucide-react'
import { Button, IconButton, Input, Select, Checkbox, CodeBlock } from '../../../design-system'

export interface IndexDef {
  id: string
  name: string
  columns: { field: string; sort: 'asc' | 'desc' }[]
  unique: boolean
}

interface CompositeIndexPanelProps {
  indexes: IndexDef[]
  availableFields: string[]
  entityKey: string
  onChange: (indexes: IndexDef[]) => void
  onAISuggest?: () => void
}

function buildDDL(entityKey: string, index: IndexDef): string {
  const unique = index.unique ? 'UNIQUE ' : ''
  const indexName = `idx_${entityKey}_${index.name || 'unnamed'}`
  const colExprs = index.columns
    .map(c => `(payload->>'${c.field}') ${c.sort}`)
    .join(', ')
  return `CREATE ${unique}INDEX CONCURRENTLY ${indexName}\n  ON entity_record (${colExprs || '/* no columns */'})\n  WHERE entity_type = '${entityKey}'\n    AND deleted_at IS NULL;`
}

export function CompositeIndexPanel({
  indexes,
  availableFields,
  entityKey,
  onChange,
  onAISuggest,
}: CompositeIndexPanelProps) {
  const fieldOptions = availableFields.map(f => ({ value: f, label: f }))

  const addIndex = () => {
    onChange([...indexes, { id: crypto.randomUUID(), name: '', columns: [], unique: false }])
  }

  const removeIndex = (idx: number) => {
    onChange(indexes.filter((_, i) => i !== idx))
  }

  const updateIndex = (idx: number, patch: Partial<IndexDef>) => {
    onChange(indexes.map((index, i) => i === idx ? { ...index, ...patch } : index))
  }

  const addColumn = (idx: number) => {
    const index = indexes[idx]
    updateIndex(idx, { columns: [...index.columns, { field: '', sort: 'asc' }] })
  }

  const removeColumn = (indexIdx: number, colIdx: number) => {
    const index = indexes[indexIdx]
    updateIndex(indexIdx, { columns: index.columns.filter((_, i) => i !== colIdx) })
  }

  const updateColumn = (indexIdx: number, colIdx: number, patch: Partial<{ field: string; sort: 'asc' | 'desc' }>) => {
    const index = indexes[indexIdx]
    updateIndex(indexIdx, {
      columns: index.columns.map((c, i) => i === colIdx ? { ...c, ...patch } : c),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {onAISuggest && (
          <Button
            variant="ghost"
            icon={<Sparkles size={16} />}
            onClick={onAISuggest}
          >
            AI Suggest
          </Button>
        )}
      </div>

      {indexes.map((index, idx) => (
        <div
          key={index.id}
          style={{
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            background: 'var(--bg-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Index Name"
                value={index.name}
                onChange={e => updateIndex(idx, { name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g. status_date"
              />
            </div>
            <div style={{ paddingBottom: 4 }}>
              <Checkbox
                label="Unique"
                checked={index.unique}
                onChange={unique => updateIndex(idx, { unique })}
              />
            </div>
            <IconButton
              onClick={() => removeIndex(idx)}
              title="Delete index"
              style={{ color: 'var(--error-500)', paddingBottom: 4 }}
            >
              <Trash2 size={16} />
            </IconButton>
          </div>

          {/* Columns */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Columns
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {index.columns.map((col, colIdx) => (
                <div key={colIdx} style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  <div style={{ flex: 2 }}>
                    <Select
                      label={colIdx === 0 ? 'Field' : undefined}
                      value={col.field}
                      onChange={e => updateColumn(idx, colIdx, { field: e.target.value })}
                      options={fieldOptions}
                      placeholder="Select field…"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, paddingBottom: 4 }}>
                    {(['asc', 'desc'] as const).map(sort => (
                      <label key={sort} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                        <input
                          type="radio"
                          name={`col-sort-${index.id}-${colIdx}`}
                          value={sort}
                          checked={col.sort === sort}
                          onChange={() => updateColumn(idx, colIdx, { sort })}
                        />
                        {sort.toUpperCase()}
                      </label>
                    ))}
                  </div>
                  <IconButton
                    onClick={() => removeColumn(idx, colIdx)}
                    title="Remove column"
                    style={{ paddingBottom: 4, color: 'var(--fg-tertiary)' }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => addColumn(idx)}
                style={{ alignSelf: 'flex-start' }}
              >
                Add Column
              </Button>
            </div>
          </div>

          {/* DDL preview */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              DDL Preview
            </div>
            <CodeBlock language="sql" code={buildDDL(entityKey, index)} />
          </div>
        </div>
      ))}

      <Button
        variant="secondary"
        icon={<Plus size={16} />}
        onClick={addIndex}
        style={{ alignSelf: 'flex-start' }}
      >
        Add Index
      </Button>
    </div>
  )
}
