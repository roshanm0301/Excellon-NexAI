import { useState, useCallback } from 'react'
import { Trash2, MousePointer2, Plus, X } from 'lucide-react'
import { Button, AccordionRow } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'
import { useComponentRegistry } from '../../../hooks/useViewStudio'
import { ExpressionEditor } from '../../../components/expression/ExpressionEditor'
import { BindingEditor } from './BindingEditor'
import { EventEditor } from './EventEditor'
import { VisibilityRuleBuilder } from './VisibilityRuleBuilder'
import { PermissionEditor } from './PermissionEditor'
import type { ComponentNode, SchemaGroup } from '../../../types/viewStudio'
import { ICON_NAMES } from '../../../lib/iconRegistry'

function countNodes(node: ComponentNode | undefined | null): number {
  if (!node) return 0
  return 1 + (node.children ?? []).reduce((acc, c) => acc + countNodes(c), 0)
}

export function PropertyPanel() {
  const {
    selectedKey, getNode, updateNodeProps, removeNode, panelMode, setPanelMode, payload,
  } = useCanvasStore()
  const { data: registry } = useComponentRegistry()

  // ALL hooks must be called unconditionally — before any conditional return
  const node = selectedKey ? getNode(selectedKey) : null
  const registryEntry = node ? (registry ?? []).find(c => c.component_code === node.component_code) : undefined
  const configSchema = registryEntry?.config_schema as { properties?: Record<string, SchemaProperty>; required?: string[] } | undefined
  const properties = configSchema?.properties ?? {}

  const handlePropChange = useCallback((key: string, value: unknown) => {
    if (!selectedKey) return
    updateNodeProps(selectedKey, { [key]: value })
  }, [selectedKey, updateNodeProps])

  const handleDelete = useCallback(() => {
    if (!selectedKey || !node || node.component_code === 'page_root') return
    removeNode(selectedKey)
  }, [selectedKey, node, removeNode])

  // Conditional render after all hooks — empty state when nothing selected
  if (!node) {
    const total = countNodes(payload?.component_tree) - 1 // subtract page_root itself
    return (
      <div className="pp-empty-state" data-testid="property-panel-empty">
        <div className="pp-empty-state__icon">
          <MousePointer2 size={24} />
        </div>
        <p className="pp-empty-state__title">No component selected</p>
        <p className="pp-empty-state__hint">Click a component in the canvas to inspect its properties</p>
        {total > 0 && (
          <span className="pp-empty-state__count">{total} component{total !== 1 ? 's' : ''}</span>
        )}
      </div>
    )
  }

  return (
    <div className="pp-panel" data-testid="property-panel">
      {/* Header */}
      <div className="pp-panel__header">
        <div>
          <div className="pp-panel__title">{node.label || node.component_code}</div>
          <div className="pp-panel__code">{node.component_key}</div>
        </div>
        {node.component_code !== 'page_root' && (
          <Button variant="ghost" size="sm" onClick={handleDelete} title="Delete component">
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="pp-tabs">
        <div
          className={`pp-tab ${panelMode === 'properties' ? 'pp-tab--active' : ''}`}
          onClick={() => setPanelMode('properties')}
        >
          Properties
        </div>
        <div
          className={`pp-tab ${panelMode === 'bindings' ? 'pp-tab--active' : ''}`}
          onClick={() => setPanelMode('bindings')}
        >
          {(() => {
            const count = Object.keys(node.bindings ?? {}).length
            return count > 0 ? `Bindings (${count})` : 'Bindings'
          })()}
        </div>
        <div
          className={`pp-tab ${panelMode === 'events' ? 'pp-tab--active' : ''}`}
          onClick={() => setPanelMode('events')}
        >
          {(() => {
            const count = (payload?.events ?? []).filter(e => e.source_field === selectedKey).length
            return count > 0 ? `Events (${count})` : 'Events'
          })()}
        </div>
        <div
          className={`pp-tab ${panelMode === 'visibility' ? 'pp-tab--active' : ''}`}
          onClick={() => setPanelMode('visibility')}
        >
          Visibility
        </div>
        <div
          className={`pp-tab ${panelMode === 'permissions' ? 'pp-tab--active' : ''}`}
          onClick={() => setPanelMode('permissions')}
        >
          Permissions
        </div>
      </div>

      {/* Content */}
      {panelMode === 'properties' && (
        <PropertiesTab
          properties={properties}
          currentProps={node.props ?? {}}
          onChange={handlePropChange}
          configSchema={configSchema}
        />
      )}
      {panelMode === 'bindings' && (
        <BindingEditor registryEntry={registryEntry} />
      )}
      {panelMode === 'events' && (
        <EventEditor registryEntry={registryEntry} />
      )}
      {panelMode === 'visibility' && (
        <VisibilityRuleBuilder />
      )}
      {panelMode === 'permissions' && (
        <PermissionEditor />
      )}
    </div>
  )
}

// ─── Schema Types ────────────────────────────────────────────────────────────

interface SchemaProperty {
  type: string
  title?: string       // human-readable field label (takes priority over key-derived label)
  enum?: string[]
  minimum?: number
  maximum?: number
  items?: { type: string; enum?: string[]; properties?: Record<string, unknown> }
  description?: string
  required?: boolean   // per-property required flag (mirrors x-required from validator)
  pattern?: string     // HTML pattern attribute for text inputs
  showWhen?: {         // conditional visibility
    prop: string
    value?: unknown    // show when currentProps[prop] === value
    not?: unknown      // show when currentProps[prop] !== not
  }
}

// ─── Properties Tab ──────────────────────────────────────────────────────────

// ── showWhen condition evaluator ─────────────────────────────────────────────

function isFieldVisible(fieldSchema: SchemaProperty, currentProps: Record<string, unknown>): boolean {
  const sw = fieldSchema.showWhen
  if (!sw) return true
  const actual = currentProps[sw.prop]
  if ('value' in sw) return actual === sw.value
  if ('not'   in sw) return actual !== sw.not && actual != null && actual !== '' && actual !== undefined
  return true
}

// ── PropertiesTab ─────────────────────────────────────────────────────────────

function PropertiesTab({
  properties,
  currentProps,
  onChange,
  configSchema,
}: {
  properties: Record<string, SchemaProperty>
  currentProps: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  configSchema?: { required?: string[]; groups?: SchemaGroup[] }
}) {
  if (Object.keys(properties).length === 0) {
    return <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '8px 0' }}>No configurable properties.</p>
  }

  const topLevelRequired = new Set(configSchema?.required ?? [])
  const groups = configSchema?.groups

  function renderField(key: string, schema: SchemaProperty) {
    if (!isFieldVisible(schema, currentProps)) return null
    return (
      <PropertyField
        key={key}
        name={key}
        schema={{ ...schema, required: schema.required || topLevelRequired.has(key) }}
        value={currentProps[key]}
        onChange={(v) => onChange(key, v)}
      />
    )
  }

  // ── Grouped rendering ─────────────────────────────────────────────────────
  if (groups?.length) {
    // Collect any property keys not in any group (safety net)
    const groupedKeys = new Set(groups.flatMap(g => g.keys))
    const ungroupedKeys = Object.keys(properties).filter(k => !groupedKeys.has(k))

    return (
      <div className="pp-compact-accordion" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 0' }}>
        {groups.map((group, gi) => {
          const visibleFields = group.keys
            .filter(key => properties[key])
            .map(key => renderField(key, properties[key]))
            .filter(Boolean)

          if (visibleFields.length === 0) return null
          return (
            <AccordionRow key={group.id} title={group.label} defaultOpen={gi === 0}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                {visibleFields}
              </div>
            </AccordionRow>
          )
        })}
        {/* Ungrouped fallback */}
        {ungroupedKeys.length > 0 && (
          <AccordionRow title="Other" defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
              {ungroupedKeys.map(key => renderField(key, properties[key]))}
            </div>
          </AccordionRow>
        )}
      </div>
    )
  }

  // ── Flat rendering (components without groups) ────────────────────────────
  return (
    <div className="pp-section">
      <div className="pp-section__title">Configuration</div>
      {Object.entries(properties).map(([key, schema]) => renderField(key, schema))}
    </div>
  )
}

