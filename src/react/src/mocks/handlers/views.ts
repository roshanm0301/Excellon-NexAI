import { http, HttpResponse } from 'msw'
import { seedViews } from '../data/views'

const VIEWS_KEY = 'msw_views'

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
  return pub
}

function toViewWithPayload(v: ViewRecord) {
  return { ...toView(v), latest_payload: v._draft_payload ?? {} }
}

const COMPONENT_REGISTRY = [
  { component_code: 'TextInput', component_name: 'Text Input', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'placeholder', 'disabled', 'readOnly'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change', 'on_focus', 'on_blur'], handles: [] }, permission_behavior: {}, runtime_renderer: 'TextInput', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'NumberInput', component_name: 'Number Input', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'min', 'max', 'disabled'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'NumberInput', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'DatePicker', component_name: 'Date Picker', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'disabled'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'DatePicker', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Dropdown', component_name: 'Dropdown', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'options', 'disabled'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'Dropdown', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Checkbox', component_name: 'Checkbox', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['checked', 'label', 'disabled'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'Checkbox', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Textarea', component_name: 'Textarea', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'rows', 'disabled'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'Textarea', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Button', component_name: 'Button', category: 'action', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['label', 'disabled', 'variant'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_click'], handles: [] }, permission_behavior: {}, runtime_renderer: 'Button', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'DataTable', component_name: 'Data Table', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['data', 'columns', 'loading'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_row_select', 'on_load'], handles: [] }, permission_behavior: {}, runtime_renderer: 'DataTable', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Label', component_name: 'Label / Text', category: 'display', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'format'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'Label', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Badge', component_name: 'Badge', category: 'display', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'variant'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'Badge', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'PageRoot', component_name: 'Page Root', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: [], is_container: true, allowed_parents: [], allowed_children: ['*'], config_schema: {}, default_props: {}, event_support: { emits: ['on_load'], handles: [] }, permission_behavior: {}, runtime_renderer: 'PageRoot', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Section', component_name: 'Section', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['title', 'visible'], is_container: true, allowed_parents: ['PageRoot', 'Row', 'Column'], allowed_children: ['*'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'Section', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Row', component_name: 'Row', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: [], is_container: true, allowed_parents: ['*'], allowed_children: ['Column', '*'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'Row', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Column', component_name: 'Column', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: [], is_container: true, allowed_parents: ['Row'], allowed_children: ['*'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'Column', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'ConditionalContainer', component_name: 'Conditional Container', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['visible'], is_container: true, allowed_parents: ['*'], allowed_children: ['*'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'ConditionalContainer', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'FilterPanel', component_name: 'Filter Panel', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['filters'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'FilterPanel', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'MetricComparison', component_name: 'Metric Comparison', category: 'display', version: '1.0.0', source: 'platform', supported_surfaces: ['dashboard'], supported_bindings: ['value', 'label', 'comparison', 'trend'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'MetricComparison', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'DataCardGrid', component_name: 'Data Card Grid', category: 'data', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['data', 'loading'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_row_select'], handles: [] }, permission_behavior: {}, runtime_renderer: 'DataCardGrid', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'StatusBadge', component_name: 'Status Badge', category: 'display', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['status', 'statusMap'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'StatusBadge', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'ReferenceSelect', component_name: 'Reference Select', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'label', 'entity', 'disabled'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'ReferenceSelect', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'FileUpload', component_name: 'File Upload', category: 'input', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['value', 'accept', 'disabled'], is_container: false, allowed_parents: [], allowed_children: [], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'FileUpload', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Tabs', component_name: 'Tabs', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['activeTab'], is_container: true, allowed_parents: ['*'], allowed_children: ['*'], config_schema: {}, default_props: {}, event_support: { emits: ['on_change'], handles: [] }, permission_behavior: {}, runtime_renderer: 'Tabs', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Modal', component_name: 'Modal', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: ['open', 'title'], is_container: true, allowed_parents: ['*'], allowed_children: ['*'], config_schema: {}, default_props: {}, event_support: { emits: ['on_modal_open', 'on_modal_close'], handles: [] }, permission_behavior: {}, runtime_renderer: 'Modal', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'Toolbar', component_name: 'Toolbar', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['all'], supported_bindings: [], is_container: true, allowed_parents: ['PageRoot'], allowed_children: ['Button', '*'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'Toolbar', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
  { component_code: 'HeaderLineSection', component_name: 'Header + Line Section', category: 'layout', version: '1.0.0', source: 'platform', supported_surfaces: ['header_line'], supported_bindings: [], is_container: true, allowed_parents: ['PageRoot'], allowed_children: ['*'], config_schema: {}, default_props: {}, event_support: { emits: [], handles: [] }, permission_behavior: {}, runtime_renderer: 'HeaderLineSection', designer_panel: 'default', preview_support: true, validation_rules: [], is_active: true, created_at: now() },
]

export const viewHandlers = [
  // List views
  http.get('/api/v1/studio/views', ({ request }) => {
    const store = loadViews()
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()
    const surface = url.searchParams.get('surface') ?? url.searchParams.get('surface_type')
    const status = url.searchParams.get('status')
    let items = store
    if (search) items = items.filter(v => v.view_label.toLowerCase().includes(search) || (v.view_code ?? '').toLowerCase().includes(search))
    if (surface) items = items.filter(v => v.surface_type === surface)
    if (status === 'draft') items = items.filter(v => v.is_draft)
    if (status === 'published') items = items.filter(v => v.is_active && !v.is_draft)
    return HttpResponse.json({ items: items.map(toView), total: items.length })
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
    }
    store[idx] = {
      ...store[idx],
      _draft_payload: body.payload,
      latest_version_id: versionId,
      latest_version_no: versionNo,
      is_draft: true,
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
]
