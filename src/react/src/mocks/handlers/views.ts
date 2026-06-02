import { http, HttpResponse } from 'msw'

const VIEWS_KEY = 'msw_views'

interface ViewDraft {
  version_id: string
  version_no: number
  is_draft: boolean
  is_active: boolean
  payload: Record<string, unknown>
  created_at: string
  created_by: string
  published_at?: string
  published_by?: string
}

interface ViewRecord {
  view_id: string
  view_key: string
  view_label: string
  surface_type: string
  primary_entity: string
  view_code?: string
  is_active: boolean
  created_at: string
  updated_at: string
  current_draft?: ViewDraft
  versions?: ViewDraft[]
}

function loadViews(): ViewRecord[] {
  try {
    const raw = localStorage.getItem(VIEWS_KEY)
    if (raw) return JSON.parse(raw) as ViewRecord[]
  } catch { /* ignore */ }
  return []
}

function saveViews(views: ViewRecord[]) {
  try { localStorage.setItem(VIEWS_KEY, JSON.stringify(views)) } catch { /* ignore */ }
}

const viewStore: ViewRecord[] = loadViews()

function now() { return new Date().toISOString() }
function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const COMPONENT_REGISTRY = [
  { code: 'TextInput', label: 'Text Input', category: 'input', supported_bindings: ['value', 'label', 'placeholder', 'disabled', 'readOnly'], event_support: { emits: ['on_change', 'on_focus', 'on_blur'] } },
  { code: 'NumberInput', label: 'Number Input', category: 'input', supported_bindings: ['value', 'label', 'min', 'max', 'disabled'], event_support: { emits: ['on_change'] } },
  { code: 'DatePicker', label: 'Date Picker', category: 'input', supported_bindings: ['value', 'label', 'disabled'], event_support: { emits: ['on_change'] } },
  { code: 'Dropdown', label: 'Dropdown', category: 'input', supported_bindings: ['value', 'label', 'options', 'disabled'], event_support: { emits: ['on_change'] } },
  { code: 'Checkbox', label: 'Checkbox', category: 'input', supported_bindings: ['checked', 'label', 'disabled'], event_support: { emits: ['on_change'] } },
  { code: 'Textarea', label: 'Textarea', category: 'input', supported_bindings: ['value', 'label', 'rows', 'disabled'], event_support: { emits: ['on_change'] } },
  { code: 'Button', label: 'Button', category: 'action', supported_bindings: ['label', 'disabled', 'variant'], event_support: { emits: ['on_click'] } },
  { code: 'DataTable', label: 'Data Table', category: 'data', supported_bindings: ['data', 'columns', 'loading'], event_support: { emits: ['on_row_select', 'on_load'] } },
  { code: 'Label', label: 'Label / Text', category: 'display', supported_bindings: ['value', 'format'], event_support: { emits: [] } },
  { code: 'Badge', label: 'Badge', category: 'display', supported_bindings: ['value', 'variant'], event_support: { emits: [] } },
  { code: 'PageRoot', label: 'Page Root', category: 'layout', supported_bindings: [], event_support: { emits: ['on_load'] } },
  { code: 'Section', label: 'Section', category: 'layout', supported_bindings: ['title', 'visible'], event_support: { emits: [] } },
  { code: 'Row', label: 'Row', category: 'layout', supported_bindings: [], event_support: { emits: [] } },
  { code: 'Column', label: 'Column', category: 'layout', supported_bindings: [], event_support: { emits: [] } },
  { code: 'ConditionalContainer', label: 'Conditional Container', category: 'layout', supported_bindings: ['visible'], event_support: { emits: [] } },
  { code: 'FilterPanel', label: 'Filter Panel', category: 'data', supported_bindings: ['filters'], event_support: { emits: ['on_change'] } },
  { code: 'MetricComparison', label: 'Metric Comparison', category: 'display', supported_bindings: ['value', 'label', 'comparison', 'trend'], event_support: { emits: [] } },
  { code: 'DataCardGrid', label: 'Data Card Grid', category: 'data', supported_bindings: ['data', 'loading'], event_support: { emits: ['on_row_select'] } },
  { code: 'StatusBadge', label: 'Status Badge', category: 'display', supported_bindings: ['status', 'statusMap'], event_support: { emits: [] } },
  { code: 'ReferenceSelect', label: 'Reference Select', category: 'input', supported_bindings: ['value', 'label', 'entity', 'disabled'], event_support: { emits: ['on_change'] } },
  { code: 'FileUpload', label: 'File Upload', category: 'input', supported_bindings: ['value', 'accept', 'disabled'], event_support: { emits: ['on_change'] } },
  { code: 'Tabs', label: 'Tabs', category: 'layout', supported_bindings: ['activeTab'], event_support: { emits: ['on_change'] } },
  { code: 'Modal', label: 'Modal', category: 'layout', supported_bindings: ['open', 'title'], event_support: { emits: ['on_modal_open', 'on_modal_close'] } },
  { code: 'Toolbar', label: 'Toolbar', category: 'layout', supported_bindings: [], event_support: { emits: [] } },
  { code: 'HeaderLineSection', label: 'Header + Line Section', category: 'layout', supported_bindings: [], event_support: { emits: [] } },
]

