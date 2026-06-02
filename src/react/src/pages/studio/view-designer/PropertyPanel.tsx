import { useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'
import { useComponentRegistry } from '../../../hooks/useViewStudio'
import { BindingEditor } from './BindingEditor'
import { EventEditor } from './EventEditor'
import { VisibilityRuleBuilder } from './VisibilityRuleBuilder'

export function PropertyPanel() {
  const {
    selectedKey, getNode, updateNodeProps, removeNode, panelMode, setPanelMode,
  } = useCanvasStore()
  const { data: registry } = useComponentRegistry()

  const node = selectedKey ? getNode(selectedKey) : null
  if (!node) return null

  const registryEntry = (registry ?? []).find(c => c.component_code === node.component_code)
  const configSchema = registryEntry?.config_schema as { properties?: Record<string, SchemaProperty> } | undefined
  const properties = configSchema?.properties ?? {}

  const handlePropChange = useCallback((key: string, value: unknown) => {
    if (!selectedKey) return
    updateNodeProps(selectedKey, { [key]: value })
  }, [selectedKey, updateNodeProps])

  const handleDelete = useCallback(() => {
    if (!selectedKey || node.component_code === 'page_root') return
    removeNode(selectedKey)
  }, [selectedKey, node, removeNode])

  return (
    <div className="pp-panel">
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
          Bindings
        </div>
        <div
          className={`pp-tab ${panelMode === 'events' ? 'pp-tab--active' : ''}`}
          onClick={() => setPanelMode('events')}
        >
          Events
        </div>
        <div
          className={`pp-tab ${panelMode === 'visibility' ? 'pp-tab--active' : ''}`}
          onClick={() => setPanelMode('visibility')}
        >
          Visibility
        </div>
      </div>

      {/* Content */}
      {panelMode === 'properties' && (
        <PropertiesTab
          properties={properties}
          currentProps={node.props ?? {}}
          onChange={handlePropChange}
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
    </div>
  )
}

// ─── Schema Types ────────────────────────────────────────────────────────────

interface SchemaProperty {
  type: string
  enum?: string[]
  minimum?: number
  maximum?: number
  items?: { type: string; enum?: string[] }
}

// ─── Properties Tab ──────────────────────────────────────────────────────────

function PropertiesTab({
  properties,
  currentProps,
  onChange,
}: {
  properties: Record<string, SchemaProperty>
  currentProps: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  if (Object.keys(properties).length === 0) {
    return <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No configurable properties.</p>
  }

  return (
    <div className="pp-section">
      <div className="pp-section__title">Configuration</div>
      {Object.entries(properties).map(([key, schema]) => (
        <PropertyField
          key={key}
          name={key}
          schema={schema}
          value={currentProps[key]}
          onChange={(v) => onChange(key, v)}
        />
      ))}
    </div>
  )
}

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
  const label = name.replace(/_/g, ' ')

  if (schema.enum) {
    return (
      <div className="pp-field">
        <label className="pp-field__label">{label}</label>
        <select
          className="pp-field__input"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">—</option>
          {schema.enum.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  if (schema.type === 'boolean') {
    return (
      <div className="pp-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          id={`prop-${name}`}
        />
        <label htmlFor={`prop-${name}`} className="pp-field__label" style={{ marginBottom: 0 }}>{label}</label>
      </div>
    )
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    return (
      <div className="pp-field">
        <label className="pp-field__label">{label}</label>
        <input
          type="number"
          className="pp-field__input"
          value={(value as number) ?? ''}
          min={schema.minimum}
          max={schema.maximum}
          onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      </div>
    )
  }

  // Default: string input
  return (
    <div className="pp-field">
      <label className="pp-field__label">{label}</label>
      <input
        type="text"
        className="pp-field__input"
        value={(value as string) ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
      />
    </div>
  )
}
