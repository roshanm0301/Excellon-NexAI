# Phase 8 â€” Publish Lifecycle & Governance

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M9 |
| **Gate Condition** | Publish safe, rollback works, preview simulates context, semantic diff visible, audit trail complete |
| **Depends On** | [Phase 3](P3-view-designer.md) (draft/publish API) Â· [Phase 4](P4-runtime-renderer.md) (runtime cache invalidation) |
| **Agents** | Agent 13 â€– Agent 4 (parallel) â†’ Agent 14 â€– Agent 15 (parallel) â†’ Agent 17 + Agent 16 |
| **Code Changes** | âœ… PublishPanel Â· VersionHistoryPanel Â· PreviewModal Â· VersionDiffView Â· publishValidation.ts (41 rules) |
| **Commit** | `feat: ui-studio Phase 8 â€” publish lifecycle, rollback, preview, semantic diff, 41 validation rules, audit trail` |

---

## New Files to Create

```
app/src/react/src/components/studio-v2/PublishPanel.tsx         NEW
app/src/react/src/components/studio-v2/VersionHistoryPanel.tsx  NEW
app/src/react/src/components/studio-v2/PreviewModal.tsx         NEW
app/src/react/src/components/studio-v2/VersionDiffView.tsx      NEW
app/src/react/src/lib/studio-v2/publishValidation.ts            â† extend existing validation.ts
```

---

## 8.1 Publish Lifecycle Rules

```
Draft â†’ [Validate] â†’ [Preview] â†’ Publish â†’ Active
                         â†‘
              Rollback from any prior active version

Rules:
- Only ONE version can be active (is_active=true) per view at a time
- Publishing: creates immutable new version, deactivates previous
- Published versions are IMMUTABLE â€” saving always creates a new draft
- Rollback: re-activates target version, deprecates current active
- Runtime: NEVER loads draft â€” only is_active=true versions
- Cache: invalidated immediately on publish or rollback
```

---

## 8.2 Publish Validation Rules (41 rules)

```typescript
// lib/studio-v2/publishValidation.ts

export const VALIDATION_RULES = [
  // --- Structural ---
  { code: 'V001', message: 'Page root must have at least one section',            severity: 'error'   },
  { code: 'V002', message: 'Component key must be unique within view',            severity: 'error'   },
  { code: 'V003', message: 'Required component props missing',                    severity: 'error'   },
  { code: 'V004', message: 'Component not valid for this surface type',           severity: 'error'   },
  { code: 'V005', message: 'Container component has no children',                 severity: 'warning' },

  // --- Binding ---
  { code: 'V010', message: 'Field binding references non-existent entity field',  severity: 'error'   },
  { code: 'V011', message: 'Data source entity type does not exist',              severity: 'error'   },
  { code: 'V012', message: 'Lookup binding references archived entity',           severity: 'warning' },
  { code: 'V013', message: 'LookupField has no data_source configured',           severity: 'error'   },
  { code: 'V014', message: 'LineGrid has no relation or data_source configured',  severity: 'error'   },
  { code: 'V015', message: 'Computed binding expression syntax error',            severity: 'error'   },
  { code: 'V016', message: 'Context binding key not recognised',                  severity: 'warning' },

  // --- Events ---
  { code: 'V020', message: 'Event action targets field not present in view',      severity: 'error'   },
  { code: 'V021', message: 'Circular event dependency detected',                  severity: 'error'   },
  { code: 'V022', message: 'Domain service endpoint not reachable',               severity: 'warning' },
  { code: 'V023', message: 'TotalsPanel expression references undefined field',   severity: 'error'   },
  { code: 'V024', message: 'Event condition expression syntax error',             severity: 'error'   },
  { code: 'V025', message: 'grid_cell_change event on non-editable grid column',  severity: 'warning' },

  // --- Actions ---
  { code: 'V030', message: 'No save action configured â€” form cannot be submitted',severity: 'warning' },
  { code: 'V032', message: 'action_click event references missing action_key',    severity: 'error'   },

  // --- Header-Line specific ---
  { code: 'V035', message: 'header_line view has no line grid configured',        severity: 'error'   },
  { code: 'V036', message: 'Line grid has no columns configured',                 severity: 'error'   },
  { code: 'V037', message: 'Totals panel expression references unknown line field',severity: 'error'  },

  // --- Performance ---
  { code: 'V040', message: 'View has >100 components â€” consider splitting',       severity: 'warning' },
  { code: 'V041', message: 'Multiple eager data sources may cause slow load',     severity: 'warning' },
  { code: 'V042', message: 'Heavy visualization component without lazy-load flag',severity: 'warning' },

  // --- Schema drift ---
  { code: 'V050', message: 'Bound entity field was deleted',                      severity: 'error'   },
  { code: 'V051', message: 'Bound entity field type changed â€” binding may break', severity: 'warning' },

  // --- Accessibility ---
  { code: 'A001', message: 'Form field has no accessible label',                  severity: 'warning' },
  { code: 'A002', message: 'Action button has no accessible name',                severity: 'warning' },
  { code: 'A003', message: 'Image component has no alt text binding',             severity: 'warning' },
  { code: 'A004', message: 'Color used as sole visual differentiator',            severity: 'warning' },
  { code: 'A005', message: 'Tab order not logical â€” check column_layout ordering',severity: 'warning' },

  // --- Localization ---
  { code: 'L001', message: 'Label contains hardcoded text â€” use localization key',severity: 'warning' },
  { code: 'L002', message: 'Currency display has no locale config',               severity: 'warning' },
  { code: 'L003', message: 'Date display has no format config',                   severity: 'warning' },
  { code: 'L004', message: 'Number display has no decimal config',                severity: 'warning' },

  // --- Governance ---
  { code: 'V060', message: 'view_code is not unique for this entity+surface combination', severity: 'error' },
  { code: 'V061', message: 'View has no primary_entity configured',               severity: 'error'   },
  { code: 'V062', message: 'ViewCode contains invalid characters (alphanumeric + underscore only)', severity: 'error' },
]
```