export const viewHandlers = [
  // List views
  http.get('/api/v1/studio/views', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()
    const surface = url.searchParams.get('surface_type')
    let items = viewStore
    if (search) items = items.filter(v => v.view_label.toLowerCase().includes(search) || v.view_key.toLowerCase().includes(search))
    if (surface) items = items.filter(v => v.surface_type === surface)
    return HttpResponse.json({ items, total: items.length })
  }),

  // Create view
  http.post('/api/v1/studio/views', async ({ request }) => {
    const body = await request.json() as Partial<ViewRecord>
    const newView: ViewRecord = {
      view_id: randomId(),
      view_key: body.view_key ?? randomId().slice(0, 8),
      view_label: body.view_label ?? 'Untitled View',
      surface_type: body.surface_type ?? 'standard_crud',
      primary_entity: body.primary_entity ?? '',
      view_code: body.view_code,
      is_active: true,
      created_at: now(),
      updated_at: now(),
      versions: [],
    }
    viewStore.push(newView)
    saveViews(viewStore)
    return HttpResponse.json(newView, { status: 201 })
  }),

  // Get view
  http.get('/api/v1/studio/views/:key', ({ params }) => {
    const view = viewStore.find(v => v.view_key === params.key || v.view_id === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ ...view, latest_payload: view.current_draft?.payload ?? {} })
  }),

  // Save draft
  http.put('/api/v1/studio/views/:key/draft', async ({ params, request }) => {
    const idx = viewStore.findIndex(v => v.view_key === params.key || v.view_id === params.key)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const body = await request.json() as { payload: Record<string, unknown> }
    const draft: ViewDraft = {
      version_id: randomId(),
      version_no: (viewStore[idx].versions?.length ?? 0) + 1,
      is_draft: true,
      is_active: false,
      payload: body.payload,
      created_at: now(),
      created_by: 'user',
    }
    viewStore[idx] = { ...viewStore[idx], current_draft: draft, updated_at: now() }
    saveViews(viewStore)
    return HttpResponse.json(draft)
  }),

  // Publish view
  http.post('/api/v1/studio/views/:key/publish', async ({ params, request }) => {
    const idx = viewStore.findIndex(v => v.view_key === params.key || v.view_id === params.key)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const body = await request.json().catch(() => ({})) as { payload?: Record<string, unknown> }
    const existing = viewStore[idx].current_draft
    const published: ViewDraft = {
      version_id: existing?.version_id ?? randomId(),
      version_no: existing?.version_no ?? 1,
      is_draft: false,
      is_active: true,
      payload: body.payload ?? existing?.payload ?? {},
      created_at: existing?.created_at ?? now(),
      created_by: 'user',
      published_at: now(),
      published_by: 'user',
    }
    const versions = [...(viewStore[idx].versions ?? []), published]
    viewStore[idx] = { ...viewStore[idx], current_draft: published, versions, is_active: true, updated_at: now() }
    saveViews(viewStore)
    return HttpResponse.json(published)
  }),

  // Rollback
  http.post('/api/v1/studio/views/:key/rollback/:vId', ({ params }) => {
    const idx = viewStore.findIndex(v => v.view_key === params.key || v.view_id === params.key)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const ver = (viewStore[idx].versions ?? []).find(v => v?.version_id === params.vId)
    if (!ver) return new HttpResponse(null, { status: 404 })
    viewStore[idx] = { ...viewStore[idx], current_draft: { ...ver, is_draft: false, is_active: true }, updated_at: now() }
    saveViews(viewStore)
    return HttpResponse.json(viewStore[idx].current_draft)
  }),

  // Delete view
  http.delete('/api/v1/studio/views/:key', ({ params }) => {
    const idx = viewStore.findIndex(v => v.view_key === params.key || v.view_id === params.key)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    viewStore.splice(idx, 1)
    saveViews(viewStore)
    return new HttpResponse(null, { status: 204 })
  }),

  // List versions
  http.get('/api/v1/studio/views/:key/versions', ({ params }) => {
    const view = viewStore.find(v => v.view_key === params.key || v.view_id === params.key)
    if (!view) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ items: view.versions ?? [], total: (view.versions ?? []).length })
  }),

  // Component registry
  http.get('/api/v1/studio/component-registry', () => {
    return HttpResponse.json(COMPONENT_REGISTRY)
  }),

  http.get('/api/v1/studio/component-registry/:code', ({ params }) => {
    const entry = COMPONENT_REGISTRY.find(c => c.code === params.code)
    if (!entry) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(entry)
  }),

  // Runtime views
  http.get('/api/v1/studio/runtime/views/:key', ({ params }) => {
    const view = viewStore.find(v => v.view_key === params.key || v.view_id === params.key)
    if (!view?.current_draft) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(view.current_draft)
  }),

  http.get('/api/v1/studio/runtime/views/by-code/:code', ({ params }) => {
    const view = viewStore.find(v => v.view_code === params.code)
    if (!view?.current_draft) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(view.current_draft)
  }),

  // Plugins
  http.get('/api/v1/studio/plugins', () => {
    return HttpResponse.json([])
  }),

  http.post('/api/v1/studio/plugins', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: randomId(), ...(body as object), created_at: now() }, { status: 201 })
  }),

  http.delete('/api/v1/studio/plugins/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
