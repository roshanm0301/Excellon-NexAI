# Phase 4 — Runtime Renderer

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M5 |
| **Gate Condition** | Published views render at runtime with real entity data; permissions applied; broken bindings handled |
| **Depends On** | [Phase 3](P3-view-designer.md) — at least one published view exists in DB |
| **Agents** | Agent 4 (Backend) → Agent 6 (Renderer) ‖ Agent 8 (Binding) → Agent 14 (QA) + Agent 17 + Agent 15 + Agent 16 |
| **Code Changes** | ✅ StudioRenderer pipeline · BindingResolver · PermissionFilter · ComponentErrorBoundary · RUNTIME_MAP |
| **Commit** | `feat: ui-studio Phase 4 — runtime renderer, binding resolver, permission filter, backward compat fallback` |

> **Depends on Phase 3:** A published view must exist to test the renderer.

---

## New Files to Create

```
app/src/react/src/components/studio-v2/StudioRenderer.tsx              NEW (main runtime entry)
app/src/react/src/lib/studio-v2/MetadataLoader.ts                      NEW
app/src/react/src/lib/studio-v2/LayoutResolver.ts                      NEW
app/src/react/src/lib/studio-v2/BindingResolver.ts                     NEW
app/src/react/src/lib/studio-v2/PermissionFilter.ts                    NEW
app/src/react/src/lib/studio-v2/ComponentErrorBoundary.tsx             NEW
app/src/react/src/components/studio-v2/runtime/LineGridRuntime.tsx     NEW
app/src/react/src/components/studio-v2/runtime/TotalsPanelRuntime.tsx  NEW
app/src/react/src/components/studio-v2/runtime/ActionBarRuntime.tsx    NEW
```

---

## 4.1 Renderer Pipeline — `StudioRenderer.tsx`

Steps executed in order on every view load:

```typescript
// 1. MetadataLoader
//    GET /api/v1/studio/runtime/views/:viewKey  OR  /by-code/:viewCode
//    React Query cache, TTL 5 minutes
//    If no active version → render "View not published" state (never an error crash)

// 2. LayoutResolver
//    Walk component_tree by surface_type:
//      standard_crud → form zone + list zone
//      header_line   → header zone + line zones + footer zone
//    Resolves responsive breakpoints

// 3. ComponentRenderer (extend ComponentTreeRenderer.tsx)
//    Dynamic import by runtime_renderer key from Component Registry (RUNTIME_MAP)
//    Pass resolved props + bindings
//    Each component wrapped in ComponentErrorBoundary

// 4. BindingResolver
//    entity_field   → GET /api/v1/entities/:type/:id         → map field to value
//    data_source    → GET /api/v1/datasource/:key            → query result
//    computed       → evaluate JSONata expression against form state
//    context        → current user, tenant, session values
//    workflow_state → GET /api/v1/workflow/:type/:id/state

// 5. EventExecutor (stub in Phase 4 — full in Phase 5)
//    Register event_definitions from payload on mount

// 6. PermissionFilter
//    POST /api/v1/permission/evaluate-view
//    → Remove hidden fields ABSENT from DOM (NOT CSS display:none)
//    → Disable fields not in editable_fields
//    → Mask fields in masked_fields with ***
//    → Remove action buttons not in allowed_actions

// 7. WorkflowStatusStrip (display only in Phase 4 — full wiring in Phase 7)
//    GET /api/v1/workflow/:entityType/:recordId/state
//    Show current state badge + allowed action buttons

// 8. ComponentErrorBoundary
//    Per-component isolation — broken component shows error card
//    Error card shows: component_code + error type
//    DO NOT show raw metadata in error card
//    Rest of view continues rendering normally
```

> ⚠️ **CRITICAL:** MetadataLoader must NEVER load draft versions.
> Only return `artifact_version` rows where `is_active = true`.

---

## 4.2 Runtime Component Map — `ComponentRenderer.tsx`

