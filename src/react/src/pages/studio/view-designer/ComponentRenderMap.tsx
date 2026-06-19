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

// Overlay component codes that should NOT be in the main vertical flow
const OVERLAY_CODES = new Set([
  'drawer_panel', 'drawer_container', 'modal_container', 'side_panel',
])

function PageRoot({ node, children }: PreviewProps) {
  // Separate flow children from overlay children so drawers don't stack vertically
  const childNodes = node.children ?? []
  const flowChildren: React.ReactNode[] = []
  const overlayChildren: React.ReactNode[] = []

  React.Children.forEach(children, (child, i) => {
    const childCode = childNodes[i]?.component_code ?? ''
    if (OVERLAY_CODES.has(childCode)) {
      overlayChildren.push(child)
    } else {
      flowChildren.push(child)
    }
  })

  return (
    <div className="prev-page-root">
      {/* Main content flow: toolbar, data table, etc. */}
      <div className="prev-page-root__flow">
        {flowChildren}
      </div>
      {/* Overlay panels (drawer, modal, side panel) float on the right */}
      {overlayChildren.length > 0 && (
        <div className="prev-page-root__overlays">
          {overlayChildren}
        </div>
      )}
    </div>
  )
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
  const hasChildren = React.Children.count(children) > 0
  return (
    <div className="prev-toolbar">
      {hasChildren ? children : (
        <span className="prev-empty-hint">Add buttons, search, or actions here</span>
      )}
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
  const hasChildren = React.Children.count(children) > 0
  return (
    <div className="prev-drawer">
      {/* Drawer header — mimics the real drawer handle */}
      <div className="prev-drawer__header">
        <span className="prev-drawer__title">{title ?? 'Drawer'}</span>
        <span className="prev-drawer__close" aria-label="close">✕</span>
      </div>
      {/* Drawer body — filter fields go here */}
      <div className="prev-drawer__body">
        {hasChildren ? children : (
          <span className="prev-empty-hint">Add filter fields here</span>
        )}
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

// ─── Missing Renderers — Group A: Simple display-only ────────────────────────

function SpacerRenderer({ node }: PreviewProps) {
  const h = (node.props?.height as number | undefined) ?? 24
  return <div style={{ height: h, flexShrink: 0 }} aria-hidden />
}

function IconRenderer({ node }: PreviewProps) {
  const name = (node.props?.icon as string | undefined) ?? (node.props?.name as string | undefined) ?? 'star'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, background: '#f1f5f9', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function ImageRenderer({ node }: PreviewProps) {
  const alt = (node.props?.alt as string | undefined) ?? 'Image'
  const aspect = (node.props?.aspect_ratio as string | undefined) ?? '16/9'
  return (
    <div style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: 6, aspectRatio: aspect, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '1.4rem', color: '#94a3b8' }}>🖼</span>
      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{alt}</span>
    </div>
  )
}

function CopyFieldRenderer({ node }: PreviewProps) {
  const label = bindingLabel(node, 'value', 'Value')
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <div style={{ ...fieldBoxStyle(node), flex: 1 }}>{label}</div>
      <div style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#f8fafc', fontSize: '0.72rem', color: '#94a3b8', cursor: 'pointer' }}>⧉</div>
    </div>
  )
}

function LinkRenderer({ node }: PreviewProps) {
  const text = (node.props?.text as string | undefined) ?? (node.props?.label as string | undefined) ?? 'Link'
  return <span style={{ color: '#3b82f6', fontSize: '0.78rem', textDecoration: 'underline', cursor: 'pointer' }}>{text}</span>
}

// ─── Missing Renderers — Group B: Status / Indicator ─────────────────────────

function AlertBannerRenderer({ node }: PreviewProps) {
  const msg = (node.props?.message as string | undefined) ?? (node.props?.title as string | undefined) ?? 'Alert message'
  const variant = (node.props?.variant as string | undefined) ?? 'info'
  const COLORS: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    info:    { bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ', text: '#1d4ed8' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '✓', text: '#15803d' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '⚠', text: '#b45309' },
    error:   { bg: '#fef2f2', border: '#fecaca', icon: '✕', text: '#b91c1c' },
  }
  const c = COLORS[variant] ?? COLORS.info
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0.6rem 0.75rem', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6 }}>
      <span style={{ color: c.text, fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{c.icon}</span>
      <span style={{ fontSize: '0.78rem', color: c.text, lineHeight: 1.4 }}>{msg}</span>
    </div>
  )
}

function EmptyStateRenderer({ node }: PreviewProps) {
  const title = (node.props?.title as string | undefined) ?? 'No items found'
  const desc = (node.props?.description as string | undefined) ?? 'Add your first record to get started.'
  const icon = (node.props?.icon as string | undefined) ?? '📭'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', gap: 8, textAlign: 'center' }}>
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{title}</span>
      <span style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: 220 }}>{desc}</span>
    </div>
  )
}

