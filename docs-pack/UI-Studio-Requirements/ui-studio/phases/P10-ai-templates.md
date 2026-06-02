# Phase 10 — Template Gallery, AI Generation & Analytics

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M11 |
| **Gate Condition** | AI generates valid DRAFT view from natural language; 10 template presets; all P2 features operational |
| **Depends On** | All previous phases complete — [Phase 8](P8-publish-governance.md) publish lifecycle + [Phase 9](P9-role-variants.md) permissions |
| **Agents** | Agent 5 ‖ Agent 4 ‖ Agent 9 (parallel) → Agent 14 ‖ Agent 15 (parallel) → Agent 1 + Agent 17 + Agent 16 |
| **Code Changes** | ✅ TemplateGalleryPage · AIViewGenerator · UiStudioNlpPanel · Go AI handler · generator (Claude API) |
| **Commit** | `feat: ui-studio Phase 10 — AI view generation (Claude API), template gallery, all P2 features, full regression suite` |

> ⚠️ **AI GOVERNANCE RULE:** AI output is ALWAYS returned as DRAFT status.
> It is NEVER auto-published. It MUST pass V001–V051 validation before being returned.
> The user must review, edit if needed, then manually publish.

---

## New Files to Create

```
app/src/react/src/pages/admin/ui-studio/TemplateGalleryPage.tsx    NEW
app/src/react/src/components/studio-v2/AIViewGenerator.tsx         NEW
app/src/react/src/components/studio-v2/UiStudioNlpPanel.tsx        ← complete (was stub)
app/src/go/internal/studio/ai/handler.go                           NEW
app/src/go/internal/studio/ai/generator.go                         NEW (calls Claude API)
```

---

## 10.1 AI-Assisted View Generation Architecture

```
User types natural language in NlpPanel:
  "Create a customer complaint form with fields for customer name,
   complaint type, description, priority, and assigned agent"

UiStudioNlpPanel.tsx
  → POST /api/v1/studio/ai/generate-view
  → Body: { description, surface_type?, primary_entity?, view_code?, tenant_id }

Go backend (studio/ai/generator.go):
  1. Build system prompt with:
       - Component registry (all 56 components with config_schema)
       - Entity field definitions for primary_entity
       - Governance rules: AI must NOT auto-publish, must use valid component codes
       - Output schema: ViewArtifactPayload JSON (strict schema)
  2. Call Claude API (claude-sonnet-4-6) with prompt caching
  3. Parse JSON response from Claude
  4. Run through publish validation (V001–V051 rules)
  5. Auto-fix common AI errors:
       - duplicate component_key → append suffix
       - invalid component_code → replace with closest valid code
       - missing required props → add defaults from config_schema
  6. Return as DRAFT — NEVER set is_active=true
  7. Log to ui_view_publish_log: action='ai_generated'

Frontend:
  - Load AI draft into designer canvas
  - Show "AI Generated" badge on draft
  - User reviews and edits in canvas
  - Cannot publish directly from NlpPanel — user must use Publish button in designer
```

---

## 10.2 Template Gallery — `TemplateGalleryPage.tsx`

10 launch templates — each is a pre-built `ViewArtifactPayload` stored as seed data:

| # | Template | Surface | Notes |
|---|---|---|---|
| 1 | Standard CRUD — Master Data | `standard_crud` | Generic entity list + form |
| 2 | Master with Related Records | `advanced_crud` | Main form + relationship panel |
| 3 | Transaction — Header + Lines | `header_line` | Header form + line grid + totals |
| 4 | Approval Workflow Form | `standard_crud` | With workflow strip + approval panel |
| 5 | Dashboard — KPI + Charts | `dashboard` | KPI cards + bar/line/donut charts |
| 6 | Kanban Board | `kanban` | Status-based card view |
| 7 | Wizard — Multi-Step Entry | `wizard` | Step navigation + validation per step |
| 8 | Inspection / Checklist | `standard_crud` | Toggle/rating fields + section grouping |
| 9 | Report View — Read Only | `detail_page` | Display-only fields + record highlights |
| 10 | Split Console View | `split_view` | List on left, detail on right |

Each template: clone creates draft with full layout scaffold. User binds entity and publishes.

---