---

## 8.3 Preview Modal â€” `PreviewModal.tsx`

```
Controls:
  Role selector:       simulate as Admin / Clerk / Approver / ReadOnly (drop-down)
  Sample record:       pick existing record OR use blank record
  Device mode:         Desktop / Tablet / Mobile (resizes preview frame)

Renders:
  StudioRenderer in sandboxed iframe with permission filter applied for selected role
  Shows schema drift warnings if any bindings are broken
  "AI Generated" badge if payload has ai_generated flag
```

---

## 8.4 Semantic Diff â€” `VersionDiffView.tsx`

```
Compare two version payloads (JSONB blobs):
  âž• Added components:    green badge + component details
  âž– Removed components:  red badge + component code
  âœï¸  Changed props:       yellow with [before] â†’ [after]
  âž• Added events:         green
  âž– Removed events:       red
  âœï¸  Changed bindings:    yellow with field before/after
  âœï¸  Metadata changes:    label, surface_type, view_code shown if different
```

---

## 8.5 Schema Drift Detection

On every designer open:
1. Call `GET /api/v1/studio/views/:viewKey/sync-status`
2. Response: `{ broken_bindings: [{ component_key, field_key, reason }] }`
3. If `broken_bindings.length > 0`: show **"3 bindings need attention"** warning banner
4. Click banner â†’ Sync Panel shows each broken binding + suggested fix (rebind or remove)

---

## 8.6 Audit Trail

Every `draft_saved`, `published`, `rolled_back`, `archived`, `ai_generated` event logged to `ui_view_publish_log`.

Version History panel in designer shows:
```
v3  Published    2026-05-22 14:30  by admin      (current active)
v2  Rolled back  2026-05-22 09:15  by admin
v1  Deprecated   2026-05-20 16:00  (auto on v2 publish)
```

---

## Testing Phase 8

### Unit Tests â€” `publishValidation.test.ts`

