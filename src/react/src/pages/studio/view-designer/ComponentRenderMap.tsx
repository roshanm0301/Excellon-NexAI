/**
 * ComponentRenderMap — Maps component_code to preview React components
 * Supports both PascalCase (TextInput) and snake_case (text_input) keys.
 *
 * Phase 4: PreviewProps gains onEvent and isPreviewMode so renderers can
 * emit events into the engine when in live-preview mode.
 */

import React from 'react'
import type { ComponentNode, EventType } from '../../../types/viewStudio'

export type OnEventFn = (
  eventType: EventType,
  sourceKey: string,
  data?: Record<string, unknown>,
) => void

export type PreviewRenderer = (props: PreviewProps) => React.ReactNode

export interface PreviewProps {
  node: ComponentNode
  children?: React.ReactNode[]
  isSelected?: boolean
  /** Fires a view event through the event engine (only wired in preview mode). */
  onEvent?: OnEventFn
  /** True when the canvas is in live-preview mode vs. design mode. */
  isPreviewMode?: boolean
}

// Helper: resolve a binding label (show field_key if field binding)
function bindingLabel(node: ComponentNode, bindingKey: string, fallback: string): string {
  const b = node.bindings?.[bindingKey]
  if (!b) return node.props?.[bindingKey] as string || fallback
  if (b.source === 'static') return String(b.static_value ?? fallback)
  if (b.source === 'field') return b.field_key ? `{${b.field_key}}` : fallback
  if (b.source === 'expression') return `= ${b.expression ?? '...'}`
  return fallback
}

function runtimeFlags(node: ComponentNode) {
  const props = node.props ?? {}
  return {
    required: props.__runtime_required === true || props.required === true,
    readonly: props.__runtime_readonly === true || props.readOnly === true || props.disabled === true,
    messages: Array.isArray(props.__runtime_messages) ? props.__runtime_messages.filter((m): m is string => typeof m === 'string') : [],
  }
}

function fieldBoxStyle(node: ComponentNode, extra?: React.CSSProperties): React.CSSProperties {
  const { readonly } = runtimeFlags(node)
  return {
    padding: '0.35rem 0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    background: readonly ? '#f8fafc' : '#fff',
    fontSize: '0.78rem',
    color: readonly ? '#64748b' : '#94a3b8',
    minHeight: 30,
    display: 'flex',
    alignItems: 'center',
    opacity: readonly ? 0.8 : 1,
    ...extra,
  }
}

function RequiredMark({ show }: { show: boolean }) {
  return show ? <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span> : null
}

function RuntimeMessages({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null
  return (
    <div style={{ marginTop: 4, fontSize: 11, color: '#b45309' }}>
      {messages[0]}
    </div>
  )
}

// ─── Layout ──────────────────────────────────────────────────────────────────

function PageRoot({ children }: PreviewProps) {
  return <div className="prev-page-root">{children}</div>
}

function SectionRenderer({ node, children }: PreviewProps) {
  const title = node.props?.title as string || 'Section'
  return (
    <div className="prev-section">
      <div className="prev-section__title">
        <span>{title}</span>
        <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 'auto' }}>▾</span>
      </div>
      <div className="prev-section__content">{children}</div>
    </div>
  )
}