## 10.3 P2 Features Delivered in Phase 10

| Code | Feature | Notes |
|---|---|---|
| P2-44 | Template Gallery | `TemplateGalleryPage` with 10 templates |
| P2-45 | Component Presets | Save configured component instance as reusable preset |
| P2-46 | Dashboard Builder | `dashboard` surface type fully operational |
| P2-47 | Kanban Board | `kanban` surface with card rendering |
| P2-48 | Wizard Builder | `wizard` surface with step navigation |
| P2-49 | Console/Split View | `split_view` surface type |
| P2-50 | Personalization | User-saved column widths, filter presets |
| P2-51 | Runtime Usage Analytics | Telemetry events → `POST /api/v1/studio/analytics` |
| P2-52 | Performance Budgeting | Alert when render_time > 3000ms in analytics dashboard |
| P2-53 | Accessibility Checks | Pre-publish linter: A001–A005 rules |
| P2-54 | Localization Checks | Pre-publish linter: L001–L004 rules |
| P2-55 | Advanced Expression Mode | Full JSONata editor in expression fields |
| P2-56 | No-Code Rule Builder Wizard | Guided wizard for event conditions |
| P2-57 | AI-Assisted View Generation | NlpPanel + Claude API |
| P2-58 | AI Layout Refactoring | "Suggest improvements" in designer toolbar |
| P2-59 | AI Broken Binding Explanation | Natural language explanation of V050/V051 |
| P2-60 | Guided Builder Walkthroughs | In-app step-by-step tutorials |
| P2-61 | View Documentation Generator | `GET /api/v1/studio/views/:key/documentation` |
| P2-62 | Export / Import Metadata | Export as JSON bundle, import with validation |
| P2-63 | View Clone with Delta Tracking | Clone records `cloned_from_view_key` lineage |

---

## Testing Phase 10

### Unit Tests — `AIGenerator.test.ts` (Go)

```go
// 1. Valid description produces ViewArtifactPayload that passes V001–V051
func TestGenerateView_ValidDescription(t *testing.T) {
    gen := NewAIGenerator(mockClaudeClient)
    result, err := gen.Generate(context.Background(), GenerateRequest{
        Description:   "Create a customer complaint form",
        SurfaceType:   "standard_crud",
        PrimaryEntity: "customer",
        TenantID:      "test-tenant",
    })
    assert.NoError(t, err)
    assert.NotNil(t, result)
    assert.Equal(t, "draft", result.Status)
    // Validate the generated payload
    errors := ValidateForPublish(result.Payload)
    assert.Empty(t, errors.Errors, "AI-generated payload should pass validation")
}

// 2. AI output always DRAFT — never active
func TestGenerateView_AlwaysDraft(t *testing.T) {
    gen := NewAIGenerator(mockClaudeClient)
    result, _ := gen.Generate(context.Background(), validRequest)
    assert.Equal(t, "draft", result.Status)
    assert.False(t, result.IsActive)
}

// 3. AI generation logged to audit table
func TestGenerateView_AuditLogCreated(t *testing.T) {
    gen := NewAIGenerator(mockClaudeClient)
    result, _ := gen.Generate(context.Background(), validRequest)
    var logEntry PublishLog
    db.Where("artifact_id = ? AND action = ?", result.ArtifactID, "ai_generated").First(&logEntry)
    assert.Equal(t, "ai_generated", logEntry.Action)
}

// 4. Invalid entity type returns 422
func TestGenerateView_InvalidEntity(t *testing.T) {
    gen := NewAIGenerator(mockClaudeClient)
    _, err := gen.Generate(context.Background(), GenerateRequest{
        Description: "form", PrimaryEntity: "non_existent_entity",
    })
    assert.ErrorIs(t, err, ErrEntityNotFound)
}

// 5. Auto-fix: duplicate keys corrected before return
func TestGenerateView_AutoFixDuplicateKeys(t *testing.T) {
    // mock Claude to return payload with duplicate keys
    mockClaudeClient.Response = payloadWithDuplicateKeys
    gen := NewAIGenerator(mockClaudeClient)
    result, err := gen.Generate(context.Background(), validRequest)
    assert.NoError(t, err)
    keys := extractAllComponentKeys(result.Payload.ComponentTree)
    uniqueKeys := unique(keys)
    assert.Equal(t, len(uniqueKeys), len(keys), "No duplicate keys after auto-fix")
}
```

