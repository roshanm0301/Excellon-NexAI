/**
 * ComponentRenderMap — Maps component_code to preview React components
 * Supports both PascalCase (TextInput) and snake_case (text_input) keys.
 */

import React from 'react'
import type { ComponentNode } from '../../../types/viewStudio'

export type PreviewRenderer = (props: PreviewProps) => React.ReactNode

export interface PreviewProps {
  node: ComponentNode
  children?: React.ReactNode[]
  isSelected?: boolean
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

function HeaderLineSectionRenderer({ children }: PreviewProps) {
  return <div className="prev-page-root">{children}</div>
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

// ─── Action Components ───────────────────────────────────────────────────────

function ButtonRenderer(props: PreviewProps) {
  const label = bindingLabel(props.node, 'label', props.node.props?.label as string || 'Button')
  const variant = props.node.props?.variant as string ?? 'primary'
  return (
    <button className={`prev-button prev-button--${variant}`} disabled>
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

// ─── Render Map — both PascalCase and snake_case ──────────────────────────────

export const COMPONENT_RENDER_MAP: Record<string, PreviewRenderer> = {
  // Layout — PascalCase (from registry)
  PageRoot: PageRoot,
  Section: SectionRenderer,
  Row: RowRenderer,
  Column: ColumnRenderer,
  Toolbar: ToolbarRenderer,
  HeaderLineSection: HeaderLineSectionRenderer,
  ConditionalContainer: ConditionalContainerRenderer,
  Tabs: SectionRenderer,
  Modal: SectionRenderer,

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
  grid_row: RowRenderer,
  grid_column: ColumnRenderer,
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
  related_list: DataTableRenderer,
  button: ButtonRenderer,
  toolbar: ToolbarRenderer,
  filter_panel: FilterPanelRenderer,
  conditional_container: ConditionalContainerRenderer,
  header_line_section: HeaderLineSectionRenderer,
}

/** Get renderer for a component code, with fallback */
export function getRenderer(componentCode: string): PreviewRenderer {
  return COMPONENT_RENDER_MAP[componentCode] ?? FallbackComponent
}