function RowRenderer({ children }: PreviewProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children) || 1}, 1fr)`, gap: '0.75rem' }}>
      {children}
    </div>
  )
}

function ColumnRenderer({ children }: PreviewProps) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>{children}</div>
}

function ToolbarRenderer({ children }: PreviewProps) {
  return (
    <div className="prev-toolbar">
      {children}
    </div>
  )
}

function HeaderLineSectionRenderer({ node, children }: PreviewProps) {
  const childArray = React.Children.toArray(children)
  const midpoint = Math.ceil(childArray.length / 2)
  const headerChildren = childArray.slice(0, midpoint)
  const lineChildren = childArray.slice(midpoint)
  const title = node.props?.title as string | undefined
  return (
    <div className="prev-page-root" style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '0.4rem 0.75rem', fontWeight: 600, fontSize: '0.8rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
          {title}
        </div>
      )}
      <div style={{ padding: '0.6rem 0.75rem', background: '#fff', borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          Header
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {headerChildren.length > 0 ? headerChildren : (
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontStyle: 'italic' }}>Drop header fields here</div>
          )}
        </div>
      </div>
      <div style={{ padding: '0.6rem 0.75rem', background: '#fafafa' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          Line Grid
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {lineChildren.length > 0 ? lineChildren : (
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontStyle: 'italic' }}>Drop line columns here</div>
          )}
        </div>
      </div>
    </div>
  )
}

function GridRowRenderer({ children }: PreviewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', width: '100%' }}>
      {children}
    </div>
  )
}

function GridColumnRenderer({ children }: PreviewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
      {children}
    </div>
  )
}

function ConditionalContainerRenderer({ node, children }: PreviewProps) {
  return (
    <div style={{ border: '1px dashed #94a3b8', borderRadius: 6, padding: '0.5rem', background: '#fafafa' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: '0.4rem', fontFamily: 'monospace' }}>
        if: {String(node.bindings?.visible?.field_key ?? node.props?.condition ?? 'condition')}
      </div>
      {children}
    </div>
  )
}

// ─── Input Components ────────────────────────────────────────────────────────

function FieldInput({ node, suffix }: PreviewProps & { suffix?: React.ReactNode }) {
  const label = bindingLabel(node, 'value', node.props?.label as string || 'Field')
  const { required, messages } = runtimeFlags(node)
  return (
    <div className="prev-input">
      <label className="prev-input__label">
        {node.props?.label as string || label}
        <RequiredMark show={required} />
      </label>
      <div className="prev-input__field" style={{ position: 'relative' }}>
        {suffix}
        <div style={fieldBoxStyle(node)}>
          {node.bindings?.value?.field_key ? (
            <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 11 }}>
              ⟨{node.bindings.value.field_key}⟩
            </span>
          ) : (
            <span style={{ color: '#cbd5e1' }}>—</span>
          )}
        </div>
        <RuntimeMessages messages={messages} />
      </div>
    </div>
  )
}

function TextInputRenderer(props: PreviewProps) { return <FieldInput {...props} /> }

function NumberInputRenderer(props: PreviewProps) {
  return (
    <div className="prev-input">
      <label className="prev-input__label">{props.node.props?.label as string || 'Number'}</label>
      <div className="prev-input__field">
        <div style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', fontSize: '0.78rem', color: '#94a3b8', minHeight: 30, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {props.node.bindings?.value?.field_key ? (
            <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 11 }}>⟨{props.node.bindings.value.field_key}⟩</span>
          ) : '0.00'}
        </div>
      </div>
    </div>
  )
}

function DatePickerRenderer(props: PreviewProps) {
  return (
    <div className="prev-input">
      <label className="prev-input__label">{props.node.props?.label as string || 'Date'}</label>
      <div className="prev-input__field">
        <div style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', fontSize: '0.78rem', color: '#94a3b8', minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {props.node.bindings?.value?.field_key ? (
            <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 11 }}>⟨{props.node.bindings.value.field_key}⟩</span>
          ) : 'DD/MM/YYYY'}
          <span style={{ fontSize: 12 }}>📅</span>
        </div>
      </div>
    </div>
  )
}

function DropdownRenderer(props: PreviewProps) {
  const opts = props.node.props?.options as string[] | undefined
  return (
    <div className="prev-input">
      <label className="prev-input__label">{props.node.props?.label as string || 'Select'}</label>
      <div className="prev-input__field">
        <div style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', fontSize: '0.78rem', color: '#94a3b8', minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {props.node.bindings?.value?.field_key ? (
            <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 11 }}>⟨{props.node.bindings.value.field_key}⟩</span>
          ) : (opts ? opts[0] : 'Select...')}
          <span style={{ fontSize: 10, color: '#94a3b8' }}>▾</span>
        </div>
      </div>
    </div>
  )
}

function ReferenceSelectRenderer(props: PreviewProps) {
  const entity = props.node.props?.entity as string
  return (
    <div className="prev-input">
      <label className="prev-input__label">
        {props.node.props?.label as string || 'Reference'}
        {props.node.props?.required === true && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <div className="prev-input__field">
        <div style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', fontSize: '0.78rem', color: '#94a3b8', minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            {props.node.bindings?.value?.field_key ? (
              <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 11 }}>⟨{props.node.bindings.value.field_key}⟩</span>
            ) : (entity ? `Search ${entity}...` : 'Search...')}
          </span>
          <span style={{ fontSize: 10 }}>🔗 ▾</span>
        </div>
      </div>
    </div>
  )
}

function CheckboxRenderer(props: PreviewProps) {
  return (
    <div className="prev-checkbox">
      <input type="checkbox" disabled />
      <label>{props.node.props?.label as string || 'Checkbox'}</label>
    </div>
  )
}

function TextareaRenderer(props: PreviewProps) {
  return (
    <div className="prev-input">
      <label className="prev-input__label">{props.node.props?.label as string || 'Textarea'}</label>
      <div className="prev-input__field">
        <div style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', fontSize: '0.78rem', color: '#94a3b8', minHeight: (props.node.props?.rows as number ?? 3) * 22, display: 'flex', alignItems: 'flex-start' }}>
          {props.node.bindings?.value?.field_key ? (
            <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 11 }}>⟨{props.node.bindings.value.field_key}⟩</span>
          ) : ''}
        </div>
      </div>
    </div>
  )
}

// ─── Display Components ──────────────────────────────────────────────────────

function LabelRenderer(props: PreviewProps) {
  const fieldKey = props.node.bindings?.value?.field_key
  return (
    <div className="prev-input">
      <label className="prev-input__label">{props.node.props?.label as string || 'Label'}</label>
      <div style={{ padding: '0.35rem 0', fontSize: '0.82rem', color: fieldKey ? '#1e293b' : '#94a3b8', fontWeight: fieldKey ? 500 : 400 }}>
        {fieldKey ? (
          <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 11 }}>⟨{fieldKey}⟩</span>
        ) : '—'}
      </div>
    </div>
  )
}

function StatusBadgeRenderer(props: PreviewProps) {
  const fieldKey = props.node.bindings?.status?.field_key
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: 12 }}>
        {fieldKey ? <span style={{ fontFamily: 'monospace', fontSize: 10 }}>⟨{fieldKey}⟩</span> : 'Active'}
      </span>
    </div>
  )
}

function MetricComparisonRenderer(props: PreviewProps) {
  const label = props.node.props?.label as string || 'Metric'
  const valueKey = props.node.bindings?.value?.field_key
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
        {valueKey ? <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 14 }}>⟨{valueKey}⟩</span> : '—'}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
        {props.node.bindings?.comparison?.static_value as string || 'vs previous period'}
      </div>
    </div>
  )
}

function BadgeRenderer(props: PreviewProps) {
  return <span className="prev-badge">{props.node.props?.text as string || props.node.props?.value as string || 'Badge'}</span>
}

// ─── Data Components ─────────────────────────────────────────────────────────

function DataTableRenderer(props: PreviewProps) {
  const columns = props.node.props?.columns as Array<{ key: string; label: string; width?: number; type?: string }> | undefined
  const cols = columns ?? [
    { key: 'col1', label: 'Column 1' },
    { key: 'col2', label: 'Column 2' },
    { key: 'col3', label: 'Column 3' },
  ]
  const visibleCols = cols.slice(0, 8)
  const gridTemplate = visibleCols.map(c => c.width ? `${c.width}px` : '1fr').join(' ')
  const title = props.node.props?.title as string
  const entityKey = props.node.bindings?.data?.entity

  return (
    <div className="prev-table">
      {(title || entityKey) && (
        <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title || ''}</span>
          {entityKey && <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6366f1', fontWeight: 400 }}>entity: {entityKey}</span>}
        </div>
      )}
      {/* Search + pagination bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: 4, padding: '0.2rem 0.5rem', width: 120 }}>🔍 Search...</div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>25 per page ▾</div>
      </div>
      {/* Header row */}
      <div className="prev-table__header" style={{ gridTemplateColumns: gridTemplate, gap: 0, overflowX: 'hidden' }}>
        {visibleCols.map(c => (
          <span key={c.key} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4 }}>
            {c.label}
          </span>
        ))}
      </div>
      {/* Sample rows */}
      {[1, 2, 3].map(r => (
        <div key={r} className="prev-table__row" style={{ gridTemplateColumns: gridTemplate, gap: 0, background: r % 2 === 0 ? '#fafafa' : '#fff' }}>
          {visibleCols.map((c, i) => (
            <span key={c.key} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4, color: i === 0 ? '#3b82f6' : '#475569', fontSize: '0.77rem' }}>
              {i === 0 ? `— ${c.label} —` : '—'}
            </span>
          ))}
        </div>
      ))}
      {/* Footer */}
      <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
        <span>Showing 1–3 of N rows</span>
        <span>‹ 1 2 3 ›</span>
      </div>
    </div>
  )
}

function DataCardGridRenderer(props: PreviewProps) {
  const cardFields = props.node.props?.cardFields as Array<{ key: string; label: string }> | string[] | undefined
  const title = props.node.props?.title as string
  const fields = (cardFields ?? ['Field 1', 'Field 2', 'Field 3']).slice(0, 4)
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
      {title && <div style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>{title}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', padding: '0.6rem' }}>
        {[1, 2].map(i => (
          <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.6rem', background: '#fff' }}>
            {fields.map((f, fi) => {
              const label = typeof f === 'string' ? f : f.label
              return (
                <div key={fi} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', padding: '2px 0', borderBottom: fi < fields.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <span style={{ color: '#94a3b8' }}>—</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterPanelRenderer(props: PreviewProps) {
  const filtersBinding = props.node.bindings?.filters
  const filters = filtersBinding?.source === 'static'
    ? filtersBinding.static_value as Array<{ label: string; field: string }> | undefined
    : undefined
  const items = filters ?? [{ label: 'Filter 1', field: 'f1' }, { label: 'Filter 2', field: 'f2' }]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.5rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, alignItems: 'center' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginRight: 4 }}>FILTERS</span>
      {items.slice(0, 6).map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '0.72rem', color: '#475569' }}>
          <span style={{ color: '#94a3b8' }}>{f.label || f.field}</span>
          <span style={{ color: '#cbd5e1' }}>▾</span>
        </div>
      ))}
      <div style={{ marginLeft: 'auto', padding: '0.2rem 0.6rem', background: '#3b82f6', color: '#fff', borderRadius: 4, fontSize: '0.7rem', fontWeight: 500 }}>Apply</div>
    </div>
  )
}

// ─── Transaction Components ──────────────────────────────────────────────────

interface LineItem {
  label: string
  value: string | number
  highlight?: boolean
}

function TotalsPanelRenderer(props: PreviewProps) {
  const rawItems = props.node.props?.line_items as LineItem[] | undefined
  const items: LineItem[] = rawItems && rawItems.length > 0
    ? rawItems
    : [
        { label: 'Subtotal', value: '0.00' },
        { label: 'Tax (10%)', value: '0.00' },
        { label: 'Total', value: '0.00', highlight: true },
      ]
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', background: '#fff', marginLeft: 'auto', maxWidth: 280, width: '100%' }}>
      <div style={{ padding: '0.4rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#374151' }}>
        Summary
      </div>
      <div style={{ padding: '0.4rem 0.75rem' }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.25rem 0',
            borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
            fontWeight: item.highlight ? 700 : 400,
            fontSize: item.highlight ? '0.85rem' : '0.78rem',
            color: item.highlight ? '#0f172a' : '#475569',
          }}>
            <span>{item.label}</span>
            <span style={{ fontFamily: 'monospace' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaxChargeRenderer(props: PreviewProps) {
  const label = props.node.props?.label as string | undefined
  const rateKey = props.node.bindings?.rate?.field_key
  const chargeType = props.node.props?.charge_type as string | undefined
  return (
    <div className="prev-input">
      <label className="prev-input__label">{label ?? 'Tax / Charge'}</label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', fontSize: '0.78rem', color: '#94a3b8', minHeight: 30, flex: 1, display: 'flex', alignItems: 'center' }}>
          {rateKey ? (
            <span style={{ color: '#6366f1', fontFamily: 'monospace', fontSize: 11 }}>⟨{rateKey}⟩</span>
          ) : '0.00'}
        </div>
        <span style={{ fontSize: '0.72rem', color: '#64748b', padding: '0.2rem 0.5rem', background: '#f1f5f9', borderRadius: 4, whiteSpace: 'nowrap' }}>
          {chargeType ?? 'percent'}
        </span>
      </div>
    </div>
  )
}

// ─── Relationship Panel ──────────────────────────────────────────────────────

function RelatedListRenderer(props: PreviewProps) {
  const rawCols = props.node.props?.columns as Array<{ key: string; label: string }> | undefined
  const cols = rawCols && rawCols.length > 0
    ? rawCols
    : [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
      ]
  const title = props.node.props?.title as string | undefined
  const relatedEntity = props.node.props?.entity as string | undefined
  return (
    <div className="prev-table">
      <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{title ?? 'Related records'}</span>
        {relatedEntity && (
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6366f1', fontWeight: 400 }}>
            entity: {relatedEntity}
          </span>
        )}
      </div>
      <div className="prev-table__header" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
        {cols.map(c => <span key={c.key}>{c.label}</span>)}
      </div>
      {[1, 2, 3].map(r => (
        <div key={r} className="prev-table__row" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)`, background: r % 2 === 0 ? '#fafafa' : '#fff' }}>
          {cols.map((c, i) => (
            <span key={c.key} style={{ color: i === 0 ? '#3b82f6' : '#475569', fontSize: '0.77rem' }}>
              {i === 0 ? `Record ${r}` : '—'}
            </span>
          ))}
        </div>
      ))}
      <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
        <span>3 related records</span>
        <span style={{ color: '#3b82f6', fontSize: '0.7rem' }}>+ Add</span>
      </div>
    </div>
  )
}