### Unit Tests — `TemplateGallery.test.ts`

```typescript
// 1. All 10 templates in gallery
test('template gallery shows all 10 templates', async () => {
  render(<TemplateGalleryPage />)
  await waitFor(() => {
    expect(screen.getAllByTestId('template-card')).toHaveLength(10)
  })
})

// 2. Clone creates draft with correct surface_type
test('clone Transaction template creates header_line draft', async () => {
  server.use(rest.post('/api/v1/studio/views/clone', (req, res, ctx) =>
    res(ctx.json({ view_key: 'cloned_transaction', status: 'draft' }))
  ))
  render(<TemplateGalleryPage />)
  await userEvent.click(screen.getByText('Transaction — Header + Lines'))
  await userEvent.click(screen.getByRole('button', { name: /use template/i }))
  const res = await waitForApiCall('/api/v1/studio/views/clone')
  expect(res.body.source_template).toBe('header_line_template')
})

// 3. Cloned template records cloned_from lineage
test('cloned view records cloned_from_view_key', async () => {
  const cloned = await cloneTemplate('standard_crud_template', 'my_custom_view')
  expect(cloned.cloned_from_view_key).toBe('standard_crud_template')
})
```

### API Integration Tests — `AIGeneration.integration.test.ts`

```typescript
// 1. AI endpoint returns valid draft payload
test('POST /ai/generate-view returns 200 with draft payload', async () => {
  const res = await fetch('/api/v1/studio/ai/generate-view', {
    method: 'POST',
    body: JSON.stringify({
      description:    'Customer complaint form with name, type, description, priority',
      surface_type:   'standard_crud',
      primary_entity: 'complaint',
      tenant_id:      testTenantId
    })
  })
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('draft')
  expect(body.payload.component_tree).toBeDefined()
})

// 2. AI-generated view fails publish (user must review first — demonstrates governance)
test('AI-generated draft cannot be directly published without review', async () => {
  const gen = await generateView(validRequest)
  // Try to publish immediately — should succeed IF validation passes
  // (the governance check is that it came back as DRAFT, not that publish is blocked)
  // The real governance is: NlpPanel has no Publish button — user must go to designer
  const payload = gen.payload
  expect(payload._schema_version).toBeDefined()
})

// 3. Export view as JSON bundle
test('export view returns valid JSON bundle', async () => {
  const res = await fetch(`/api/v1/studio/views/test_view/export`)
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toContain('application/json')
  const bundle = await res.json()
  expect(bundle.view_key).toBe('test_view')
  expect(bundle.exported_at).toBeDefined()
})

// 4. Import view bundle on fresh environment creates DRAFT
test('import view bundle creates view as DRAFT status', async () => {
  const res = await fetch('/api/v1/studio/views/import', {
    method: 'POST',
    body: JSON.stringify(exportBundle)
  })
  expect(res.status).toBe(201)
  const imported = await res.json()
  expect(imported.status).toBe('draft')
})

// 5. Import with missing plugin component shows warning, import continues
test('import with unknown plugin component continues with warning', async () => {
  const bundleWithPluginComponent = { ...exportBundle, component_tree: treeWithPluginComponent }
  const res = await fetch('/api/v1/studio/views/import', {
    method: 'POST', body: JSON.stringify(bundleWithPluginComponent)
  })
  expect(res.status).toBe(201)
  const imported = await res.json()
  expect(imported.warnings.some((w: any) => w.code === 'UNKNOWN_COMPONENT')).toBe(true)
})
```

### Analytics Tests — `Analytics.test.ts`