function ColorIndicatorRenderer({ node }: PreviewProps) {
  const color = (node.props?.color as string | undefined) ?? '#22c55e'
  const label = (node.props?.label as string | undefined) ?? ''
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</span>}
    </div>
  )
}

// ─── Missing Renderers — Group C: Input components ───────────────────────────

function PhoneInputRenderer({ node }: PreviewProps) {
  const { required, readonly } = runtimeFlags(node)
  const label = bindingLabel(node, 'value', node.props?.label as string || 'Phone')
  return (
    <div className="prev-input">
      <label className="prev-input__label">{label}<RequiredMark show={required} /></label>
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRight: 'none', borderRadius: '4px 0 0 4px', background: readonly ? '#f8fafc' : '#f1f5f9', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
          🇮🇳 +91
        </div>
        <div style={{ ...fieldBoxStyle(node), flex: 1, borderRadius: '0 4px 4px 0', borderLeft: 'none' }}>
          {node.props?.placeholder as string || '000 0000 0000'}
        </div>
      </div>
    </div>
  )
}

function ColorPickerRenderer({ node }: PreviewProps) {
  const label = (node.props?.label as string | undefined) ?? 'Color'
  const color = (node.props?.default_color as string | undefined) ?? '#3b82f6'
  return (
    <div className="prev-input">
      <label className="prev-input__label">{label}</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: 4, background: color, border: '1px solid #e2e8f0', flexShrink: 0 }} />
        <div style={{ ...fieldBoxStyle(node), flex: 1, fontFamily: 'monospace', fontSize: '0.72rem' }}>{color}</div>
      </div>
    </div>
  )
}

function SliderRangeRenderer({ node }: PreviewProps) {
  const label = (node.props?.label as string | undefined) ?? 'Range'
  const min = (node.props?.min as number | undefined) ?? 0
  const max = (node.props?.max as number | undefined) ?? 100
  const val = Math.round((max - min) * 0.4 + min)
  const pct = ((val - min) / (max - min)) * 100
  return (
    <div className="prev-input">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <label className="prev-input__label" style={{ marginBottom: 0 }}>{label}</label>
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{val}</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: '#e2e8f0', borderRadius: 3 }}>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: '#3b82f6', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{min}</span>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{max}</span>
      </div>
    </div>
  )
}

function TagInputRenderer({ node }: PreviewProps) {
  const label = (node.props?.label as string | undefined) ?? 'Tags'
  const placeholder = (node.props?.placeholder as string | undefined) ?? 'Add tag...'
  return (
    <div className="prev-input">
      <label className="prev-input__label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0.3rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', minHeight: 34, alignItems: 'center' }}>
        {['Tag 1', 'Tag 2'].map(t => (
          <span key={t} style={{ padding: '2px 8px', background: '#eff6ff', color: '#3b82f6', borderRadius: 99, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 3 }}>
            {t} <span style={{ cursor: 'pointer', opacity: 0.5 }}>×</span>
          </span>
        ))}
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', paddingLeft: 4 }}>{placeholder}</span>
      </div>
    </div>
  )
}