// ─── Modal / Drawer / Side Panel ─────────────────────────────────────────────

function ModalContainerRenderer({ node, children }: PreviewProps) {
  const title = node.props?.title as string | undefined
  return (
    <div style={{ border: '2px solid #3b82f6', borderRadius: 8, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
      <div style={{ padding: '0.5rem 0.75rem', background: '#3b82f6', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: 600 }}>
        <span>{title ?? 'Modal'}</span>
        <span style={{ cursor: 'pointer', opacity: 0.8, fontSize: '0.9rem' }}>✕</span>
      </div>
      <div style={{ padding: '0.75rem' }}>
        {children}
      </div>
      <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <div style={{ padding: '0.25rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '0.75rem', color: '#64748b', cursor: 'pointer' }}>Cancel</div>
        <div style={{ padding: '0.25rem 0.75rem', background: '#3b82f6', borderRadius: 4, fontSize: '0.75rem', color: '#fff', cursor: 'pointer' }}>Confirm</div>
      </div>
    </div>
  )
}

function DrawerContainerRenderer({ node, children }: PreviewProps) {
  const title = node.props?.title as string | undefined
  const position = node.props?.position as string | undefined
  return (
    <div style={{ border: '2px solid #8b5cf6', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '0.5rem 0.75rem', background: '#8b5cf6', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: 600 }}>
        <span>{title ?? 'Drawer'}</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{position ?? 'right'} panel</span>
      </div>
      <div style={{ padding: '0.75rem' }}>
        {children}
      </div>
    </div>
  )
}

function SidePanelRenderer({ node, children }: PreviewProps) {
  const title = node.props?.title as string | undefined
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', background: '#f8fafc', minWidth: 220 }}>
      <div style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.78rem', borderBottom: '1px solid #e2e8f0', color: '#374151', background: '#f1f5f9' }}>
        {title ?? 'Side Panel'}
      </div>
      <div style={{ padding: '0.5rem' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Dashboard / Wizard / Split / Kanban ─────────────────────────────────────

function DashboardGridRenderer({ children }: PreviewProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', padding: '0.25rem' }}>
      {children}
    </div>
  )
}

function WizardStepRenderer({ node, children }: PreviewProps) {
  const title = node.props?.title as string | undefined
  const stepNum = node.props?.step as number | undefined
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '0.6rem 0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {stepNum ?? 1}
        </div>
        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>
          {title ?? 'Wizard Step'}
        </span>
      </div>
      <div style={{ padding: '0.75rem' }}>
        {children}
      </div>
    </div>
  )
}

function SplitPanelRenderer({ children }: PreviewProps) {
  const childArray = React.Children.toArray(children)
  const left = childArray.slice(0, Math.ceil(childArray.length / 2))
  const right = childArray.slice(Math.ceil(childArray.length / 2))
  return (
    <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
      <div style={{ flex: 1, border: '1px dashed #e2e8f0', borderRadius: 6, padding: '0.5rem', minHeight: 60 }}>
        {left.length > 0 ? left : <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic' }}>Left pane</div>}
      </div>
      <div style={{ width: 2, background: '#e2e8f0', borderRadius: 1, flexShrink: 0 }} />
      <div style={{ flex: 1, border: '1px dashed #e2e8f0', borderRadius: 6, padding: '0.5rem', minHeight: 60 }}>
        {right.length > 0 ? right : <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic' }}>Right pane</div>}
      </div>
    </div>
  )
}

function KanbanBoardRenderer({ node, children }: PreviewProps) {
  const childArray = React.Children.toArray(children)
  const rawCols = node.props?.columns as string[] | undefined
  const colLabels = rawCols && rawCols.length > 0
    ? rawCols
    : ['To Do', 'In Progress', 'Done']
  const contentColumns = childArray.length > 0
    ? Array.from({ length: colLabels.length }, (_, i) => childArray[i] ?? null)
    : colLabels.map(() => null)
  return (
    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem' }}>
      {colLabels.map((col, i) => (
        <div key={i} style={{ flex: 1, minWidth: 140, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', background: '#f8fafc' }}>
          <div style={{ padding: '0.4rem 0.6rem', fontWeight: 600, fontSize: '0.75rem', color: '#374151', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
            {col}
          </div>
          <div style={{ padding: '0.4rem' }}>
            {contentColumns[i] ?? (
              <div style={{ border: '1px dashed #e2e8f0', borderRadius: 4, padding: '0.5rem', fontSize: '0.72rem', color: '#cbd5e1', textAlign: 'center' }}>
                Drop cards here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Action Components ───────────────────────────────────────────────────────

function ButtonRenderer(props: PreviewProps) {
  const label = bindingLabel(props.node, 'label', props.node.props?.label as string || 'Button')
  const variant = props.node.props?.variant as string ?? 'primary'

  function handleClick() {
    if (props.isPreviewMode && props.onEvent) {
      props.onEvent('on_click', props.node.component_key, {
        label,
        variant,
      })
    }
  }

  return (
    <button
      className={`prev-button prev-button--${variant}`}
      disabled={!props.isPreviewMode}
      onClick={handleClick}
    >
      {label}
    </button>
  )
}

// ─── Fallback ────────────────────────────────────────────────────────────────

function FallbackComponent({ node, children }: PreviewProps) {
  return (
    <div className="prev-fallback">
      <span className="prev-fallback__label">{node.component_code}</span>
      {children}
    </div>
  )
}

// ─── Render Map ───────────────────────────────────────────────────────────────
//
// Canonical component_code registry (snake_case, matching seed):
//   page_root, section, tab_container, tab_panel, grid_row, grid_column,
//   card, accordion, split_pane, drawer_panel, modal_container,
//   wizard_step_container, header_line_section, form_section, repeater,
//   conditional_container, text_input, number_input, currency_input,
//   date_picker, time_picker, datetime_picker, dropdown_select, multi_select,
//   checkbox, checkbox_group, radio_group, toggle_switch, textarea,
//   rich_text_editor, file_upload, reference_select, label, heading,
//   paragraph, badge, status_badge, metric_comparison, avatar, divider,
//   data_table, data_card_grid, filter_panel, related_list, button, toolbar
//
// All active registry codes have a renderer below (snake_case aliases section).
// PascalCase aliases are retained for backward compatibility during migration.
// Unsupported codes fall back to FallbackComponent.

export const COMPONENT_RENDER_MAP: Record<string, PreviewRenderer> = {
  // Layout — PascalCase (legacy aliases, kept for backward compatibility)
  PageRoot: PageRoot,
  Section: SectionRenderer,
  Row: RowRenderer,
  Column: ColumnRenderer,
  Toolbar: ToolbarRenderer,
  HeaderLineSection: HeaderLineSectionRenderer,
  ConditionalContainer: ConditionalContainerRenderer,
  Tabs: SectionRenderer,
  Modal: ModalContainerRenderer,

  // Input — PascalCase
  TextInput: TextInputRenderer,
  NumberInput: NumberInputRenderer,
  DatePicker: DatePickerRenderer,
  Dropdown: DropdownRenderer,
  Checkbox: CheckboxRenderer,
  Textarea: TextareaRenderer,
  ReferenceSelect: ReferenceSelectRenderer,
  FileUpload: TextInputRenderer,

  // Display — PascalCase
  Label: LabelRenderer,
  Badge: BadgeRenderer,
  StatusBadge: StatusBadgeRenderer,
  MetricComparison: MetricComparisonRenderer,

  // Data — PascalCase
  DataTable: DataTableRenderer,
  DataCardGrid: DataCardGridRenderer,
  FilterPanel: FilterPanelRenderer,

  // Action — PascalCase
  Button: ButtonRenderer,

  // Legacy snake_case aliases
  page_root: PageRoot,
  section: SectionRenderer,
  card: SectionRenderer,
  grid_row: GridRowRenderer,
  grid_column: GridColumnRenderer,
  tab_container: SectionRenderer,
  tab_panel: SectionRenderer,
  accordion: SectionRenderer,
  text_input: TextInputRenderer,
  number_input: NumberInputRenderer,
  currency_input: NumberInputRenderer,
  date_picker: DatePickerRenderer,
  time_picker: DatePickerRenderer,
  datetime_picker: DatePickerRenderer,
  dropdown_select: DropdownRenderer,
  multi_select: DropdownRenderer,
  checkbox: CheckboxRenderer,
  checkbox_group: CheckboxRenderer,
  radio_group: DropdownRenderer,
  toggle_switch: CheckboxRenderer,
  textarea: TextareaRenderer,
  rich_text_editor: TextareaRenderer,
  file_upload: TextInputRenderer,
  label: LabelRenderer,
  heading: LabelRenderer,
  paragraph: LabelRenderer,
  badge: BadgeRenderer,
  status_badge: StatusBadgeRenderer,
  avatar: BadgeRenderer,
  divider: ({ node }) => <hr key={node.component_key} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.25rem 0' }} />,
  data_table: DataTableRenderer,
  data_card_grid: DataCardGridRenderer,
  metric_comparison: MetricComparisonRenderer,
  related_list: RelatedListRenderer,
  relationship_panel: RelatedListRenderer,
  button: ButtonRenderer,
  toolbar: ToolbarRenderer,
  filter_panel: FilterPanelRenderer,
  conditional_container: ConditionalContainerRenderer,
  header_line_section: HeaderLineSectionRenderer,
  // Transaction components
  totals_panel: TotalsPanelRenderer,
  tax_charge_column: TaxChargeRenderer,
  // Modal / Drawer / Side Panel
  modal_container: ModalContainerRenderer,
  drawer_container: DrawerContainerRenderer,
  side_panel: SidePanelRenderer,
  // Dashboard / Wizard / Split / Kanban
  dashboard_grid: DashboardGridRenderer,
  wizard_step: WizardStepRenderer,
  wizard_step_container: WizardStepRenderer,
  split_panel: SplitPanelRenderer,
  split_pane: SplitPanelRenderer,
  kanban_board: KanbanBoardRenderer,
}

/** Get renderer for a component code, with fallback */
export function getRenderer(componentCode: string): PreviewRenderer {
  return COMPONENT_RENDER_MAP[componentCode] ?? FallbackComponent
}
