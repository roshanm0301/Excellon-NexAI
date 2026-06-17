import { http, HttpResponse } from 'msw'
import { seedViews } from '../data/views'

const VIEWS_KEY = 'msw_views_v4'

// Matches the View type from types/viewStudio.ts exactly
interface ViewRecord {
  artifact_id: string
  artifact_name: string
  artifact_type: string
  tenant_id: string
  node_id?: string
  surface_type: string
  primary_entity: string
  view_code?: string
  view_label: string
  view_category?: string
  created_at: string
  updated_at: string
  created_by: string
  revision: number
  latest_version_id?: string
  latest_version_no?: number
  is_draft: boolean
  is_active: boolean
  // internal draft storage
  _draft_payload?: Record<string, unknown>
  _versions?: Array<{
    version_id: string
    artifact_id: string
    version_no: number
    payload: Record<string, unknown>
    is_active: boolean
    is_draft: boolean
    created_at: string
    created_by: string
    revision: number
    published_at?: string
    published_by?: string
  }>
}

function loadViews(): ViewRecord[] {
  try {
    const raw = localStorage.getItem(VIEWS_KEY)
    if (raw) return JSON.parse(raw) as ViewRecord[]
  } catch { /* ignore */ }
  return seedViews.map(v => ({ ...v }))
}

function saveViews(views: ViewRecord[]) {
  try { localStorage.setItem(VIEWS_KEY, JSON.stringify(views)) } catch { /* ignore */ }
}

// Always read from localStorage so that after reset+reload the store starts empty
function getStore(): ViewRecord[] {
  return loadViews()
}

// Mutable reference — module-level array backed by localStorage
const viewStore: ViewRecord[] = getStore()

function now() { return new Date().toISOString() }
function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Strip internal fields before returning to client
function toView(v: ViewRecord) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _draft_payload, _versions, ...pub } = v
  const has_published = (v._versions ?? []).some(ver => ver.is_active)
  return { ...pub, has_published }
}

function toViewWithPayload(v: ViewRecord) {
  return { ...toView(v), latest_payload: v._draft_payload ?? {} }
}

