/**
 * ComponentRenderMap — Maps component_code to preview React components
 *
 * This is the render map used by the live preview mode in the View Designer.
 * Each component_code maps to a functional component that renders a preview
 * representation in the canvas.
 */

import React from 'react'
import type { ComponentNode } from '../../../types/viewStudio'

export type PreviewRenderer = (props: PreviewProps) => React.ReactNode

export interface PreviewProps {
  node: ComponentNode
  children?: React.ReactNode[]
  isSelected?: boolean
}

// ─── Layout Components ───────────────────────────────────────────────────────

function PageRoot({ node, children }: PreviewProps) {
  return (
    <div className="prev-page-root" data-key={node.component_key}>
      {children}
    </div>
  )
}

function Section({ node, children }: PreviewProps) {
  return (
    <div className="prev-section" data-key={node.component_key}>
      <div className="prev-section__title">{node.props?.title as string || node.label || 'Section'}</div>
      <div className="prev-section__content">{children}</div>
    </div>
  )
}

function Card({ node, children }: PreviewProps) {
  return (
    <div className="prev-card" data-key={node.component_key}>
      {!!node.props?.title && <div className="prev-card__title">{node.props.title as string}</div>}
      <div className="prev-card__body">{children}</div>
    </div>
  )
}

function GridRow({ node, children }: PreviewProps) {
  const cols = (node.props?.columns as number) ?? 12
  return (
    <div className="prev-grid-row" data-key={node.component_key} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  )
}

function GridColumn({ node, children }: PreviewProps) {
  const span = (node.props?.span as number) ?? 6
  return (
    <div className="prev-grid-col" data-key={node.component_key} style={{ gridColumn: `span ${span}` }}>
      {children}
    </div>
  )
}

function TabContainer({ node, children }: PreviewProps) {
  return (
    <div className="prev-tabs" data-key={node.component_key}>
      <div className="prev-tabs__bar">
        {(node.children ?? []).map((child, idx) => (
          <span key={idx} className={`prev-tabs__tab ${idx === 0 ? 'prev-tabs__tab--active' : ''}`}>
            {child.props?.title as string || child.label || `Tab ${idx + 1}`}
          </span>
        ))}
      </div>
      <div className="prev-tabs__content">{children}</div>
    </div>
  )
}

function Accordion({ node, children }: PreviewProps) {
  return (
    <div className="prev-accordion" data-key={node.component_key}>
      <div className="prev-accordion__header">{node.props?.title as string || 'Accordion'} ▾</div>
      <div className="prev-accordion__content">{children}</div>
    </div>
  )
}

// ─── Input Components ────────────────────────────────────────────────────────

function TextInput({ node }: PreviewProps) {
  return (
    <div className="prev-input" data-key={node.component_key}>
      <label className="prev-input__label">{node.props?.label as string || node.label || 'Text Input'}</label>
      <div className="prev-input__field">
        <input type="text" placeholder={node.props?.placeholder as string || ''} disabled />
      </div>
    </div>
  )
}

function NumberInput({ node }: PreviewProps) {
  return (
    <div className="prev-input" data-key={node.component_key}>
      <label className="prev-input__label">{node.props?.label as string || 'Number'}</label>
      <div className="prev-input__field">
        <input type="number" placeholder="0" disabled />
      </div>
    </div>
  )
}

function DatePicker({ node }: PreviewProps) {
  return (
    <div className="prev-input" data-key={node.component_key}>
      <label className="prev-input__label">{node.props?.label as string || 'Date'}</label>
      <div className="prev-input__field">
        <input type="date" disabled />
      </div>
    </div>
  )
}

function DropdownSelect({ node }: PreviewProps) {
  return (
    <div className="prev-input" data-key={node.component_key}>
      <label className="prev-input__label">{node.props?.label as string || 'Select'}</label>
      <div className="prev-input__field">
        <select disabled><option>{node.props?.placeholder as string || 'Select...'}</option></select>
      </div>
    </div>
  )
}

function Checkbox({ node }: PreviewProps) {
  return (
    <div className="prev-checkbox" data-key={node.component_key}>
      <input type="checkbox" disabled />
      <label>{node.props?.label as string || 'Checkbox'}</label>
    </div>
  )
}

function ToggleSwitch({ node }: PreviewProps) {
  return (
    <div className="prev-toggle" data-key={node.component_key}>
      <div className="prev-toggle__track"><div className="prev-toggle__thumb" /></div>
      <label>{node.props?.label as string || 'Toggle'}</label>
    </div>
  )
}

function Textarea({ node }: PreviewProps) {
  return (
    <div className="prev-input" data-key={node.component_key}>
      <label className="prev-input__label">{node.props?.label as string || 'Textarea'}</label>
      <div className="prev-input__field">
        <textarea rows={3} placeholder={node.props?.placeholder as string || ''} disabled />
      </div>
    </div>
  )
}

function FileUpload({ node }: PreviewProps) {
  return (
    <div className="prev-input" data-key={node.component_key}>
      <label className="prev-input__label">{node.props?.label as string || 'File Upload'}</label>
      <div className="prev-file-drop">Click or drag file here</div>
    </div>
  )
}

// ─── Display Components ──────────────────────────────────────────────────────

function Heading({ node }: PreviewProps) {
  const level = (node.props?.level as number) ?? 2
  const Tag = `h${level}` as React.ElementType
  return <Tag className="prev-heading" data-key={node.component_key}>{node.props?.text as string || 'Heading'}</Tag>
}