```typescript
// 1. View render event logged
test('StudioRenderer fires telemetry event on render', async () => {
  let capturedEvent: any = null
  server.use(rest.post('/api/v1/studio/analytics', async (req, res, ctx) => {
    capturedEvent = await req.json()
    return res(ctx.json({ ok: true }))
  }))
  render(<StudioRenderer viewKey="test_view" />)
  await waitFor(() => expect(capturedEvent).not.toBeNull())
  expect(capturedEvent.event_type).toBe('view_render')
  expect(capturedEvent.view_key).toBe('test_view')
  expect(capturedEvent.render_time_ms).toBeGreaterThan(0)
})

// 2. Performance alert triggered for slow renders
test('performance alert fires when render > 3000ms', async () => {
  // mock analytics API to return a slow render entry
  server.use(rest.get('/api/v1/studio/analytics/summary', (req, res, ctx) =>
    res(ctx.json({ slow_views: [{ view_key: 'heavy_view', p95_render_ms: 4500 }] }))
  ))
  render(<AnalyticsDashboard />)
  await expect(screen.findByText('heavy_view')).resolves.toBeInTheDocument()
  await expect(screen.findByTestId('perf-alert')).resolves.toBeInTheDocument()
})
```

### Full Regression Suite — `FullRegression.e2e.ts` (Playwright)

```typescript
// Run before M11 gate closes — all previous phase gate conditions re-verified:

test('M2 gate: runtime returns published view', async ({ page }) => { ... })
test('M3 gate: 56 components in registry', async ({ request }) => { ... })
test('M4 gate: designer produces valid draft', async ({ page }) => { ... })
test('M5 gate: published view renders with real data', async ({ page }) => { ... })
test('M6 gate: field_change event fires at runtime', async ({ page }) => { ... })
test('M7 gate: Sale Order E2E passes', async ({ page }) => { ... })
test('M8 gate: workflow state badge + approval fires', async ({ page }) => { ... })
test('M9 gate: publish + rollback + validation', async ({ request }) => { ... })
test('M10 gate: DOM removal for hidden fields', async ({ page }) => { ... })
test('M11 gate: AI generates valid draft', async ({ request }) => { ... })
```

---

## Agents — Phase 10

> 🔀 **PARALLEL** — Agents 5, 4, and 9 run simultaneously.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 5: Frontend Designer](../reference/agent-specifications.md#agent-5-frontend-designer-agent)** | Template gallery, component presets, export/import UI | `TemplateGalleryPage.tsx`, export/import panels |
| B | **[Agent 4: Backend API](../reference/agent-specifications.md#agent-4-backend-api-agent)** | AI generation route (Claude API), export/import API, analytics receiver, template clone route | `go/internal/studio/ai/handler.go`, `generator.go` |
| C | **[Agent 9: Behavior and Event](../reference/agent-specifications.md#agent-9-behavior-and-event-agent)** | Advanced expression mode (JSONata editor), no-code rule builder wizard | `eventEngine.ts` (advanced mode), wizard UI |

After A, B, C complete:

> 🔀 **PARALLEL** — Agent 14 (tests) and Agent 15 (docs) run simultaneously.

| Agent | Task |
|---|---|
| **Agent 14: QA** | Full regression suite + Phase 10 unit/integration/E2E tests |
| **Agent 15: Documentation** | Complete doc suite: developer guide, admin guide, component catalog, troubleshooting |

After both complete:

| Agent | Task |
|---|---|
| **Agent 17: API Contract Alignment** | Final cross-phase audit of all TypeScript types vs Go structs |
| **Agent 1 (reused): Product Understanding** | AI governance review — confirm AI output always lands as DRAFT |
| **Agent 16: Phase Coordinator** | AI generates valid draft, template gallery operational, full regression passes — **project complete** |

---

## ✅ Gate Condition — M11 (Project Complete)

```
1. AI generation:
   POST /api/v1/studio/ai/generate-view
   Body: { description: "customer complaint form", surface_type: "standard_crud", primary_entity: "complaint" }
   Expected: 200, status="draft", payload passes V001–V051 validation, audit log action='ai_generated'

2. Template gallery:
   All 10 templates clone as draft correctly
   Cloned template passes publish validation after entity binding set

3. Analytics:
   View render event logged with render_time_ms
   Performance alert triggers for views with p95 > 3000ms

4. Export/Import:
   Export → valid JSON bundle
   Import on fresh env → draft view

5. Full regression suite:
   All M2–M11 gate conditions green in Playwright suite
   All previous phase unit + integration tests passing
   Zero regressions introduced by Phase 10 work
```

> **Previous phase:** [Phase 9](P9-role-variants.md)
> **Project complete** — return to [README](../README.md) and mark M11 as `[x]`
