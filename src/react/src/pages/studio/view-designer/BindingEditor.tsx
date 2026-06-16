/**
 * BindingEditor — Interactive field binding configuration panel
 *
 * Allows users to bind component properties to:
 * - Entity fields (field)
 * - Computed expressions (computed)
 * - Static values (static)
 * - JSONata expressions (expression)
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, Link2 } from 'lucide-react'
import { Button } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'
import { useEntityFields } from '../../../hooks/useViewStudio'
import type { FieldBinding, ComponentRegistryEntry } from '../../../types/viewStudio'

// ─── Types ───────────────────────────────────────────────────────────────────

type BindingSource = FieldBinding['source']

const SOURCE_OPTIONS: { value: BindingSource; label: string }[] = [
  { value: 'field', label: 'Entity Field' },
  { value: 'computed', label: 'Computed' },
  { value: 'static', label: 'Static Value' },
  { value: 'expression', label: 'Expression' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function BindingEditor({ registryEntry }: { registryEntry?: ComponentRegistryEntry | null }) {
  const { selectedKey, getNode, primaryEntity } = useCanvasStore()
  const updateNodeBindings = useCanvasStore(s => s.updateNodeBindings)
  const node = selectedKey ? getNode(selectedKey) : null

  const [addingProp, setAddingProp] = useState<string | null>(null)

  const { data: fieldsData } = useEntityFields(primaryEntity)
  const entityFields = fieldsData?.items?.map(f => f.field_key) ?? []

  if (!node) return null

  const bindings = node.bindings ?? {}
  const bindableProps = registryEntry?.supported_bindings ?? []
  const unboundProps = bindableProps.filter(p => !bindings[p])

  const handleUpdateBinding = useCallback((prop: string, binding: FieldBinding) => {
    if (!selectedKey) return
    const newBindings = { ...bindings, [prop]: binding }
    updateNodeBindings(selectedKey, newBindings)
  }, [selectedKey, bindings, updateNodeBindings])

  const handleRemoveBinding = useCallback((prop: string) => {
    if (!selectedKey) return
    const newBindings = { ...bindings }
    delete newBindings[prop]
    updateNodeBindings(selectedKey, newBindings)
  }, [selectedKey, bindings, updateNodeBindings])

  const handleAddBinding = useCallback((prop: string) => {
    if (!selectedKey) return
    const newBinding: FieldBinding = { source: 'field', field_key: '' }
    const newBindings = { ...bindings, [prop]: newBinding }
    updateNodeBindings(selectedKey, newBindings)
    setAddingProp(null)
  }, [selectedKey, bindings, updateNodeBindings])

  return (
    <div className="pp-section">
      <div className="pp-section__title">
        <Link2 size={14} style={{ marginRight: 4 }} />
        Field Bindings
      </div>

      {/* Existing bindings */}
      {Object.entries(bindings).length === 0 && unboundProps.length === 0 && (
        <p className="pp-empty-msg">
          This component does not support data bindings.
        </p>
      )}

      {Object.entries(bindings).length === 0 && unboundProps.length > 0 && (
        <p className="pp-empty-msg">
          No bindings configured. Add one to connect this component to entity data.
        </p>
      )}

      {Object.entries(bindings).map(([prop, binding]) => (
        <BindingRow
          key={prop}
          prop={prop}
          binding={binding as FieldBinding}
          entityFields={entityFields}
          onUpdate={(b) => handleUpdateBinding(prop, b)}
          onRemove={() => handleRemoveBinding(prop)}
        />
      ))}

      {/* Add binding */}
      {unboundProps.length > 0 && (
        <div className="be-add">
          {addingProp === null ? (
            <Button variant="ghost" size="sm" onClick={() => setAddingProp('')}>
              <Plus size={12} /> Add Binding
            </Button>
          ) : (
            <div className="be-add__form">
              <select
                className="pp-field__input"
                value={addingProp}
                onChange={e => setAddingProp(e.target.value)}
              >
                <option value="">Select property…</option>
                {unboundProps.map(p => (
                  <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addingProp && handleAddBinding(addingProp)}
                disabled={!addingProp}
              >
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAddingProp(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Binding Row ─────────────────────────────────────────────────────────────

function BindingRow({
  prop,
  binding,
  entityFields,
  onUpdate,
  onRemove,
}: {
  prop: string
  binding: FieldBinding
  entityFields: string[]
  onUpdate: (b: FieldBinding) => void
  onRemove: () => void
}) {
  return (
    <div className="be-row">
      <div className="be-row__header">
        <span className="be-row__prop">{prop.replace(/_/g, ' ')}</span>
        <Button variant="ghost" size="sm" onClick={onRemove} title="Remove binding">
          <Trash2 size={12} />
        </Button>
      </div>

      {/* Source selector */}
      <div className="pp-field">
        <label className="pp-field__label">Source</label>
        <select
          className="pp-field__input"
          value={binding.source}
          onChange={e => onUpdate({ ...binding, source: e.target.value as BindingSource })}
        >
          {SOURCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Source-specific fields */}
      {binding.source === 'field' && (
        <FieldSourceInputs binding={binding} entityFields={entityFields} onUpdate={onUpdate} />
      )}
      {binding.source === 'computed' && (
        <ComputedSourceInputs binding={binding} onUpdate={onUpdate} />
      )}
      {binding.source === 'static' && (
        <StaticSourceInputs binding={binding} onUpdate={onUpdate} />
      )}
      {binding.source === 'expression' && (
        <ExpressionSourceInputs binding={binding} onUpdate={onUpdate} />
      )}
    </div>
  )
}

// ─── Source Input Variants ───────────────────────────────────────────────────

function FieldSourceInputs({ binding, entityFields, onUpdate }: { binding: FieldBinding; entityFields: string[]; onUpdate: (b: FieldBinding) => void }) {
  return (
    <>
      <div className="pp-field">
        <label className="pp-field__label">Entity</label>
        <input
          type="text"
          className="pp-field__input"
          value={binding.entity ?? ''}
          onChange={e => onUpdate({ ...binding, entity: e.target.value || undefined })}
          placeholder="e.g., customer"
        />
      </div>
      <div className="pp-field">
        <label className="pp-field__label">Field Key</label>
        {entityFields.length > 0 ? (
          <select
            className="pp-field__input"
            value={binding.field_key ?? ''}
            onChange={e => onUpdate({ ...binding, field_key: e.target.value || undefined })}
          >
            <option value="">Select field…</option>
            {entityFields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        ) : (
          <input
            type="text"
            className="pp-field__input"
            value={binding.field_key ?? ''}
            onChange={e => onUpdate({ ...binding, field_key: e.target.value || undefined })}
            placeholder="e.g., first_name"
          />
        )}
      </div>
    </>
  )
}

function ComputedSourceInputs({ binding, onUpdate }: { binding: FieldBinding; onUpdate: (b: FieldBinding) => void }) {
  return (
    <div className="pp-field">
      <label className="pp-field__label">Expression</label>
      <textarea
        className="pp-field__input pp-field__textarea"
        rows={2}
        value={binding.expression ?? ''}
        onChange={e => onUpdate({ ...binding, expression: e.target.value || undefined })}
        placeholder="JSONata expression…"
      />
    </div>
  )
}

function StaticSourceInputs({ binding, onUpdate }: { binding: FieldBinding; onUpdate: (b: FieldBinding) => void }) {
  const val = binding.static_value
  const strVal = val === undefined || val === null ? '' : String(val)

  return (
    <div className="pp-field">
      <label className="pp-field__label">Value</label>
      <input
        type="text"
        className="pp-field__input"
        value={strVal}
        onChange={e => {
          const raw = e.target.value
          // Try to parse as number or boolean
          let parsed: unknown = raw
          if (raw === 'true') parsed = true
          else if (raw === 'false') parsed = false
          else if (raw !== '' && !isNaN(Number(raw))) parsed = Number(raw)
          onUpdate({ ...binding, static_value: raw === '' ? undefined : parsed })
        }}
        placeholder="Static value"
      />
    </div>
  )
}

function ExpressionSourceInputs({ binding, onUpdate }: { binding: FieldBinding; onUpdate: (b: FieldBinding) => void }) {
  return (
    <div className="pp-field">
      <label className="pp-field__label">JSONata Expression</label>
      <textarea
        className="pp-field__input pp-field__textarea"
        rows={3}
        value={binding.expression ?? ''}
        onChange={e => onUpdate({ ...binding, expression: e.target.value || undefined })}
        placeholder="$sum(line_items.amount)"
      />
    </div>
  )
}