function Paragraph({ node }: PreviewProps) {
  return <p className="prev-paragraph" data-key={node.component_key}>{node.props?.text as string || 'Paragraph text...'}</p>
}

function BadgePreview({ node }: PreviewProps) {
  return <span className="prev-badge" data-key={node.component_key}>{node.props?.text as string || 'Badge'}</span>
}

function Divider({ node }: PreviewProps) {
  return <hr className="prev-divider" data-key={node.component_key} />
}

function Spacer({ node }: PreviewProps) {
  const size = (node.props?.size as number) ?? 16
  return <div className="prev-spacer" data-key={node.component_key} style={{ height: size }} />
}

function AlertBanner({ node }: PreviewProps) {
  return (
    <div className={`prev-alert prev-alert--${node.props?.variant ?? 'info'}`} data-key={node.component_key}>
      {node.props?.message as string || 'Alert message'}
    </div>
  )
}

function ProgressBar({ node }: PreviewProps) {
  const value = (node.props?.value as number) ?? 60
  return (
    <div className="prev-progress" data-key={node.component_key}>
      <div className="prev-progress__bar" style={{ width: `${value}%` }} />
    </div>
  )
}

// ─── Data Components ─────────────────────────────────────────────────────────

function DataTable({ node }: PreviewProps) {
  return (
    <div className="prev-table" data-key={node.component_key}>
      <div className="prev-table__header">
        <span>Column 1</span><span>Column 2</span><span>Column 3</span>
      </div>
      <div className="prev-table__row"><span>Data</span><span>Data</span><span>Data</span></div>
      <div className="prev-table__row"><span>Data</span><span>Data</span><span>Data</span></div>
    </div>
  )
}

// ─── Action Components ───────────────────────────────────────────────────────

function ButtonPreview({ node }: PreviewProps) {
  return (
    <button className={`prev-button prev-button--${node.props?.variant ?? 'primary'}`} data-key={node.component_key} disabled>
      {node.props?.label as string || 'Button'}
    </button>
  )
}

function ToolbarPreview({ node, children }: PreviewProps) {
  return (
    <div className="prev-toolbar" data-key={node.component_key}>
      {children}
    </div>
  )
}

// ─── Fallback ────────────────────────────────────────────────────────────────

function FallbackComponent({ node, children }: PreviewProps) {
  return (
    <div className="prev-fallback" data-key={node.component_key}>
      <span className="prev-fallback__label">[{node.component_code}]</span>
      {children}
    </div>
  )
}

// ─── Render Map ──────────────────────────────────────────────────────────────

export const COMPONENT_RENDER_MAP: Record<string, PreviewRenderer> = {
  // Layout
  page_root: PageRoot,
  section: Section,
  card: Card,
  grid_row: GridRow,
  grid_column: GridColumn,
  tab_container: TabContainer,
  tab_panel: Section,
  accordion: Accordion,
  split_pane: GridRow,
  drawer_panel: Section,
  modal_container: Card,
  wizard_step_container: Section,

  // Input
  text_input: TextInput,
  number_input: NumberInput,
  currency_input: NumberInput,
  date_picker: DatePicker,
  time_picker: DatePicker,
  datetime_picker: DatePicker,
  dropdown_select: DropdownSelect,
  multi_select: DropdownSelect,
  checkbox: Checkbox,
  checkbox_group: Checkbox,
  radio_group: DropdownSelect,
  toggle_switch: ToggleSwitch,
  textarea: Textarea,
  rich_text_editor: Textarea,
  file_upload: FileUpload,
  slider_range: NumberInput,
  tag_input: TextInput,
  address_block: TextInput,
  phone_input: TextInput,
  code_editor: Textarea,
  stepper_input: NumberInput,
  color_picker: TextInput,

  // Display
  label: Paragraph,
  heading: Heading,
  paragraph: Paragraph,
  badge: BadgePreview,
  status_badge: BadgePreview,
  avatar: BadgePreview,
  icon: BadgePreview,
  image: BadgePreview,
  divider: Divider,
  spacer: Spacer,
  progress_bar: ProgressBar,
  color_indicator: BadgePreview,
  timer_countdown: BadgePreview,
  copy_field: TextInput,
  empty_state: AlertBanner,
  alert_banner: AlertBanner,

  // Data
  data_table: DataTable,
  data_card_grid: DataTable,
  metric_comparison: DataTable,
  related_list: DataTable,
  tree_view: DataTable,
  kanban_board: DataTable,
  calendar_view: DataTable,
  timeline: DataTable,

  // Action
  button: ButtonPreview,
  icon_button: ButtonPreview,
  link: ButtonPreview,
  action_menu: ButtonPreview,
  toolbar: ToolbarPreview,

  // Navigation
  breadcrumb_nav: ToolbarPreview,
  tab_group: TabContainer,
  stepper: ToolbarPreview,
  pagination: ToolbarPreview,

  // Composite
  header_line_section: Section,
  form_section: Section,
  search_bar: TextInput,
  filter_panel: Section,
  detail_panel: Section,
  comment_thread: Section,
  file_preview: Card,

  // Container
  repeater: Section,
  conditional_container: Section,
}

/** Get renderer for a component code, with fallback */
export function getRenderer(componentCode: string): PreviewRenderer {
  return COMPONENT_RENDER_MAP[componentCode] ?? FallbackComponent
}
