import { Trash2, Plus } from 'lucide-react'
import { AccordionRow, Button, IconButton, Input, Select, Badge } from '../../../design-system'

export interface Relationship {
  id: string
  type: 'has_many' | 'belongs_to'
  targetEntity: string
  foreignKey: string
  label: string
}

interface RelationshipBuilderProps {
  relationships: Relationship[]
  onChange: (r: Relationship[]) => void
}

const TYPE_OPTIONS = [
  { value: 'has_many', label: 'Has Many' },
  { value: 'belongs_to', label: 'Belongs To' },
]

export function RelationshipBuilder({ relationships, onChange }: RelationshipBuilderProps) {
  const add = () => {
    onChange([...relationships, {
      id: crypto.randomUUID(),
      type: 'has_many',
      targetEntity: '',
      foreignKey: '',
      label: '',
    }])
  }

  const remove = (idx: number) => {
    onChange(relationships.filter((_, i) => i !== idx))
  }

  const update = (idx: number, patch: Partial<Relationship>) => {
    onChange(relationships.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {relationships.map((rel, idx) => (
        <AccordionRow
          key={rel.id}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge variant={rel.type === 'has_many' ? 'brand' : 'purple'} dot={false}>
                {rel.type === 'has_many' ? 'has_many' : 'belongs_to'}
              </Badge>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>
                {rel.targetEntity || <em style={{ color: 'var(--fg-tertiary)' }}>no target</em>}
              </span>
            </div>
          }
          right={
            <IconButton
              onClick={e => { e.stopPropagation(); remove(idx) }}
              title="Delete relationship"
              style={{ width: 28, height: 28, color: 'var(--error-500)' }}
            >
              <Trash2 size={14} />
            </IconButton>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Type"
              value={rel.type}
              onChange={e => update(idx, { type: e.target.value as Relationship['type'] })}
              options={TYPE_OPTIONS}
            />
            <Input
              label="Target Entity"
              value={rel.targetEntity}
              onChange={e => update(idx, { targetEntity: e.target.value })}
              placeholder="e.g. order_line_item"
            />
            <Input
              label="Foreign Key"
              value={rel.foreignKey}
              onChange={e => update(idx, { foreignKey: e.target.value })}
              placeholder="e.g. order_id"
            />
            <Input
              label="Label"
              value={rel.label}
              onChange={e => update(idx, { label: e.target.value })}
              placeholder="e.g. Line Items"
            />
          </div>
        </AccordionRow>
      ))}

      <Button
        variant="secondary"
        icon={<Plus size={16} />}
        onClick={add}
        style={{ alignSelf: 'flex-start', marginTop: 4 }}
      >
        Add Relationship
      </Button>
    </div>
  )
}