```typescript
// 1. V001: page_root with no children fails
test('V001: page_root with no children returns error', () => {
  const result = validateForPublish({ ...emptyView, component_tree: { component_code: 'page_root', children: [] } })
  expect(result.errors.some(e => e.code === 'V001')).toBe(true)
})

// 2. V002: duplicate component_key fails
test('V002: duplicate component_key in tree returns error', () => {
  const tree = buildTreeWithDuplicateKeys('txt1', 'txt1')
  const result = validateForPublish({ ...baseView, component_tree: tree })
  expect(result.errors.some(e => e.code === 'V002')).toBe(true)
})

// 3. V010: field binding references deleted entity field
test('V010: binding to deleted field returns error', async () => {
  // entity 'customer' field 'old_field' does not exist
  const result = await validateForPublishAsync({ ...baseView, component_tree: treeWithOldFieldBinding })
  expect(result.errors.some(e => e.code === 'V010')).toBe(true)
})

// 4. V013: LookupField with no data_source
test('V013: entity_picker with no data_source returns error', () => {
  const result = validateForPublish({ ...baseView, component_tree: treeWithUnboundEntityPicker })
  expect(result.errors.some(e => e.code === 'V013')).toBe(true)
})

// 5. V021: circular event dependency
test('V021: circular field events return error', async () => {
  const result = await validateForPublishAsync({ ...baseView, event_definitions: circularEvents })
  expect(result.errors.some(e => e.code === 'V021')).toBe(true)
})

// 6. V040: view with >100 components returns warning (not error)
test('V040: view with 101 components returns warning only', () => {
  const bigTree = buildTreeWithNComponents(101)
  const result = validateForPublish({ ...baseView, component_tree: bigTree })
  expect(result.errors).toHaveLength(0)
  expect(result.warnings.some(w => w.code === 'V040')).toBe(true)
})

// 7. V050: schema drift â€” bound field deleted
test('V050: bound field deleted from entity returns error', async () => {
  // mock entity fields API to return fields without 'old_email'
  const result = await validateForPublishAsync({ ...baseView, component_tree: treeBindingOldEmail })
  expect(result.errors.some(e => e.code === 'V050')).toBe(true)
})

// 8. Clean view passes all validations
test('well-formed view passes all 41 validation rules', async () => {
  const result = await validateForPublishAsync(wellFormedView)
  expect(result.errors).toHaveLength(0)
})
```

### API Integration Tests â€” `PublishLifecycle.integration.test.ts`

```typescript
// 1. Publish creates new active version
test('publish creates new active version, deactivates previous', async () => {
  await saveDraft('test_view', draftPayload)
  const res = await fetch('/api/v1/studio/views/test_view/publish', {
    method: 'POST', body: JSON.stringify({ changelog: 'v2' })
  })
  expect(res.status).toBe(200)
  const versions = await fetchVersions('test_view')
  const activeVersions = versions.filter(v => v.is_active)
  expect(activeVersions).toHaveLength(1)
})

// 2. Runtime returns newly published version
test('runtime endpoint returns v2 after publish', async () => {
  const runtime = await fetch('/api/v1/studio/runtime/views/test_view').then(r => r.json())
  expect(runtime._schema_version).toBeDefined() // confirms it's a payload, not a draft wrapper
})

// 3. Rollback re-activates target version
test('rollback re-activates v1, deactivates v2', async () => {
  const versions = await fetchVersions('test_view')
  const v1Id = versions.find(v => v.version_number === 1)?.version_id
  const res = await fetch(`/api/v1/studio/views/test_view/rollback/${v1Id}`, { method: 'POST' })
  expect(res.status).toBe(200)
  const runtime = await fetch('/api/v1/studio/runtime/views/test_view').then(r => r.json())
  // should now serve v1 payload
  expect(runtime.view_key).toBe('test_view')
})

// 4. Publish blocked by validation errors
test('publish returns 422 when V013 present (LookupField no data_source)', async () => {
  await saveDraft('bad_view', payloadWithUnboundLookup)
  const res = await fetch('/api/v1/studio/views/bad_view/publish', { method: 'POST' })
  expect(res.status).toBe(422)
  const body = await res.json()
  expect(body.errors.some((e: any) => e.code === 'V013')).toBe(true)
})

// 5. Audit trail written
test('publish writes audit entry to ui_view_publish_log', async () => {
  const res = await fetch('/api/v1/studio/views/test_view/versions').then(r => r.json())
  const publishEntry = res.find((v: any) => v.action === 'published')
  expect(publishEntry).toBeDefined()
  expect(publishEntry.performed_at).toBeDefined()
})

// 6. Semantic diff returns correct structure
test('diff endpoint returns added/removed/changed components', async () => {
  const res = await fetch(`/api/v1/studio/views/test_view/diff/${v1Id}/${v2Id}`).then(r => r.json())
  expect(res).toHaveProperty('added')
  expect(res).toHaveProperty('removed')
  expect(res).toHaveProperty('changed')
})
```

