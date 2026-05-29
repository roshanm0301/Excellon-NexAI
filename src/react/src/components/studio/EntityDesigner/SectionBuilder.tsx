import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { Button, IconButton, Input, Checkbox } from '../../../design-system'

export interface Section {
  id: string
  title: string
  fields: string[]
}

interface SectionBuilderProps {
  sections: Section[]
  availableFields: string[]
  onChange: (sections: Section[]) => void
}

export function SectionBuilder({ sections, availableFields, onChange }: SectionBuilderProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const addSection = () => {
    onChange([...sections, { id: crypto.randomUUID(), title: 'New Section', fields: [] }])
  }

  const removeSection = (idx: number) => {
    onChange(sections.filter((_, i) => i !== idx))
  }

  const updateTitle = (idx: number, title: string) => {
    onChange(sections.map((s, i) => i === idx ? { ...s, title } : s))
  }

  const toggleField = (sectionIdx: number, fieldName: string, checked: boolean) => {
    onChange(sections.map((s, i) => {
      if (i !== sectionIdx) return s
      const fields = checked
        ? [...s.fields, fieldName]
        : s.fields.filter(f => f !== fieldName)
      return { ...s, fields }
    }))
  }

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    const next = [...sections]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    onChange(next)
    setDragIdx(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sections.map((section, idx) => (
        <div
          key={section.id}
          draggable
          onDragStart={() => setDragIdx(idx)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(idx)}
          style={{
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            background: 'var(--bg-primary)',
            opacity: dragIdx === idx ? 0.5 : 1,
            cursor: 'grab',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Section Title"
                value={section.title}
                onChange={e => updateTitle(idx, e.target.value)}
              />
            </div>
            <IconButton
              onClick={() => removeSection(idx)}
              title="Delete section"
              style={{ marginTop: 24, color: 'var(--error-500)' }}
            >
              <Trash2 size={16} />
            </IconButton>
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Assign Fields
            </div>
            {availableFields.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)', margin: 0 }}>
                No fields available. Add fields in the Schema tab first.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                {availableFields.map(fieldName => (
                  <Checkbox
                    key={fieldName}
                    label={fieldName}
                    checked={section.fields.includes(fieldName)}
                    onChange={checked => toggleField(idx, fieldName, checked)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <Button
        variant="secondary"
        icon={<Plus size={16} />}
        onClick={addSection}
        style={{ alignSelf: 'flex-start' }}
      >
        Add Section
      </Button>
    </div>
  )
}