```typescript
const RUNTIME_MAP: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  // Reuse existing dynamic widgets
  text_input:        () => import('../dynamic/widgets/TextInputWidget'),
  number_input:      () => import('../dynamic/widgets/NumberInputWidget'),
  currency_input:    () => import('../dynamic/widgets/NumberInputWidget'),   // reuse with props
  date_picker:       () => import('../dynamic/widgets/DatePickerWidget'),
  datetime_picker:   () => import('../dynamic/widgets/DatePickerWidget'),
  dropdown:          () => import('../dynamic/widgets/SelectWidget'),
  multi_select:      () => import('../dynamic/widgets/SelectWidget'),
  entity_picker:     () => import('../dynamic/widgets/EntityPickerWidget'),
  status_badge:      () => import('../dynamic/widgets/StatusBadgeWidget'),
  toggle:            () => import('../dynamic/widgets/ToggleWidget'),
  textarea:          () => import('../dynamic/widgets/TextareaWidget'),
  text_display:      () => import('../dynamic/widgets/TextWidget'),
  // New runtime components
  list_grid:         () => import('./runtime/ListGridRuntime'),
  editor_grid:       () => import('./runtime/EditorGridRuntime'),
  totals_panel:      () => import('./runtime/TotalsPanelRuntime'),
  action_bar:        () => import('./runtime/ActionBarRuntime'),
  action_bar_transaction:    () => import('./runtime/ActionBarRuntime'),
  workflow_status_strip:     () => import('./runtime/WorkflowStatusStripRuntime'),
  validation_summary:        () => import('./runtime/ValidationSummaryRuntime'),
  attachment_notes:          () => import('./runtime/AttachmentNotesRuntime'),
  record_highlights:         () => import('./runtime/RecordHighlightsRuntime'),
  // Visualization — lazy-loaded (heavy)
  map_geolocation:   () => import('./runtime/MapGeolocationRuntime'),
  timeline_gantt:    () => import('./runtime/TimelineGanttRuntime'),
  calendar_view:     () => import('./runtime/CalendarViewRuntime'),
  kanban_board:      () => import('./runtime/KanbanBoardRuntime'),
  // Layout
  page_root:         () => import('./runtime/PageRootRuntime'),
  section:           () => import('./runtime/SectionRuntime'),
  tab_container:     () => import('./runtime/TabContainerRuntime'),
  column_layout:     () => import('./runtime/ColumnLayoutRuntime'),
  card:              () => import('./runtime/CardRuntime'),
  accordion:         () => import('./runtime/AccordionRuntime'),
  // ... all 56 codes registered
}
```

---

## 4.3 Backward Compatibility

`DynamicFormPage.tsx`, `DynamicListPage.tsx`, `DynamicDetailPage.tsx` are **not deleted**.

Add routing logic at the top of each:

```typescript
// Add to top of DynamicFormPage.tsx, DynamicListPage.tsx, DynamicDetailPage.tsx:
const publishedView = usePublishedView(entityType, viewCode)
if (publishedView) return <StudioRenderer viewKey={publishedView.view_key} {...props} />
// else: fall through to existing DynamicForm/List/Detail rendering
```

---

## Testing Phase 4

### Unit Tests — `MetadataLoader.test.ts`

```typescript
// 1. Returns null for view with no active published version
test('MetadataLoader returns null when no active version exists', async () => {
  // mock API to return 404
  server.use(rest.get('/api/v1/studio/runtime/views/unpublished', (req, res, ctx) => res(ctx.status(404))))
  const result = await loadMetadata('unpublished')
  expect(result).toBeNull()
})

// 2. React Query cache TTL — second call uses cache
test('MetadataLoader uses cached result within 5 minutes', async () => {
  let callCount = 0
  server.use(rest.get('/api/v1/studio/runtime/views/test', (req, res, ctx) => { callCount++; return res(ctx.json(mockPayload)) }))
  await loadMetadata('test')
  await loadMetadata('test') // second call
  expect(callCount).toBe(1) // only one HTTP call
})

// 3. NEVER loads draft
test('MetadataLoader never returns draft payload', async () => {
  // seed DB with only a draft version (is_active=false)
  const result = await loadMetadata('draft_only_view')
  expect(result).toBeNull()
})
```

### Unit Tests — `PermissionFilter.test.ts`

```typescript
// 1. Hidden field absent from DOM
test('hidden field is absent from DOM — not just CSS hidden', async () => {
  render(<StudioRenderer viewKey="test_view" />, { user: { role: 'Clerk' } })
  // 'salary' field is in hidden_fields for Clerk role
  expect(document.querySelector('[data-field="salary"]')).toBeNull()
  // NOT just display:none — the element must not exist at all
})

// 2. Masked field shows *** 
test('masked field renders as ***', async () => {
  render(<StudioRenderer viewKey="test_view" />, { user: { role: 'Clerk' } })
  expect(screen.getByTestId('field-ssn')).toHaveTextContent('***')
})

// 3. Disabled field renders as read-only
test('non-editable field is disabled', async () => {
  render(<StudioRenderer viewKey="test_view" />, { user: { role: 'Clerk' } })
  expect(screen.getByRole('textbox', { name: /discount/i })).toBeDisabled()
})

// 4. Action not in allowed_actions absent from DOM
test('action button not in allowed_actions is absent', async () => {
  render(<StudioRenderer viewKey="test_view" />, { user: { role: 'Clerk' } })
  expect(document.querySelector('[data-action="delete"]')).toBeNull()
})
```

### Unit Tests — `ComponentErrorBoundary.test.tsx`

```typescript
// 1. Broken component renders error card without crashing page
test('broken component shows error card, rest of page renders', () => {
  const BrokenWidget = () => { throw new Error('Widget crashed') }
  render(
    <ComponentErrorBoundary componentCode="broken_widget">
      <BrokenWidget />
    </ComponentErrorBoundary>
  )
  expect(screen.getByTestId('component-error-card')).toBeInTheDocument()
  expect(screen.getByText('broken_widget')).toBeInTheDocument()
  // raw stack trace NOT shown to user
  expect(screen.queryByText(/Widget crashed/)).not.toBeInTheDocument()
})

// 2. RUNTIME_MAP covers all 56 registered component codes
test('RUNTIME_MAP has entry for every registered component', async () => {
  const registered = await fetchComponentRegistry() // returns 56 codes
  registered.forEach(code => {
    expect(RUNTIME_MAP[code]).toBeDefined()
  })
})
```