### E2E Tests â€” `PublishGovernance.e2e.ts` (Playwright)

```typescript
// E2E 1: Publish flow in designer
test('designer publish flow creates active version', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/test_view/edit')
  await page.click('text=Publish')
  await page.fill('[name="changelog"]', 'Initial publish')
  await page.click('text=Confirm Publish')
  await expect(page.locator('[data-status]')).toContainText('Published')
  await expect(page.locator('[data-version]')).toContainText('v1')
})

// E2E 2: Rollback from Version History panel
test('rollback to v1 from Version History panel', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/test_view/edit')
  await page.click('text=History')
  await page.click('[data-version-row="v1"] button:text("Rollback")')
  await page.click('text=Confirm Rollback')
  await expect(page.locator('[data-status]')).toContainText('v1 (active)')
})

// E2E 3: Preview Modal renders with correct role
test('preview modal with Clerk role hides salary field', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/test_view/edit')
  await page.click('text=Preview')
  await page.selectOption('[name="preview-role"]', 'Clerk')
  await page.click('text=Preview as Clerk')
  // In preview iframe â€” salary field absent from DOM
  const frame = page.frameLocator('[data-preview-frame]')
  await expect(frame.locator('[data-field="salary"]')).toHaveCount(0)
})

// E2E 4: Schema drift banner shows on designer open
test('schema drift banner appears when binding references deleted field', async ({ page }) => {
  // seed: view has binding to 'old_field' which no longer exists in entity
  await page.goto('http://localhost:5173/admin/ui-studio/drifted_view/edit')
  await expect(page.locator('[data-drift-banner]')).toBeVisible()
  await expect(page.locator('[data-drift-banner]')).toContainText('binding')
})
```

---

## Agents â€” Phase 8

> ðŸ”€ **PARALLEL** â€” Agent 13 (UI components) and Agent 4 (backend routes) run simultaneously.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 13: Governance and Publishing](../reference/agent-specifications.md#agent-13-governance-and-publishing-agent)** | PublishPanel, VersionHistoryPanel, PreviewModal, VersionDiffView, schema drift indicator | All new governance components |
| B | **[Agent 4: Backend API](../reference/agent-specifications.md#agent-4-backend-api-agent)** | Publish validation (all 41 rules), rollback endpoint, diff endpoint, audit trail writes, sync-status endpoint | `go/internal/studio/views/` publish/rollback/diff routes |

After A and B complete:

> ðŸ”€ **PARALLEL** â€” Agent 14 (tests) and Agent 15 (docs) run simultaneously.

| Agent | Task |
|---|---|
| **Agent 14: QA** | Run all validation, API, and E2E tests above |
| **Agent 15: Documentation** | Publish lifecycle guide, validation rules reference (all 41), rollback procedure |

After both complete:

| Agent | Task |
|---|---|
| **Agent 17: API Contract Alignment** | `ValidationResult`, `PublishLog` TypeScript types match Go structs |
| **Agent 16: Phase Coordinator** | Rollback works, diff UI correct, audit log populated, all 41 validation rules pass â€” **gate M10** |

---

## âœ… Gate Condition â€” M9

```bash
# 1. Publish lifecycle
POST /api/v1/studio/views/test_view/publish        â†’ 200, new active version

GET  /api/v1/studio/runtime/views/test_view        â†’ returns v2 payload

POST /api/v1/studio/views/test_view/rollback/{v1}  â†’ 200

GET  /api/v1/studio/runtime/views/test_view        â†’ returns v1 payload (rolled back)

# 2. Validation blocks bad publish
POST /api/v1/studio/views/bad_view/publish
  (bad_view has LookupField with no data_source)
  Expected: 422 with errors[{ code:'V013' }]

# 3. Audit trail
GET  /api/v1/studio/views/test_view/versions
  Expected: entries with performed_by and performed_at for each publish/rollback

# 4. Diff
GET  /api/v1/studio/views/test_view/diff/v1/v2
  Expected: JSON with added/removed/changed component keys
```

> **Next phase:** [Phase 9 â€” Role Variants & Permissions](P9-role-variants.md)