// Component codes match the canonical snake_case codes in db/migrations/20260602000002_seed_component_registry.up.sql
const COMPONENT_REGISTRY = [
  { component_code: 'text_input', component_name: 'Text Input', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'placeholder', 'disabled', 'readOnly'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change', 'on_focus', 'on_blur'], handles: [] }, permission_behavior: {}, runtime_renderer: 'TextInputRenderer', designer_panel: 'TextInputPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'number_input', component_name: 'Number Input', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'min', 'max', 'disabled'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'NumberInputRenderer', designer_panel: 'NumberInputPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'date_picker', component_name: 'Date Picker', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'disabled'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'DatePickerRenderer', designer_panel: 'DatePickerPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'dropdown_select', component_name: 'Dropdown', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'options', 'disabled'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'DropdownSelectRenderer', designer_panel: 'DropdownSelectPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'checkbox', component_name: 'Checkbox', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['checked', 'label', 'disabled'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'CheckboxRenderer', designer_panel: 'CheckboxPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'textarea', component_name: 'Textarea', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'rows', 'disabled'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'TextareaRenderer', designer_panel: 'TextareaPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'button', component_name: 'Button', category: 'action', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['label', 'disabled', 'variant'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_click'], handles: [] }, permission_behavior: {}, runtime_renderer: 'ButtonRenderer', designer_panel: 'ButtonPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'data_table', component_name: 'Data Table', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['data', 'columns', 'loading'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_row_select', 'on_load'], handles: [] }, permission_behavior: {}, runtime_renderer: 'DataTableRenderer', designer_panel: 'DataTablePanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'label', component_name: 'Label / Text', category: 'display', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'format'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'LabelRenderer', designer_panel: 'LabelPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'badge', component_name: 'Badge', category: 'display', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'variant'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'BadgeRenderer', designer_panel: 'BadgePanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'page_root', component_name: 'Page Root', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: [], is_container: true, allowed_parents: [], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: ['on_load'], handles: [] }, permission_behavior: {}, runtime_renderer: 'PageRootRenderer', designer_panel: 'PageRootPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'section', component_name: 'Section', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['title', 'visible'], is_container: true, allowed_parents: ['page_root', 'grid_row', 'grid_column'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'SectionRenderer', designer_panel: 'SectionPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'grid_row', component_name: 'Grid Row', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: [], is_container: true, allowed_parents: ['all'], allowed_children: ['grid_column'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'GridRowRenderer', designer_panel: 'GridRowPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'grid_column', component_name: 'Grid Column', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: [], is_container: true, allowed_parents: ['grid_row'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'GridColumnRenderer', designer_panel: 'GridColumnPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'conditional_container', component_name: 'Conditional Container', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['visible'], is_container: true, allowed_parents: ['all'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'ConditionalContainerRenderer', designer_panel: 'ConditionalContainerPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'filter_panel', component_name: 'Filter Panel', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['filters'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'FilterPanelRenderer', designer_panel: 'FilterPanelPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'metric_comparison', component_name: 'Metric Comparison', category: 'display', version: '1.0.0', source: 'platform', supported_surfaces: ['dashboard'], supported_bindings: ['value', 'label', 'comparison', 'trend'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'MetricComparisonRenderer', designer_panel: 'MetricComparisonPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'data_card_grid', component_name: 'Data Card Grid', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['data', 'loading'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_row_select'], handles: [] }, permission_behavior: {}, runtime_renderer: 'DataCardGridRenderer', designer_panel: 'DataCardGridPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'status_badge', component_name: 'Status Badge', category: 'display', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['status', 'statusMap'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'StatusBadgeRenderer', designer_panel: 'StatusBadgePanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'reference_select', component_name: 'Reference Select', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'entity', 'disabled'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'ReferenceSelectRenderer', designer_panel: 'ReferenceSelectPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'file_upload', component_name: 'File Upload', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'accept', 'disabled'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'FileUploadRenderer', designer_panel: 'FileUploadPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'tab_container', component_name: 'Tab Container', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['activeTab'], is_container: true, allowed_parents: ['all'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'TabContainerRenderer', designer_panel: 'TabContainerPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'modal_container', component_name: 'Modal Container', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['open', 'title'], is_container: true, allowed_parents: ['all'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: ['on_modal_open', 'on_modal_close'], handles: [] }, permission_behavior: {}, runtime_renderer: 'ModalContainerRenderer', designer_panel: 'ModalContainerPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'toolbar', component_name: 'Toolbar', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: [], is_container: true, allowed_parents: ['page_root'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'ToolbarRenderer', designer_panel: 'ToolbarPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'header_line_section', component_name: 'Header + Line Section', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['header_line'], supported_bindings: [], is_container: true, allowed_parents: ['page_root'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'HeaderLineSectionRenderer', designer_panel: 'HeaderLineSectionPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'totals_panel', component_name: 'Totals Panel', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['header_line', 'standard_crud'], supported_bindings: ['line_items'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'TotalsPanelRenderer', designer_panel: 'TotalsPanelPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'tax_charge_column', component_name: 'Tax / Charge Column', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['header_line'], supported_bindings: ['rate', 'label'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'TaxChargeRenderer', designer_panel: 'TaxChargePanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'related_list', component_name: 'Related List', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['data', 'columns'], is_container: false, allowed_parents: ['all'], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_row_select'], handles: [] }, permission_behavior: {}, runtime_renderer: 'RelatedListRenderer', designer_panel: 'RelatedListPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'drawer_container', component_name: 'Drawer Container', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['open', 'title'], is_container: true, allowed_parents: ['page_root'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: ['on_open', 'on_close'], handles: [] }, permission_behavior: {}, runtime_renderer: 'DrawerContainerRenderer', designer_panel: 'DrawerContainerPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'side_panel', component_name: 'Side Panel', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['title'], is_container: true, allowed_parents: ['page_root'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'SidePanelRenderer', designer_panel: 'SidePanelPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'dashboard_grid', component_name: 'Dashboard Grid', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['dashboard'], supported_bindings: [], is_container: true, allowed_parents: ['page_root'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'DashboardGridRenderer', designer_panel: 'DashboardGridPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'wizard_step', component_name: 'Wizard Step', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['wizard'], supported_bindings: ['title', 'step'], is_container: true, allowed_parents: ['page_root', 'wizard_step_container'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: ['on_next', 'on_back'], handles: [] }, permission_behavior: {}, runtime_renderer: 'WizardStepRenderer', designer_panel: 'WizardStepPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'split_panel', component_name: 'Split Panel', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: [], is_container: true, allowed_parents: ['page_root', 'section'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'SplitPanelRenderer', designer_panel: 'SplitPanelPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'kanban_board', component_name: 'Kanban Board', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['dashboard', 'all'], supported_bindings: ['data', 'columns'], is_container: true, allowed_parents: ['page_root'], allowed_children: ['all'], config_schema: {}, default_props: {}, event_support: { emits: ['on_card_move'], handles: [] }, permission_behavior: {}, runtime_renderer: 'KanbanBoardRenderer', designer_panel: 'KanbanBoardPanel', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
]

export const viewHandlers = [
  // List views
  http.get('/api/v1/studio/views', ({ request }) => {
    const store = loadViews()
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()
    const surface = url.searchParams.get('surface') ?? url.searchParams.get('surface_type')
    const entity = url.searchParams.get('entity')
    const status = url.searchParams.get('status')
    let items = store
    if (search) items = items.filter(v => v.view_label.toLowerCase().includes(search) || (v.view_code ?? '').toLowerCase().includes(search))
    if (surface) items = items.filter(v => v.surface_type === surface)
    if (entity === '__unassigned__') items = items.filter(v => !v.primary_entity)
    else if (entity) items = items.filter(v => v.primary_entity === entity)
    if (status === 'draft') items = items.filter(v => v.is_draft)
    if (status === 'published') items = items.filter(v => v.is_active && !v.is_draft)
    return HttpResponse.json({ items: items.map(toView), total: items.length })
  }),

  // View stats — entity counts (must be before /:key to avoid route collision)
  http.get('/api/v1/studio/views/stats', () => {
    const store = loadViews()
    const counts: Record<string, number> = {}
    for (const v of store) {
      if (v.primary_entity) {
        counts[v.primary_entity] = (counts[v.primary_entity] ?? 0) + 1
      }
    }
    const by_entity = Object.entries(counts)
      .map(([entity, count]) => ({ entity, count }))
      .sort((a, b) => b.count - a.count || a.entity.localeCompare(b.entity))
    return HttpResponse.json({ by_entity })
  }),

  // Create view
  http.post('/api/v1/studio/views', async ({ request }) => {
    const store = loadViews()
    const body = await request.json() as Record<string, unknown>
    const newView: ViewRecord = {
      artifact_id: randomId(),
      artifact_name: String(body.view_label ?? 'Untitled View'),
      artifact_type: 'view',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      surface_type: String(body.surface_type ?? 'standard_crud'),
      primary_entity: String(body.primary_entity ?? ''),
      view_code: body.view_code ? String(body.view_code) : undefined,
      view_label: String(body.view_label ?? 'Untitled View'),
      view_category: body.view_category ? String(body.view_category) : undefined,
      is_draft: true,
      is_active: false,
      created_at: now(),
      updated_at: now(),
      created_by: '00000000-0000-0000-0000-000000000001',
      revision: 1,
      _draft_payload: (body.payload as Record<string, unknown>) ?? {},
      _versions: [],
    }
    store.push(newView)
    // sync in-memory store
    viewStore.length = 0; store.forEach(v => viewStore.push(v))
    saveViews(store)
    return HttpResponse.json(toView(newView), { status: 201 })
  }),

  // Get view by artifact_id
  http.get('/api/v1/studio/views/:key', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(toViewWithPayload(view))
  }),

  // Save draft
  http.put('/api/v1/studio/views/:key/draft', async ({ params, request }) => {
    const store = loadViews()
    const idx = store.findIndex(v => v.artifact_id === params.key || v.view_code === params.key)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const body = await request.json() as { payload: Record<string, unknown> }
    const versionId = randomId()
    const versionNo = (store[idx]._versions?.length ?? 0) + 1
    const draft = {
      version_id: versionId,
      artifact_id: store[idx].artifact_id,
      version_no: versionNo,
      is_draft: true,
      is_active: false,
      payload: body.payload,
      created_at: now(),
      created_by: '00000000-0000-0000-0000-000000000001',
      revision: (store[idx].revision ?? 1) + 1,
    }
    store[idx] = {
      ...store[idx],
      _draft_payload: body.payload,
      latest_version_id: versionId,
      latest_version_no: versionNo,
      is_draft: true,
      revision: (store[idx].revision ?? 1) + 1,
      updated_at: now(),
    }
    viewStore.length = 0; store.forEach(v => viewStore.push(v))
    saveViews(store)
    return HttpResponse.json(draft)
  }),

  // Publish view
  http.post('/api/v1/studio/views/:key/publish', async ({ params }) => {
    const store = loadViews()
    const idx = store.findIndex(v => v.artifact_id === params.key || v.view_code === params.key)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const versionId = store[idx].latest_version_id ?? randomId()
    const versionNo = store[idx].latest_version_no ?? 1
    const published = {
      version_id: versionId,
      artifact_id: store[idx].artifact_id,
      version_no: versionNo,
      is_draft: false,
      is_active: true,
      payload: store[idx]._draft_payload ?? {},
      created_at: now(),
      created_by: '00000000-0000-0000-0000-000000000001',
      revision: store[idx].revision ?? 1,
      published_at: now(),
      published_by: '00000000-0000-0000-0000-000000000001',
    }
    const versions = [...(store[idx]._versions ?? []), published]
    store[idx] = {
      ...store[idx],
      _versions: versions,
      is_draft: false,
      is_active: true,
      updated_at: now(),
    }
    viewStore.length = 0; store.forEach(v => viewStore.push(v))
    saveViews(store)
    return HttpResponse.json(published)
  }),

  // Rollback
  http.post('/api/v1/studio/views/:key/rollback/:vId', ({ params }) => {
    const store = loadViews()
    const idx = store.findIndex(v => v.artifact_id === params.key || v.view_code === params.key)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const ver = (store[idx]._versions ?? []).find(v => v.version_id === params.vId)
    if (!ver) return new HttpResponse(null, { status: 404 })
    store[idx] = { ...store[idx], _draft_payload: ver.payload, is_draft: true, updated_at: now() }
    viewStore.length = 0; store.forEach(v => viewStore.push(v))
    saveViews(store)
    return HttpResponse.json(ver)
  }),

  // Duplicate view
  http.post('/api/v1/studio/views/:key/duplicate', ({ params }) => {
    const store = loadViews()
    const source = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!source) return new HttpResponse(null, { status: 404 })
    const copy: ViewRecord = {
      ...source,
      artifact_id: randomId(),
      view_label: `${source.view_label} (Copy)`,
      view_code: undefined,
      is_draft: true,
      is_active: false,
      created_at: now(),
      updated_at: now(),
      revision: 1,
      _versions: [],
    }
    store.push(copy)
    saveViews(store)
    return HttpResponse.json(toView(copy), { status: 201 })
  }),

  // Unpublish view
  http.post('/api/v1/studio/views/:key/unpublish', ({ params }) => {
    const store = loadViews()
    const idx = store.findIndex(v => v.artifact_id === params.key || v.view_code === params.key)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store[idx] = { ...store[idx], is_active: false, is_draft: true, updated_at: now() }
    saveViews(store)
    return new HttpResponse(null, { status: 204 })
  }),

  // Delete view
  http.delete('/api/v1/studio/views/:key', ({ params }) => {
    const store = loadViews()
    const idx = store.findIndex(v => v.artifact_id === params.key || v.view_code === params.key)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.splice(idx, 1)
    viewStore.length = 0; store.forEach(v => viewStore.push(v))
    saveViews(store)
    return new HttpResponse(null, { status: 204 })
  }),

  // List versions
  http.get('/api/v1/studio/views/:key/versions', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ items: view._versions ?? [], total: (view._versions ?? []).length })
  }),

  // Component registry
  http.get('/api/v1/studio/component-registry', () => {
    return HttpResponse.json(COMPONENT_REGISTRY)
  }),

  http.get('/api/v1/studio/component-registry/:code', ({ params }) => {
    const entry = COMPONENT_REGISTRY.find(c => c.component_code === params.code)
    if (!entry) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(entry)
  }),

  // Runtime views
  http.get('/api/v1/studio/runtime/views/:key', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!view?._draft_payload) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ payload: view._draft_payload })
  }),

  http.get('/api/v1/studio/runtime/views/by-code/:code', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.view_code === params.code)
    if (!view?._draft_payload) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ payload: view._draft_payload })
  }),

  // Plugins
  http.get('/api/v1/studio/plugins', () => HttpResponse.json([])),
  http.post('/api/v1/studio/plugins', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: randomId(), ...(body as object), created_at: now() }, { status: 201 })
  }),
  http.delete('/api/v1/studio/plugins/:id', () => new HttpResponse(null, { status: 204 })),

  // ── Governance routes (M7) ──────────────────────────────────────────────────

  // List variants from payload
  http.get('/api/v1/studio/views/:key/variants', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    const payload = view._draft_payload as Record<string, unknown> | undefined
    const variants = (payload?.variants as unknown[]) ?? []
    return HttpResponse.json({ items: variants })
  }),

  // List events from payload
  http.get('/api/v1/studio/views/:key/events', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    const payload = view._draft_payload as Record<string, unknown> | undefined
    const events = (payload?.events as unknown[]) ?? []
    return HttpResponse.json({ items: events })
  }),

  // List datasources from payload
  http.get('/api/v1/studio/views/:key/datasources', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    const payload = view._draft_payload as Record<string, unknown> | undefined
    const datasources = (payload?.datasources as unknown[]) ?? (payload?.data_sources as unknown[]) ?? []
    return HttpResponse.json({ items: datasources })
  }),

  // Diff versions
  http.get('/api/v1/studio/views/:key/diff', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    // Return empty diff by default in mock
    return HttpResponse.json({ changes: [] })
  }),

  // Export view
  http.get('/api/v1/studio/views/:key/export', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    const pkg = {
      version: '1.0',
      exported_at: now(),
      view_meta: {
        view_label: view.view_label,
        surface_type: view.surface_type,
        primary_entity: view.primary_entity,
        view_code: view.view_code,
      },
      payload: view._draft_payload ?? {},
    }
    return HttpResponse.json(pkg, {
      headers: { 'Content-Disposition': `attachment; filename="view-${params.key}.json"` },
    })
  }),

  // Import view
  http.post('/api/v1/studio/views/import', async ({ request }) => {
    const store = loadViews()
    const body = await request.json() as Record<string, unknown>
    const meta = body.view_meta as Record<string, unknown> | undefined
    const newView: ViewRecord = {
      artifact_id: randomId(),
      artifact_name: String(meta?.view_label ?? 'Imported View'),
      artifact_type: 'view',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      surface_type: String(meta?.surface_type ?? 'standard_crud'),
      primary_entity: String(meta?.primary_entity ?? ''),
      view_code: meta?.view_code ? String(meta.view_code) : undefined,
      view_label: String(meta?.view_label ?? 'Imported View') + ' (Imported)',
      is_draft: true,
      is_active: false,
      created_at: now(),
      updated_at: now(),
      created_by: '00000000-0000-0000-0000-000000000001',
      revision: 1,
      _draft_payload: (body.payload as Record<string, unknown>) ?? {},
      _versions: [],
    }
    store.push(newView)
    viewStore.length = 0; store.forEach(v => viewStore.push(v))
    saveViews(store)
    return HttpResponse.json(toView(newView), { status: 201 })
  }),

  // Sync status
  http.get('/api/v1/studio/views/:key/sync-status', ({ params }) => {
    const store = loadViews()
    const view = store.find(v => v.artifact_id === params.key || v.view_code === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({
      status: 'up_to_date',
      schema_version: '1.0.0',
      last_checked: new Date().toISOString(),
      broken_bindings: [],
    })
  }),

  // Validate (dry-run) — already in MSW for publish, add validate route
  http.post('/api/v1/studio/views/:key/validate', () => {
    return HttpResponse.json({ errors: [], warnings: [] })
  }),

  // Entity Schema (M3.2) — DMS entity types matching db/seeds/test_entities.sql
  http.get('/api/v1/studio/entities', () => {
    return HttpResponse.json({
      items: [
        { entity_type: 'customer',         display_name: 'Customer' },
        { entity_type: 'employee',         display_name: 'Employee' },
        { entity_type: 'finance_company',  display_name: 'Finance Company' },
        { entity_type: 'part_category',    display_name: 'Part Category' },
        { entity_type: 'parts',            display_name: 'Parts' },
        { entity_type: 'parts_request',    display_name: 'Parts Request' },
        { entity_type: 'purchase_order',   display_name: 'Purchase Order' },
        { entity_type: 'sale_order',       display_name: 'Sale Order' },
        { entity_type: 'service_order',    display_name: 'Service Order' },
        { entity_type: 'supplier',         display_name: 'Supplier' },
        { entity_type: 'technician',       display_name: 'Technician' },
        { entity_type: 'vehicle',          display_name: 'Vehicle' },
      ],
    })
  }),

  http.get('/api/v1/studio/entities/:entityType/fields', ({ params }) => {
    const ENTITY_FIELDS: Record<string, Array<{ field_key: string; label: string; field_type: string; required: boolean; read_only: boolean; is_relation: boolean }>> = {
      customer: [
        { field_key: 'id', label: 'ID', field_type: 'uuid', required: true, read_only: true, is_relation: false },
        { field_key: 'name', label: 'Name', field_type: 'text', required: true, read_only: false, is_relation: false },
        { field_key: 'email', label: 'Email', field_type: 'email', required: false, read_only: false, is_relation: false },
        { field_key: 'phone', label: 'Phone', field_type: 'text', required: false, read_only: false, is_relation: false },
        { field_key: 'created_at', label: 'Created At', field_type: 'datetime', required: false, read_only: true, is_relation: false },
      ],
      order: [
        { field_key: 'id', label: 'ID', field_type: 'uuid', required: true, read_only: true, is_relation: false },
        { field_key: 'order_number', label: 'Order Number', field_type: 'text', required: true, read_only: true, is_relation: false },
        { field_key: 'status', label: 'Status', field_type: 'enum', required: true, read_only: false, is_relation: false },
        { field_key: 'total_amount', label: 'Total Amount', field_type: 'decimal', required: false, read_only: true, is_relation: false },
        { field_key: 'customer_id', label: 'Customer', field_type: 'relation', required: true, read_only: false, is_relation: true },
      ],
      product: [
        { field_key: 'id', label: 'ID', field_type: 'uuid', required: true, read_only: true, is_relation: false },
        { field_key: 'name', label: 'Product Name', field_type: 'text', required: true, read_only: false, is_relation: false },
        { field_key: 'sku', label: 'SKU', field_type: 'text', required: true, read_only: false, is_relation: false },
        { field_key: 'price', label: 'Price', field_type: 'decimal', required: true, read_only: false, is_relation: false },
        { field_key: 'stock_qty', label: 'Stock Qty', field_type: 'integer', required: false, read_only: false, is_relation: false },
      ],
      invoice: [
        { field_key: 'id', label: 'ID', field_type: 'uuid', required: true, read_only: true, is_relation: false },
        { field_key: 'invoice_number', label: 'Invoice Number', field_type: 'text', required: true, read_only: true, is_relation: false },
        { field_key: 'due_date', label: 'Due Date', field_type: 'date', required: true, read_only: false, is_relation: false },
        { field_key: 'amount_due', label: 'Amount Due', field_type: 'decimal', required: false, read_only: true, is_relation: false },
      ],
    }
    const fields = ENTITY_FIELDS[params.entityType as string] ?? []
    return HttpResponse.json({ items: fields })
  }),
]