### Binding Tests — `BindingResolver.test.ts`

```typescript
// 1. entity_field binding resolves correct value
test('entity_field binding resolves from entity record', async () => {
  const value = await resolveBinding({ type: 'entity_field', field_key: 'email' }, { id: '123', email: 'a@b.com' })
  expect(value).toBe('a@b.com')
})

// 2. data_source binding returns filtered results
test('data_source binding returns query results with configured filters', async () => {
  const results = await resolveBinding({ type: 'data_source', source_key: 'active_items' }, {})
  expect(Array.isArray(results)).toBe(true)
})

// 3. Cascading lookup — second picker filters by first
test('cascading entity_picker filters by parent field value', async () => {
  // warehouseId picker filters by branchId='BR001'
  const options = await resolveBinding(warehousePickerBinding, { branchId: 'BR001' })
  options.forEach(opt => expect(opt.branch_id).toBe('BR001'))
})

// 4. Computed binding evaluates JSONata expression
test('computed binding evaluates JSONata over form state', async () => {
  const value = await resolveBinding(
    { type: 'computed', expression: 'qty * rate' },
    { header: { qty: 3, rate: 100 } }
  )
  expect(value).toBe(300)
})
```

### E2E Tests — `RuntimeRenderer.e2e.ts` (Playwright)

```typescript
// E2E 1: Published view renders with real entity data
test('published view renders customer record fields', async ({ page }) => {
  await page.goto('http://localhost:5173/customers/123')
  await expect(page.locator('[data-field="email"]')).toHaveValue('test@example.com')
})

// E2E 2: Broken component shows error card, rest renders
test('broken component_code shows error card without page crash', async ({ page }) => {
  // seed a view payload with an invalid component_code
  await page.goto('http://localhost:5173/test-broken-view/1')
  await expect(page.locator('[data-testid="component-error-card"]')).toBeVisible()
  await expect(page.locator('[data-field="email"]')).toBeVisible() // rest still renders
})

// E2E 3: No active published version shows "View not published" state
test('unpublished view shows not-published state', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/draft_view_preview')
  await expect(page.locator('text=View not published')).toBeVisible()
})

// E2E 4: DynamicFormPage falls back to existing renderer when no studio view
test('entity without studio view falls through to DynamicFormPage', async ({ page }) => {
  // navigate to entity with no published UI Studio view
  await page.goto('http://localhost:5173/legacy-entity/1')
  await expect(page.locator('[data-renderer="dynamic-form"]')).toBeVisible()
})
```

### Performance Tests

```
First render of published view:      < 2000ms (measured from navigation start)
Cached payload render:               < 200ms
Grid with 500 rows:                  no visible jank (VirtualGrid handles virtual scrolling)
Heavy component (MapView) lazy load: does not block initial render
```

---

## Agents — Phase 4

> ➡️ **SEQUENTIAL first:** Agent 4 implements runtime API endpoints (1 day). Then Agent 6 + Agent 8 run in parallel.

> 🔀 **PARALLEL:** Agent 6 (Renderer) and Agent 8 (Binding) share `BindingResolver` interface — agree on the interface before parallel execution.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 6: Runtime Renderer](../reference/agent-specifications.md#agent-6-runtime-renderer-agent)** | StudioRenderer pipeline, RUNTIME_MAP, LayoutResolver, ComponentErrorBoundary | `StudioRenderer.tsx`, `ComponentRenderer.tsx`, `LayoutResolver.ts`, `ComponentErrorBoundary.tsx` |
| B | **[Agent 8: Data Binding](../reference/agent-specifications.md#agent-8-data-binding-and-data-source-agent)** | BindingResolver, PermissionFilter, runtime binding types | `BindingResolver.ts`, `PermissionFilter.ts` |
| C | **[Agent 4: Backend API](../reference/agent-specifications.md#agent-4-backend-api-agent)** | Runtime view loader endpoints, datasource query route | `handler.go` runtime routes |

After all complete:

| Agent | Task |
|---|---|
| **Agent 14: QA** | Run all unit, binding, E2E, and performance tests above |
| **Agent 17: API Contract Alignment** | Binding resolver TypeScript types match Go API response shapes |
| **Agent 15: Documentation** | M5 milestone summary + renderer architecture guide |
| **Agent 16: Phase Coordinator** | Published view renders with real data, DOM removal confirmed, error boundary works — **gate M6** |

---

## ✅ Gate Condition — M5

```
1. Publish a view → navigate to /customers/123
   Expected: view renders with real customer data from DB

2. Permission test (automated):
   document.querySelector('[data-field="salary"]') === null
   (hidden field absent from DOM — not CSS hidden)

3. Broken component:
   Seed a view with invalid component_code='does_not_exist'
   Navigate → error card shown for that component, other components render normally

4. Performance:
   First render < 2000ms (Chrome DevTools or Playwright tracing)
```

> **Previous phase:** [Phase 3](P3-view-designer.md)
> **Next phase:** [Phase 5 — Event Engine](P5-event-engine.md)
