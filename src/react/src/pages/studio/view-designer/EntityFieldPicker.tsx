import { useState, useMemo } from 'react'
import { SearchInput, Spinner } from '../../../design-system'
import { useEntityFields } from '../../../hooks/useViewStudio'
import { useCanvasStore } from './useCanvasStore'
import type { EntityFieldDef } from '../../../types/viewStudio'
import {
  Type, Hash, Calendar, ToggleLeft, ChevronDown,
  Link, FileText, AlertCircle,
} from 'lucide-react'

// ─── Field type → component code mapping ─────────────────────────────────────

export const FIELD_TYPE_TO_COMPONENT: Record<string, string> = {
  text:        'text_input',
  string:      'text_input',
  varchar:     'text_input',
  char:        'text_input',
  number:      'number_input',
  integer:     'number_input',
  int:         'number_input',
  decimal:     'number_input',
  float:       'number_input',
  numeric:     'number_input',
  date:        'date_picker',
  datetime:    'date_picker',
  timestamp:   'date_picker',
  boolean:     'checkbox',
  bool:        'checkbox',
  select:      'dropdown_select',
  enum:        'dropdown_select',
  reference:   'reference_select',
  lookup:      'reference_select',
  relation:    'reference_select',
  textarea:    'textarea',
  text_long:   'textarea',
  longtext:    'textarea',
}

function getFieldIcon(fieldType: string, isRelation: boolean) {
  if (isRelation) return Link
  switch (fieldType) {
    case 'number': case 'integer': case 'decimal': case 'float': case 'numeric':
      return Hash
    case 'date': case 'datetime': case 'timestamp':
      return Calendar
    case 'boolean': case 'bool':
      return ToggleLeft
    case 'select': case 'enum':
      return ChevronDown
    case 'textarea': case 'text_long': case 'longtext':
      return FileText
    default:
      return Type
  }
}

// ─── Exported drag data shape ─────────────────────────────────────────────────

export interface FieldDragData {
  field_key: string
  label: string
  field_type: string
  required: boolean
}

// ─── EntityFieldPicker ────────────────────────────────────────────────────────

export function EntityFieldPicker() {
  const primaryEntity = useCanvasStore(s => s.primaryEntity)
  const { data, isLoading, isError } = useEntityFields(primaryEntity)
  const [search, setSearch] = useState('')

  const fields = useMemo<EntityFieldDef[]>(() => {
    const items = data?.items ?? []
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(f =>
      f.label.toLowerCase().includes(q) || f.field_key.toLowerCase().includes(q)
    )
  }, [data?.items, search])

  if (!primaryEntity) {
    return (
      <div className="efp-empty" data-testid="entity-field-picker">
        <AlertCircle size={20} />
        <p>No primary entity</p>
        <small>This view has no entity assigned</small>
      </div>
    )
  }

  return (
    <div className="efp-panel" data-testid="entity-field-picker">
      <div className="efp-search">
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search fields..."
        />
      </div>

      {isLoading && (
        <div className="efp-empty">
          <Spinner size={18} />
        </div>
      )}

      {isError && (
        <div className="efp-empty">
          <AlertCircle size={20} />
          <p>Failed to load fields</p>
        </div>
      )}

      {!isLoading && !isError && fields.length === 0 && (
        <div className="efp-empty">
          <p>{search ? 'No fields match' : 'No fields available'}</p>
        </div>
      )}

      {!isLoading && !isError && fields.length > 0 && (
        <div className="efp-list">
          {fields.map(field => {
            const Icon = getFieldIcon(field.field_type, field.is_relation)
            const dragData: FieldDragData = {
              field_key: field.field_key,
              label: field.label,
              field_type: field.field_type,
              required: field.required,
            }
            return (
              <div
                key={field.field_key}
                className="efp-field"
                draggable
                data-testid={`efp-field-${field.field_key}`}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-entity-field', JSON.stringify(dragData))
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                title={`${field.label} (${field.field_type})${field.required ? ' · required' : ''}`}
              >
                <Icon size={13} className="efp-field__icon" />
                <span className="efp-field__name">{field.label}</span>
                <span className="efp-field__type">{field.field_type}</span>
                {field.required && <span className="efp-required">req</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