// Icon names are sourced from the shared registry so ButtonRenderer and the
// icon picker always reference exactly the same set of available icons.

function PropertyField({
  name,
  schema,
  value,
  onChange,
}: {
  name: string
  schema: SchemaProperty
  value: unknown
  onChange: (v: unknown) => void
}) {
  // Prefer explicit title from schema; fall back to formatting the key name
  const label = (schema as SchemaProperty & { title?: string }).title ?? name.replace(/_/g, ' ')
  const requiredMark = schema.required
    ? <span style={{ color: 'var(--error-fg, #ef4444)', marginLeft: 2 }} title="Required">*</span>
    : null

  return renderFieldContent(name, schema, label, requiredMark, value, onChange)
}

function renderFieldContent(
  name: string,
  schema: SchemaProperty,
  label: string,
  requiredMark: React.ReactNode,
  value: unknown,
  onChange: (v: unknown) => void,
): React.ReactElement {

  // ── columns_array → ColumnArrayEditor ───────────────────────────────────
  if (schema.type === 'columns_array') {
    return (
      <div className="pp-field pp-field--full">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <ColumnArrayEditor
          value={value as ColumnDef[] | undefined}
          onChange={onChange}
        />
      </div>
    )
  }

  // ── string_array → StringArrayEditor ────────────────────────────────────
  if (schema.type === 'string_array') {
    return (
      <div className="pp-field pp-field--full">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <StringArrayEditor
          value={value as string[] | undefined}
          onChange={onChange}
        />
      </div>
    )
  }

  // ── object → ObjectEditor (key-value pairs, e.g. status_map) ─────────────
  if (schema.type === 'object') {
    return (
      <div className="pp-field pp-field--full">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <ObjectEditor
          value={value as Record<string, string> | undefined}
          onChange={onChange}
          valuePlaceholder={schema.description ?? 'value'}
        />
      </div>
    )
  }

  // ── structured_array → StructuredArrayEditor (array of objects) ───────────
  if (schema.type === 'structured_array') {
    const subProps = schema.items
      ? (schema.items.properties
          ? Object.keys(schema.items.properties)
          : Object.keys(schema.items as Record<string, unknown>))
      : ['label', 'value']
    return (
      <div className="pp-field pp-field--full">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <StructuredArrayEditor
          value={value as Array<Record<string, string>> | undefined}
          fields={subProps}
          onChange={onChange}
        />
      </div>
    )
  }

  // ── array (generic) → StringArrayEditor or StructuredArrayEditor ──────────
  if (schema.type === 'array') {
    // If items has nested properties, use StructuredArrayEditor
    if (schema.items && typeof schema.items === 'object' && schema.items.properties) {
      const subProps = Object.keys(schema.items.properties)
      return (
        <div className="pp-field pp-field--full">
          <label className="pp-field__label">{label}{requiredMark}</label>
          <StructuredArrayEditor
            value={value as Array<Record<string, string>> | undefined}
            fields={subProps.length > 0 ? subProps : ['label', 'value']}
            onChange={onChange}
          />
        </div>
      )
    }
    // Otherwise use StringArrayEditor for simple string lists
    return (
      <div className="pp-field pp-field--full">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <StringArrayEditor
          value={value as string[] | undefined}
          onChange={onChange}
        />
      </div>
    )
  }

  // ── date → date input ─────────────────────────────────────────────────────
  if (schema.type === 'date') {
    return (
      <div className="pp-field">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <input
          type="date"
          className="pp-field__input"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value || undefined)}
          data-testid={`prop-${name}`}
        />
      </div>
    )
  }

  // ── color → color picker + hex input ─────────────────────────────────────
  if (schema.type === 'color') {
    const colorVal = (value as string) || '#000000'
    return (
      <div className="pp-field">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="color"
            value={colorVal.startsWith('#') ? colorVal : '#000000'}
            onChange={e => onChange(e.target.value)}
            data-testid={`prop-${name}-swatch`}
            style={{ width: 36, height: 28, padding: 2, border: '1px solid var(--border-primary)', borderRadius: 4, cursor: 'pointer', background: 'none' }}
          />
          <input
            type="text"
            className="pp-field__input"
            value={(value as string) ?? ''}
            onChange={e => onChange(e.target.value || undefined)}
            placeholder="#000000"
            data-testid={`prop-${name}`}
            style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}
          />
        </div>
      </div>
    )
  }

  // ── expression → Monaco expression editor ────────────────────────────────
  if (schema.type === 'expression') {
    return (
      <div className="pp-field pp-field--full">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <ExpressionEditor
          value={(value as string) || ''}
          onChange={v => onChange(v || undefined)}
          height="80px"
        />
      </div>
    )
  }

  // ── icon → icon name picker ───────────────────────────────────────────────
  if (schema.type === 'icon') {
    return (
      <div className="pp-field">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <select
          className="pp-field__input"
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value || undefined)}
          data-testid={`prop-${name}`}
        >
          <option value="">— No icon —</option>
          {ICON_NAMES.map(icon => (
            <option key={icon} value={icon}>{icon}</option>
          ))}
        </select>
      </div>
    )
  }

  // ── enum → select ────────────────────────────────────────────────────────
  if (schema.enum) {
    return (
      <div className="pp-field">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <select
          className="pp-field__input"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value || undefined)}
          data-testid={`prop-${name}`}
        >
          <option value="">—</option>
          {schema.enum.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  // ── boolean → checkbox ───────────────────────────────────────────────────
  if (schema.type === 'boolean') {
    return (
      <div className="pp-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          id={`prop-${name}`}
          data-testid={`prop-${name}`}
        />
        <label htmlFor={`prop-${name}`} className="pp-field__label" style={{ marginBottom: 0 }}>
          {label}{requiredMark}
        </label>
      </div>
    )
  }

  // ── integer / number ─────────────────────────────────────────────────────
  if (schema.type === 'integer' || schema.type === 'number') {
    return (
      <div className="pp-field">
        <label className="pp-field__label">{label}{requiredMark}</label>
        <input
          type="number"
          className="pp-field__input"
          value={(value as number) ?? ''}
          min={schema.minimum}
          max={schema.maximum}
          onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          data-testid={`prop-${name}`}
        />
      </div>
    )
  }

  // ── Default: string input ────────────────────────────────────────────────
  return (
    <div className="pp-field">
      <label className="pp-field__label">{label}{requiredMark}</label>
      <input
        type="text"
        className="pp-field__input"
        value={(value as string) ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
        data-testid={`prop-${name}`}
        pattern={schema.pattern}
        title={schema.pattern ? `Must match pattern: ${schema.pattern}` : undefined}
      />
    </div>
  )
}

// ─── Object Editor (key → value map, e.g. status_map) ───────────────────────

function ObjectEditor({
  value,
  onChange,
  valuePlaceholder = 'value',
}: {
  value: Record<string, string> | undefined
  onChange: (v: unknown) => void
  valuePlaceholder?: string
}) {
  const entries = Object.entries(value ?? {})

  function updateEntry(oldKey: string, newKey: string, val: string) {
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(value ?? {})) {
      if (k === oldKey) next[newKey] = val
      else next[k] = v
    }
    onChange(Object.keys(next).length ? next : undefined)
  }

  function removeEntry(key: string) {
    const next = { ...(value ?? {}) }
    delete next[key]
    onChange(Object.keys(next).length ? next : undefined)
  }

  function addEntry() {
    onChange({ ...(value ?? {}), '': '' })
  }

  return (
    <div className="pp-obj-editor" data-testid="object-editor">
      {entries.length === 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--fg-tertiary)', marginBottom: 6 }}>No entries.</p>
      )}
      {entries.map(([k, v], i) => (
        <div key={i} className="pp-obj-row" data-testid={`obj-row-${i}`}>
          <input
            className="pp-field__input pp-obj-row__key"
            placeholder="key"
            value={k}
            onChange={e => updateEntry(k, e.target.value, v)}
            data-testid={`obj-key-${i}`}
          />
          <span style={{ color: 'var(--fg-tertiary)', fontSize: '0.72rem' }}>→</span>
          <input
            className="pp-field__input pp-obj-row__val"
            placeholder={valuePlaceholder}
            value={v}
            onChange={e => updateEntry(k, k, e.target.value)}
            data-testid={`obj-val-${i}`}
          />
          <button
            className="pp-col-row__delete"
            onClick={() => removeEntry(k)}
            title="Remove entry"
            data-testid={`obj-delete-${i}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button className="pp-col-add" onClick={addEntry} data-testid="obj-add">
        <Plus size={13} /> Add Entry
      </button>
    </div>
  )
}

// ─── Structured Array Editor (array of objects) ───────────────────────────────

function StructuredArrayEditor({
  value,
  fields,
  onChange,
}: {
  value: Array<Record<string, string>> | undefined
  fields: string[]
  onChange: (v: unknown) => void
}) {
  const rows = value ?? []

  function updateRow(i: number, field: string, val: string) {
    const next = rows.map((r, ri) => ri === i ? { ...r, [field]: val } : r)
    onChange(next.length ? next : undefined)
  }

  function removeRow(i: number) {
    const next = rows.filter((_, ri) => ri !== i)
    onChange(next.length ? next : undefined)
  }

  function addRow() {
    const empty: Record<string, string> = {}
    fields.forEach(f => { empty[f] = '' })
    onChange([...rows, empty])
  }

  return (
    <div className="pp-col-editor" data-testid="structured-array-editor">
      {rows.length === 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--fg-tertiary)', marginBottom: 6 }}>No items.</p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="pp-col-row" data-testid={`sarr-row-${i}`}>
          <div className="pp-col-row__fields" style={{ flex: 1 }}>
            {fields.slice(0, 3).map(f => (
              <input
                key={f}
                className="pp-field__input pp-col-row__key"
                placeholder={f}
                value={row[f] ?? ''}
                onChange={e => updateRow(i, f, e.target.value)}
              />
            ))}
          </div>
          <button
            className="pp-col-row__delete"
            onClick={() => removeRow(i)}
            title="Remove"
            data-testid={`sarr-delete-${i}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button className="pp-col-add" onClick={addRow} data-testid="sarr-add">
        <Plus size={13} /> Add Item
      </button>
    </div>
  )
}

// ─── Column Array Editor ─────────────────────────────────────────────────────

interface ColumnDef {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  type?: string
}

const COLUMN_TYPES = ['string', 'boolean', 'number', 'date']

function ColumnArrayEditor({
  value,
  onChange,
}: {
  value: ColumnDef[] | undefined
  onChange: (v: unknown) => void
}) {
  const cols: ColumnDef[] = value ?? []

  function updateCol(i: number, patch: Partial<ColumnDef>) {
    const next = cols.map((c, idx) => idx === i ? { ...c, ...patch } : c)
    onChange(next)
  }

  function addCol() {
    onChange([...cols, { key: '', label: '', sortable: true, filterable: true, type: 'string' }])
  }

  function removeCol(i: number) {
    onChange(cols.filter((_, idx) => idx !== i))
  }

  return (
    <div className="pp-col-editor" data-testid="columns-editor">
      {cols.length === 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--fg-tertiary)', marginBottom: 8 }}>
          No columns configured. Click Add Column to start.
        </p>
      )}
      {cols.map((col, i) => (
        <div key={i} className="pp-col-row" data-testid={`col-row-${i}`}>
          <div className="pp-col-row__fields">
            <input
              className="pp-field__input pp-col-row__key"
              placeholder="field key"
              value={col.key}
              onChange={e => updateCol(i, { key: e.target.value })}
              data-testid={`col-key-${i}`}
            />
            <input
              className="pp-field__input pp-col-row__label"
              placeholder="label"
              value={col.label}
              onChange={e => updateCol(i, { label: e.target.value })}
              data-testid={`col-label-${i}`}
            />
            <select
              className="pp-field__input pp-col-row__type"
              value={col.type ?? 'string'}
              onChange={e => updateCol(i, { type: e.target.value })}
              data-testid={`col-type-${i}`}
            >
              {COLUMN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="pp-col-row__flags">
            <label className="pp-col-flag">
              <input
                type="checkbox"
                checked={!!col.sortable}
                onChange={e => updateCol(i, { sortable: e.target.checked })}
                data-testid={`col-sortable-${i}`}
              />
              sort
            </label>
            <label className="pp-col-flag">
              <input
                type="checkbox"
                checked={!!col.filterable}
                onChange={e => updateCol(i, { filterable: e.target.checked })}
                data-testid={`col-filterable-${i}`}
              />
              filter
            </label>
            <button
              className="pp-col-row__delete"
              onClick={() => removeCol(i)}
              title="Remove column"
              data-testid={`col-delete-${i}`}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ))}
      <button
        className="pp-col-add"
        onClick={addCol}
        data-testid="col-add"
      >
        <Plus size={13} /> Add Column
      </button>
    </div>
  )
}

// ─── String Array Editor ──────────────────────────────────────────────────────

function StringArrayEditor({
  value,
  onChange,
}: {
  value: string[] | undefined
  onChange: (v: unknown) => void
}) {
  const [draft, setDraft] = useState('')
  const items: string[] = value ?? []

  function addItem() {
    const trimmed = draft.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setDraft('')
  }

  function removeItem(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  return (
    <div className="pp-str-editor" data-testid="string-array-editor">
      <div className="pp-str-editor__list">
        {items.map((item, i) => (
          <div key={i} className="pp-str-editor__item" data-testid={`str-item-${i}`}>
            <span className="pp-str-editor__value">{item}</span>
            <button
              className="pp-col-row__delete"
              onClick={() => removeItem(i)}
              title="Remove"
              data-testid={`str-delete-${i}`}
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--fg-tertiary)', marginBottom: 4 }}>No items.</p>
        )}
      </div>
      <div className="pp-str-editor__add">
        <input
          type="text"
          className="pp-field__input"
          placeholder="field key or value"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
          data-testid="str-add-input"
        />
        <button
          className="pp-col-add"
          onClick={addItem}
          data-testid="str-add-btn"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}