function SearchBarRenderer({ node }: PreviewProps) {
  const placeholder = (node.props?.placeholder as string | undefined) ?? 'Search...'
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#94a3b8' }}>🔍</span>
      <div style={{ paddingLeft: 30, paddingRight: 12, height: 36, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', display: 'flex', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
        {placeholder}
      </div>
    </div>
  )
}

function CodeEditorRenderer({ node }: PreviewProps) {
  const lang = (node.props?.language as string | undefined) ?? 'javascript'
  return (
    <div style={{ background: '#1e1e2e', borderRadius: 6, padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.72rem', color: '#cdd6f4', lineHeight: 1.6 }}>
      <div style={{ color: '#89b4fa', marginBottom: 2 }}>// {lang}</div>
      <div><span style={{ color: '#cba6f7' }}>const</span> <span style={{ color: '#89dceb' }}>result</span> <span style={{ color: '#94e2d5' }}>= </span><span style={{ color: '#a6e3a1' }}>true</span><span>;</span></div>
      <div style={{ opacity: 0.3 }}>…</div>
    </div>
  )
}

// ─── Missing Renderers — Group D: Navigation ─────────────────────────────────

function BreadcrumbNavRenderer({ node }: PreviewProps) {
  const items = (node.props?.items as string[] | undefined) ?? ['Home', 'Section', 'Current Page']
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: '#cbd5e1' }}>›</span>}
          <span style={{ color: i === items.length - 1 ? '#374151' : '#3b82f6', fontWeight: i === items.length - 1 ? 600 : 400 }}>
            {item}
          </span>
        </React.Fragment>
      ))}
    </nav>
  )
}

function PaginationRenderer({ node }: PreviewProps) {
  const pageSize = (node.props?.page_size as number | undefined) ?? 10
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0.4rem 0' }}>
      <div style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '0.72rem', color: '#94a3b8', cursor: 'pointer' }}>← Prev</div>
      {[1, 2, 3].map(p => (
        <div key={p} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${p === 1 ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 4, fontSize: '0.72rem', color: p === 1 ? '#3b82f6' : '#64748b', background: p === 1 ? '#eff6ff' : '#fff' }}>{p}</div>
      ))}
      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>…</span>
      <div style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '0.72rem', color: '#64748b', cursor: 'pointer' }}>Next →</div>
      {pageSize && <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 4 }}>{pageSize}/page</span>}
    </div>
  )
}

