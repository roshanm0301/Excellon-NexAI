/**
 * BindingEditor — Interactive field binding configuration panel
 *
 * Allows users to bind component properties to:
 * - Entity fields (field) — dropdown shows label (field_key) + type badge
 * - Computed expressions (computed) — Monaco editor
 * - Static values (static) — text input with auto-parse
 * - JSONata expressions (expression) — Monaco editor
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, Link2 } from 'lucide-react'
import { Button } from '../../../design-system'
import { ExpressionEditor } from '../../../components/expression/ExpressionEditor'
import { useCanvasStore } from './useCanvasStore'
import { useEntityFields, useEntityTypes } from '../../../hooks/useViewStudio'
import type { FieldBinding, ComponentRegistryEntry, EntityFieldDef } from '../../../types/viewStudio'

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
  const entityFieldDefs: EntityFieldDef[] = fieldsData?.items ?? []

  const { data: entityTypesData } = useEntityTypes()
  const entityTypes: string[] = (entityTypesData?.items ?? []).map(
    (e: { entity_type: string }) => e.entity_type
  )

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
    <div className="pp-section" data-testid="binding-editor">
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
          entityFieldDefs={entityFieldDefs}
          entityTypes={entityTypes}
          primaryEntity={primaryEntity}
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
  entityFieldDefs,
  entityTypes,
  primaryEntity,
  onUpdate,
  onRemove,
}: {
  prop: string
  binding: FieldBinding
  entityFieldDefs: EntityFieldDef[]
  entityTypes: string[]
  primaryEntity: string | null
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
        <FieldSourceInputs
          binding={binding}
          entityFieldDefs={entityFieldDefs}
          entityTypes={entityTypes}
          primaryEntity={primaryEntity}
          onUpdate={onUpdate}
        />
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

function FieldSourceInputs({
  binding,
  entityFieldDefs,
  entityTypes,
  primaryEntity,
  onUpdate,
}: {
  binding: FieldBinding
  entityFieldDefs: EntityFieldDef[]
  entityTypes: string[]
  primaryEntity: string | null
  onUpdate: (b: FieldBinding) => void
}) {
  const [overrideOpen, setOverrideOpen] = useState(!!binding.entity)

  const selectedFieldDef = entityFieldDefs.find(f => f.field_key === binding.field_key)

  const handleToggleOverride = () => {
    if (overrideOpen) {
      // Collapsing: clear entity override
      onUpdate({ ...binding, entity: undefined })
    }
    setOverrideOpen(v => !v)
  }

  return (
    <>
      {/* Entity — collapsed by default; shows primary entity as a hint */}
      <div className="pp-field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <label className="pp-field__label" style={{ marginBottom: 0 }}>Entity</label>
          <button
            type="button"
            style={{
              fontSize: '0.68rem',
              color: 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 2px',
              textDecoration: 'underline',
            }}
            onClick={handleToggleOverride}
          >
            {overrideOpen ? '✕ Use primary' : `Override →`}
          </button>
        </div>
        {overrideOpen ? (
          <select
            className="pp-field__input"
            value={binding.entity ?? ''}
            onChange={e => onUpdate({ ...binding, entity: e.target.value || undefined })}
            data-testid="binding-entity-select"
          >
            <option value="">Primary ({primaryEntity ?? 'entity'})</option>
            {entityTypes.map(et => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
        ) : (
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            Primary: {binding.entity ?? primaryEntity ?? '—'}
          </p>
        )}
      </div>

      {/* Field key — shows label + field_key + relation indicator */}
      <div className="pp-field">
        <label className="pp-field__label">Field</label>
        {entityFieldDefs.length > 0 ? (
          <select
            className="pp-field__input"
            value={binding.field_key ?? ''}
            onChange={e => onUpdate({ ...binding, field_key: e.target.value || undefined })}
            data-testid="binding-field-select"
          >
            <option value="">Select field…</option>
            {entityFieldDefs.map(f => (
              <option key={f.field_key} value={f.field_key}>
                {f.label} ({f.field_key}){f.is_relation ? ' · relation' : ''}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="pp-field__input"
            value={binding.field_key ?? ''}
            onChange={e => onUpdate({ ...binding, field_key: e.target.value || undefined })}
            placeholder="e.g., first_name"
            data-testid="binding-field-input"
          />
        )}
        {/* Field type badge */}
        {selectedFieldDef && (
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: 2, display: 'block' }}>
            {selectedFieldDef.field_type}
            {selectedFieldDef.read_only ? ' · computed' : ''}
            {selectedFieldDef.is_relation && selectedFieldDef.related_entity
              ? ` → ${selectedFieldDef.related_entity}`
              : ''}
          </span>
        )}
      </div>
    </>
  )
}

function ComputedSourceInputs({ binding, onUpdate }: { binding: FieldBinding; onUpdate: (b: FieldBinding) => void }) {
  return (
    <div className="pp-field pp-field--full">
      <label className="pp-field__label">JSONata Expression</label>
      <ExpressionEditor
        value={binding.expression ?? ''}
        onChange={v => onUpdate({ ...binding, expression: v || undefined })}
        height="80px"
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
          let parsed: unknown = raw
          if (raw === 'true') parsed = true
          else if (raw === 'false') parsed = false
          else if (raw !== '' && !isNaN(Number(raw))) parsed = Number(raw)
          onUpdate({ ...binding, static_value: raw === '' ? undefined : parsed })
        }}
        placeholder="Static value (string, number, or true/false)"
        data-testid="binding-static-input"
      />
    </div>
  )
}

function ExpressionSourceInputs({ binding, onUpdate }: { binding: FieldBinding; onUpdate: (b: FieldBinding) => void }) {
  return (
    <div className="pp-field pp-field--full">
      <label className="pp-field__label">JSONata Expression</label>
      <ExpressionEditor
        value={binding.expression ?? ''}
        onChange={v => onUpdate({ ...binding, expression: v || undefined })}
        height="80px"
      />
    </div>
  )
}