function StepperRenderer({ node }: PreviewProps) {
  const steps = (node.props?.steps as string[] | undefined) ?? ['Step 1', 'Step 2', 'Step 3']
  const current = (node.props?.current_step as number | undefined) ?? 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${i <= current ? '#3b82f6' : '#e2e8f0'}`, background: i < current ? '#3b82f6' : i === current ? '#eff6ff' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: i < current ? '#fff' : i === current ? '#3b82f6' : '#94a3b8' }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.65rem', color: i <= current ? '#374151' : '#94a3b8', whiteSpace: 'nowrap', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < current ? '#3b82f6' : '#e2e8f0', margin: '0 2px', marginBottom: 18 }} />}
        </React.Fragment>
      ))}
    </div>
  )
}

function TabGroupRenderer({ node }: PreviewProps) {
  const tabs = (node.props?.tabs as string[] | undefined) ?? ['Tab 1', 'Tab 2', 'Tab 3']
  const active = (node.props?.default_tab as number | undefined) ?? 0
  return (
    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', gap: 0 }}>
        {tabs.map((tab, i) => (
          <div key={i} style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: i === active ? 600 : 400, color: i === active ? '#3b82f6' : '#64748b', borderBottom: `2px solid ${i === active ? '#3b82f6' : 'transparent'}`, cursor: 'pointer' }}>
            {tab}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Missing Renderers — Group E: Layout / Container ─────────────────────────

function FormSectionRenderer({ node, children }: PreviewProps) {
  const title = (node.props?.title as string | undefined) ?? 'Section'
  const hasChildren = Array.isArray(children) && children.length > 0
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>
        {title}
      </div>
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {hasChildren ? children : (
          <>
            {['Field 1', 'Field 2', 'Field 3'].map(f => (
              <div key={f} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{f}</span>
                <div style={{ ...fieldBoxStyle(node), padding: '0.25rem 0.4rem', minHeight: 24 }} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function RepeaterRenderer({ node, children }: PreviewProps) {
  const minRows = (node.props?.min_rows as number | undefined) ?? 2
  const hasChildren = Array.isArray(children) && children.length > 0
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
      {[...Array(minRows)].map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
          {hasChildren ? children : (
            <div style={{ flex: 1, height: 24, background: '#f1f5f9', borderRadius: 4 }} />
          )}
          <span style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>✕</span>
        </div>
      ))}
      <div style={{ padding: '0.4rem 0.75rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#3b82f6', cursor: 'pointer' }}>+ Add row</span>
      </div>
    </div>
  )
}

function DetailPanelRenderer({ node }: PreviewProps) {
  const title = (node.props?.title as string | undefined) ?? 'Details'
  const fields = (node.props?.fields as string[] | undefined) ?? ['Field A', 'Field B', 'Field C', 'Field D']
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
      {title && <div style={{ padding: '0.4rem 0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{title}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '0.5rem' }}>
        {fields.slice(0, 6).map((f, i) => (
          <div key={i} style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f}</div>
            <div style={{ fontSize: '0.78rem', color: '#374151', marginTop: 1 }}>—</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Missing Renderers — Group F: Data / Composite ───────────────────────────

function CalendarViewRenderer({ node }: PreviewProps) {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const today = new Date()
  const month = today.toLocaleString('default', { month: 'long', year: 'numeric' })
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', fontSize: '0.72rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <span style={{ color: '#94a3b8', cursor: 'pointer' }}>‹</span>
        <span style={{ fontWeight: 600, color: '#374151' }}>{month}</span>
        <span style={{ color: '#94a3b8', cursor: 'pointer' }}>›</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {days.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '0.3rem 0', fontWeight: 600, color: '#94a3b8', background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>{d}</div>
        ))}
        {[...Array(35)].map((_, i) => {
          const day = i - 3 + 1
          const isToday = day === today.getDate()
          const valid = day >= 1 && day <= 31
          return (
            <div key={i} style={{ textAlign: 'center', padding: '0.3rem 0', color: !valid ? '#e2e8f0' : isToday ? '#3b82f6' : '#374151', background: isToday ? '#eff6ff' : 'transparent', fontWeight: isToday ? 700 : 400 }}>
              {valid ? day : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimelineRenderer({ node }: PreviewProps) {
  const items = (node.props?.items as Array<{ label: string; date: string }> | undefined) ?? [
    { label: 'Order Created', date: '10 Jan' },
    { label: 'Payment Received', date: '10 Jan' },
    { label: 'Dispatched', date: '12 Jan' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.slice(0, 5).map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? '#3b82f6' : '#cbd5e1', flexShrink: 0, marginTop: 3 }} />
            {i < items.length - 1 && <div style={{ width: 2, flex: 1, background: '#e2e8f0', minHeight: 20 }} />}
          </div>
          <div style={{ paddingBottom: 12 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#374151' }}>{item.label}</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{item.date}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TreeViewRenderer({ node }: PreviewProps) {
  const items = [
    { label: 'Category A', depth: 0 },
    { label: 'Sub-category 1', depth: 1 },
    { label: 'Sub-category 2', depth: 1 },
    { label: 'Category B', depth: 0 },
    { label: 'Sub-category 3', depth: 1 },
  ]
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.4rem', fontSize: '0.75rem' }}>
      {items.map((item, i) => (
        <div key={i} style={{ paddingLeft: item.depth * 16, padding: `2px 4px 2px ${item.depth * 16 + 4}px`, display: 'flex', alignItems: 'center', gap: 4, color: '#374151', borderRadius: 3 }}>
          <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{item.depth === 0 ? '▸' : '·'}</span>
          {item.label}
        </div>
      ))}
    </div>
  )
}

function CommentThreadRenderer({ node }: PreviewProps) {
  const comments = [
    { author: 'Alice M.', text: 'Noted — will follow up with supplier.', time: '2h ago' },
    { author: 'Bob K.', text: 'Payment terms confirmed.', time: '1h ago' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {comments.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
            {c.author.split(' ').map(w => w[0]).join('')}
          </div>
          <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.4rem 0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#374151' }}>{c.author}</span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{c.time}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>{c.text}</p>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <div style={{ flex: 1, padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.72rem', color: '#94a3b8', background: '#fff' }}>Write a comment…</div>
        <div style={{ padding: '0.35rem 0.6rem', background: '#3b82f6', color: '#fff', borderRadius: 6, fontSize: '0.72rem', cursor: 'pointer' }}>Send</div>
      </div>
    </div>
  )
}

function FilePreviewRenderer({ node }: PreviewProps) {
  const fileName = (node.props?.label as string | undefined) ?? 'Document.pdf'
  const ext = fileName.split('.').pop()?.toUpperCase() ?? 'FILE'
  const size = (node.props?.file_size as string | undefined) ?? '128 KB'
  const ICON: Record<string, string> = { PDF: '📄', XLSX: '📊', DOCX: '📝', CSV: '📊', PNG: '🖼', JPG: '🖼' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fafafa' }}>
      <span style={{ fontSize: '1.4rem' }}>{ICON[ext] ?? '📎'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{ext} • {size}</div>
      </div>
      <span style={{ fontSize: '0.72rem', color: '#3b82f6', cursor: 'pointer', flexShrink: 0 }}>↓</span>
    </div>
  )
}

function ActionMenuRenderer({ node }: PreviewProps) {
  const label = (node.props?.label as string | undefined) ?? 'Actions'
  const items = (node.props?.items as string[] | undefined) ?? ['Edit', 'Duplicate', 'Delete']
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.35rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', fontSize: '0.78rem', color: '#374151', cursor: 'pointer' }}>
        {label} <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>▾</span>
      </div>
      <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 2, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 120, zIndex: 10, pointerEvents: 'none' }}>
        {items.slice(0, 4).map((item, i) => (
          <div key={i} style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', color: item === 'Delete' ? '#ef4444' : '#374151', borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

// ─── Group G: Previously-missing renderers ───────────────────────────────────

function IconButtonRenderer({ node }: PreviewProps) {
  const variant = node.props?.variant as string ?? 'ghost'
  const icon = node.props?.icon as string
  return (
    <button
      className={`prev-button prev-button--${variant}`}
      style={{ padding: '0.3rem', minWidth: 32, minHeight: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      disabled
    >
      {icon
        ? <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{icon.slice(0, 2)}</span>
        : <span style={{ fontSize: 13 }}>●</span>}
    </button>
  )
}

function ProgressBarRenderer({ node }: PreviewProps) {
  const label = node.props?.label as string ?? node.label
  const value = node.props?.value as number ?? 65
  const max = node.props?.max as number ?? 100
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const color = node.props?.color as string ?? '#3b82f6'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {label && <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#374151' }}>{label}</span>}
      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{Math.round(pct)}%</span>
    </div>
  )
}

function StepperInputRenderer({ node }: PreviewProps) {
  const { required, readonly, messages } = runtimeFlags(node)
  const label = node.props?.label as string ?? node.label ?? 'Quantity'
  const value = node.props?.value as number ?? 1
  const btnStyle: React.CSSProperties = {
    width: 28, height: 28, border: '1px solid #d1d5db', borderRadius: 4,
    background: '#f8fafc', cursor: 'default', fontSize: 14, lineHeight: '1',
  }
  return (
    <div className="prev-input">
      <span className="prev-input__label">{label}<RequiredMark show={required} /></span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button style={btnStyle} disabled>−</button>
        <div style={{ ...fieldBoxStyle(node, { minWidth: 40, textAlign: 'center', fontWeight: 600 }), opacity: readonly ? 0.7 : 1 }}>
          {value}
        </div>
        <button style={btnStyle} disabled>+</button>
      </div>
      <RuntimeMessages messages={messages} />
    </div>
  )
}

function AddressBlockRenderer({ node }: PreviewProps) {
  const { required, readonly } = runtimeFlags(node)
  const label = node.props?.label as string ?? node.label ?? 'Address'
  return (
    <div className="prev-input">
      <span className="prev-input__label">{label}<RequiredMark show={required} /></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={fieldBoxStyle(node)}>Street line 1{readonly ? ' (read-only)' : ''}</div>
        <div style={fieldBoxStyle(node)}>Street line 2 (optional)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 4 }}>
          <div style={fieldBoxStyle(node)}>City</div>
          <div style={fieldBoxStyle(node)}>State</div>
          <div style={fieldBoxStyle(node)}>ZIP</div>
        </div>
      </div>
    </div>
  )
}

function TimerCountdownRenderer({ node }: PreviewProps) {
  const label = node.props?.label as string ?? node.label
  const hours = node.props?.hours as number ?? 0
  const minutes = node.props?.minutes as number ?? 5
  const seconds = node.props?.seconds as number ?? 0
  const display = [hours, minutes, seconds].map(n => String(n).padStart(2, '0')).join(':')
  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      {label && <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>{label}</div>}
      <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', letterSpacing: '0.08em' }}>
        {display}
      </div>
    </div>
  )
}

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
  drawer_panel: DrawerContainerRenderer,
  side_panel: SidePanelRenderer,
  // Dashboard / Wizard / Split / Kanban
  dashboard_grid: DashboardGridRenderer,
  wizard_step: WizardStepRenderer,
  wizard_step_container: WizardStepRenderer,
  split_panel: SplitPanelRenderer,
  split_pane: SplitPanelRenderer,
  kanban_board: KanbanBoardRenderer,

  // ── Group A: Simple display-only ──────────────────────────────────────────
  spacer: SpacerRenderer,
  icon: IconRenderer,
  image: ImageRenderer,
  copy_field: CopyFieldRenderer,
  link: LinkRenderer,

  // ── Group B: Status / Indicator ───────────────────────────────────────────
  alert_banner: AlertBannerRenderer,
  empty_state: EmptyStateRenderer,
  color_indicator: ColorIndicatorRenderer,

  // ── Group C: Input components ─────────────────────────────────────────────
  phone_input: PhoneInputRenderer,
  color_picker: ColorPickerRenderer,
  slider_range: SliderRangeRenderer,
  tag_input: TagInputRenderer,
  search_bar: SearchBarRenderer,
  code_editor: CodeEditorRenderer,

  // ── Group D: Navigation ───────────────────────────────────────────────────
  breadcrumb_nav: BreadcrumbNavRenderer,
  pagination: PaginationRenderer,
  stepper: StepperRenderer,
  tab_group: TabGroupRenderer,

  // ── Group E: Layout / Container ───────────────────────────────────────────
  form_section: FormSectionRenderer,
  repeater: RepeaterRenderer,
  detail_panel: DetailPanelRenderer,

  // ── Group F: Data / Composite ─────────────────────────────────────────────
  calendar_view: CalendarViewRenderer,
  timeline: TimelineRenderer,
  tree_view: TreeViewRenderer,
  comment_thread: CommentThreadRenderer,
  file_preview: FilePreviewRenderer,
  action_menu: ActionMenuRenderer,

  // ── Group G: Previously-missing renderers (72 → 76 + reference alias) ─────
  icon_button: IconButtonRenderer,
  progress_bar: ProgressBarRenderer,
  stepper_input: StepperInputRenderer,
  address_block: AddressBlockRenderer,
  timer_countdown: TimerCountdownRenderer,
  reference_select: ReferenceSelectRenderer,
}

/** Get renderer for a component code, with fallback */
export function getRenderer(componentCode: string): PreviewRenderer {
  return COMPONENT_RENDER_MAP[componentCode] ?? FallbackComponent
}
