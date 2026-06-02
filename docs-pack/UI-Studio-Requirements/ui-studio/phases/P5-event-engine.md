# Phase 5 — Field & Grid Event Engine

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M6 |
| **Gate Condition** | Configured field change events fire and produce correct UI behavior at runtime |
| **Depends On** | [Phase 4](P4-runtime-renderer.md) — `StudioRenderer` must be operational; `ConditionTreeBuilder` (existing) |
| **Agents** | Agent 9 ‖ Agent 5 ‖ Agent 14 (QA, parallel) → Agent 4 → Agent 17 + Agent 15 + Agent 16 |
| **Code Changes** | ✅ `eventEngine.ts` (pure TS) · `useEventEngine.ts` · `EventsTab.tsx` |
| **Commit** | `feat: ui-studio Phase 5 — field/grid event engine (pure TS), useEventEngine hook, events tab, circular dependency detection` |

> **Depends on Phase 4:** StudioRenderer must exist to wire the event engine into the runtime.
> **Reuses existing:** `ConditionTreeBuilder` from `components/studio/ConditionTree/` — do not rebuild.

---

## New Files to Create

```
app/src/react/src/lib/studio-v2/eventEngine.ts          NEW (pure TypeScript — NO React imports)
app/src/react/src/lib/studio-v2/useEventEngine.ts       NEW (React hook wrapper)
app/src/react/src/components/studio-v2/EventsTab.tsx    NEW (designer events builder)
```

> ⚠️ **`eventEngine.ts` must have zero React imports — it must be independently testable with pure Node/Vitest.**

---

## 5.1 Event Engine — `lib/studio-v2/eventEngine.ts`

```typescript
// Pure TypeScript — no React imports. Independently testable.

export interface FormState {
  header:  Record<string, unknown>
  lines:   Record<string, unknown>[]
  context: { userId: string; tenantId: string; viewCode?: string }
}

export interface EventEffect {
  type:           EventActionType
  targetField?:   string
  targetSection?: string
  value?:         unknown
  message?:       string
  serviceCall?:   ServiceCallConfig
}

export function buildEventEngine(events: EventDefinition[]) {
  return {
    fire(trigger: string, triggerField: string | undefined, state: FormState): EventEffect[] {
      return events
        .filter(e => e.event_type === trigger)
        .filter(e => !e.source_field || e.source_field === triggerField)
        .filter(e => evaluateCondition(e.conditions, state))
        .sort((a, b) => a.priority - b.priority)
        .flatMap(e => e.actions.map(a => resolveAction(a, state)))
    }
  }
}

function evaluateCondition(conditions: ConditionGroup, state: FormState): boolean {
  // Reuse condition evaluation logic from ConditionTreeBuilder
  // Safe eval: no new Function() — use whitelist expression evaluator
  if (!conditions || !conditions.rules?.length) return true
  // evaluate AND/OR groups against state ...
}

function resolveAction(action: EventAction, state: FormState): EventEffect {
  return {
    type:        action.action_type,
    targetField: action.target_field,
    value:       action.value_expression
                   ? evaluateExpression(action.value_expression, state)
                   : undefined,
    serviceCall: action.service_call,
  }
}
```

---

## 5.2 Field Change Action Catalog (13 actions)

| Action | Runtime Behavior |
|---|---|
| `show` | Set field/section visible |
| `hide` | Set field/section hidden |
| `enable` | Remove disabled state from field |
| `disable` | Apply disabled state to field |
| `required` | Mark field required (adds validation) |
| `optional` | Mark field optional (removes required validation) |
| `clear` | Set field value to `null` |
| `set_value` | Set field value to expression result |
| `refresh_lookup` | Re-query data source for target `entity_picker` |
| `recalculate` | Evaluate JSONata expression, set target field value |
| `show_warning` | Render yellow inline alert message below field |
| `show_popup` | Open confirmation modal |
| `auto_populate` | Call configured API, populate fieldMap into form |

---

## 5.3 Grid Cell Change Action Catalog (6 actions)

| Action | Runtime Behavior |
|---|---|
| `recalculate_row_amount` | Evaluate row expression (e.g. `qty × rate`) |
| `auto_populate_columns` | Fetch service response, populate related row columns |
| `refresh_row_lookup` | Re-query row-level `entity_picker` |
| `show_row_warning` | Show inline row validation message in grid cell |
| `call_domain_service` | POST to configured endpoint with ViewCode + row state |
| `apply_row_validation` | Display row-level validation feedback |

---

## 5.4 Events Tab in Designer — `EventsTab.tsx`

```
[+ Add Event]

| Trigger      | Trigger Field | Condition | Action         | Target Field |
|--------------|---------------|-----------|----------------|--------------|
| field_change | productType   | (always)  | refresh_lookup | itemCode     |
| field_change | qty           | qty > 0   | recalculate    | amount       |

Click row → Event Editor opens:
  1. Trigger Type: dropdown (field_change / grid_cell_change / action_click / ...)
  2. Trigger Field: field picker from entity attributes
  3. Condition: ConditionTreeBuilder (reuse existing components/studio/ConditionTree/)
  4. Actions: ordered list
       Add action → select action_type → configure target + expression
  5. Test: dry-run with sample values → shows predicted effects highlighted on canvas
```

---

## 5.5 Circular Dependency Detection

At publish validation time, detect event chains where a field triggers itself:

```
Field A → changes → Field B → changes → Field A = BLOCKED (V021)
Report: "Circular event dependency: fieldA → fieldB → fieldA"
POST /api/v1/studio/views/:viewKey/validate returns:
  { errors: [{ code: 'V021', message: 'Circular event dependency: qty → amount → qty' }] }
```

---

## Testing Phase 5

### Unit Tests — `eventEngine.test.ts` (pure Vitest — no browser, no React)

```typescript
import { buildEventEngine } from '../lib/studio-v2/eventEngine'

const sampleEvents: EventDefinition[] = [
  {
    event_id:    'evt1',
    event_type:  'field_change',
    source_field: 'productType',
    conditions:  { operator: 'AND', rules: [] }, // always fires
    actions:     [{ action_type: 'refresh_lookup', target_field: 'itemCode' }],
    priority:    100
  },
  {
    event_id:    'evt2',
    event_type:  'field_change',
    source_field: 'qty',
    conditions:  { operator: 'AND', rules: [{ field: 'qty', operator: 'gt', value: 0 }] },
    actions:     [{ action_type: 'recalculate', target_field: 'amount', value_expression: 'qty * rate' }],
    priority:    200
  }
]

// 1. Correct action returned for trigger
test('fire field_change on productType returns refresh_lookup for itemCode', () => {
  const engine = buildEventEngine(sampleEvents)
  const effects = engine.fire('field_change', 'productType', { header: {}, lines: [], context: {} as any })
  expect(effects).toHaveLength(1)
  expect(effects[0].type).toBe('refresh_lookup')
  expect(effects[0].targetField).toBe('itemCode')
})

// 2. Condition false — event does NOT fire
test('qty condition qty>0 with qty=0 does not fire', () => {
  const engine = buildEventEngine(sampleEvents)
  const effects = engine.fire('field_change', 'qty', { header: { qty: 0, rate: 100 }, lines: [], context: {} as any })
  expect(effects).toHaveLength(0)
})

// 3. Condition true — event fires and returns correct value
test('qty condition qty>0 with qty=5 fires and computes amount', () => {
  const engine = buildEventEngine(sampleEvents)
  const effects = engine.fire('field_change', 'qty', { header: { qty: 5, rate: 100 }, lines: [], context: {} as any })
  expect(effects).toHaveLength(1)
  expect(effects[0].value).toBe(500)
})

// 4. Multiple events for same trigger — sorted by priority, all fire
test('multiple events for same trigger fire in priority order', () => {
  const twoEvents: EventDefinition[] = [
    { ...sampleEvents[0], priority: 200, actions: [{ action_type: 'show', target_field: 'notes' }] },
    { ...sampleEvents[0], priority: 100, actions: [{ action_type: 'hide', target_field: 'notes' }] },
  ]
  const engine = buildEventEngine(twoEvents)
  const effects = engine.fire('field_change', 'productType', { header: {}, lines: [], context: {} as any })
  expect(effects[0].type).toBe('hide')   // priority 100 first
  expect(effects[1].type).toBe('show')   // priority 200 second
})

// 5. Wrong trigger type — event does not fire
test('grid_cell_change event does not fire on field_change trigger', () => {
  const engine = buildEventEngine([{ ...sampleEvents[0], event_type: 'grid_cell_change' }])
  const effects = engine.fire('field_change', 'productType', { header: {}, lines: [], context: {} as any })
  expect(effects).toHaveLength(0)
})

// 6. No source_field filter — fires for any field change
test('event with no source_field fires for any trigger field', () => {
  const anyFieldEvent: EventDefinition = { ...sampleEvents[0], source_field: undefined }
  const engine = buildEventEngine([anyFieldEvent])
  const effects = engine.fire('field_change', 'anyRandomField', { header: {}, lines: [], context: {} as any })
  expect(effects).toHaveLength(1)
})

// 7. Circular dependency detection
test('buildEventEngine detects circular event dependency', () => {
  const circularEvents: EventDefinition[] = [
    { event_id: 'e1', event_type: 'field_change', source_field: 'qty',    actions: [{ action_type: 'set_value', target_field: 'amount' }], conditions: {}, priority: 100 },
    { event_id: 'e2', event_type: 'field_change', source_field: 'amount', actions: [{ action_type: 'set_value', target_field: 'qty'    }], conditions: {}, priority: 100 },
  ]
  expect(() => buildEventEngine(circularEvents)).toThrow(/circular/i)
})
```

### Integration Tests — `EventEngineIntegration.integration.test.ts`

```typescript
// 1. Configure event in designer → publish → fire at runtime
test('field_change event configured in designer applies at runtime', async () => {
  // Setup: create view with a field_change event via API
  await saveDraft('test_view', payloadWithRefreshLookupEvent)
  await publishView('test_view', 'test event')

  // At runtime: simulate field change
  const { result } = renderHook(() => useEventEngine('test_view'))
  const effects = result.current.fire('field_change', 'productType', mockState)
  expect(effects.some(e => e.type === 'refresh_lookup')).toBe(true)
})

// 2. Event definition persisted in artifact_version payload
test('event definitions survive draft → publish round trip', async () => {
  await saveDraft('test_view', payloadWithEvents)
  await publishView('test_view')
  const published = await getPublishedView('test_view')
  expect(published.event_definitions).toHaveLength(2)
  expect(published.event_definitions[0].event_type).toBe('field_change')
})
```

### Designer Tests — `EventsTab.e2e.ts` (Playwright)

```typescript
// E2E 1: Add event via Events tab
test('add field_change event in designer', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/test_view/edit')
  await page.click('[data-tab="events"]')
  await page.click('text=+ Add Event')
  // Select trigger type
  await page.selectOption('[name="event_type"]', 'field_change')
  // Select trigger field
  await page.click('[name="source_field"]')
  await page.click('text=qty')
  // Add action
  await page.click('text=Add Action')
  await page.selectOption('[name="action_type"]', 'recalculate')
  await page.fill('[name="value_expression"]', 'qty * rate')
  await page.click('text=Save Event')
  // Event appears in list
  await expect(page.locator('[data-event-row]')).toHaveCount(1)
})

// E2E 2: ConditionTreeBuilder renders within event editor
test('ConditionTreeBuilder renders in event editor', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/test_view/edit')
  await page.click('[data-tab="events"]')
  await page.click('text=+ Add Event')
  await expect(page.locator('[data-testid="condition-tree-builder"]')).toBeVisible()
})

// E2E 3: Dry-run test shows predicted effects on canvas
test('dry-run event shows predicted effects', async ({ page }) => {
  // open event with recalculate action
  await page.click('[data-event-row]:first-child')
  await page.fill('[name="test-qty"]', '5')
  await page.fill('[name="test-rate"]', '100')
  await page.click('text=Test Event')
  await expect(page.locator('[data-predicted-effect="amount"]')).toContainText('500')
})
```

### Publish Validation Tests — `CircularDependency.test.ts`

```typescript
// 1. Circular dependency blocked at publish
test('publish blocked with V021 for circular event dependency', async () => {
  const view = await createViewWithCircularEvents()
  const res = await fetch(`/api/v1/studio/views/${view.view_key}/publish`, { method: 'POST' })
  expect(res.status).toBe(422)
  const body = await res.json()
  expect(body.errors.some((e: any) => e.code === 'V021')).toBe(true)
})

// 2. Non-circular events publish successfully
test('non-circular events pass publish validation', async () => {
  const view = await createViewWithNonCircularEvents()
  const res = await fetch(`/api/v1/studio/views/${view.view_key}/publish`, { method: 'POST' })
  expect(res.status).toBe(200)
})
```

---

## Agents — Phase 5

> ⚠️ **Agree on `EventEffect` interface before starting Agents 9, 5, and 14.**
> Agent 9 defines the interface; Agents 5 and 14 consume it.

> 🔀 **PARALLEL** — Agents 9, 5, and 14 run simultaneously after `EventEffect` interface is agreed.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 9: Behavior and Event](../reference/agent-specifications.md#agent-9-behavior-and-event-agent)** | `eventEngine.ts` (pure TS), `useEventEngine.ts`, wire into `StudioRenderer` | `eventEngine.ts`, `useEventEngine.ts`, `StudioRenderer.tsx` (event wiring) |
| B | **[Agent 5: Frontend Designer](../reference/agent-specifications.md#agent-5-frontend-designer-agent)** | Events tab in Left Rail, event editor, ConditionTreeBuilder integration | `EventsTab.tsx`, `StudioV2LeftRail.tsx` (Events tab) |
| C | **[Agent 14: QA](../reference/agent-specifications.md#agent-14-qa-and-test-agent)** | Write and run all tests in this phase | `eventEngine.test.ts`, `EventEngineIntegration.integration.test.ts`, `EventsTab.e2e.ts` |

After all complete:

| Agent | Task |
|---|---|
| **Agent 4: Backend API** | Extend draft/publish API to persist `event_definitions` in artifact payload |
| **Agent 17: API Contract Alignment** | Validate `EventDefinition` TypeScript type matches stored JSONB in DB |
| **Agent 15: Documentation** | M6 milestone summary + event configuration guide |
| **Agent 16: Phase Coordinator** | Field change fires correct actions, visibility rules apply, circular dependency detected — **gate M7** |

---

## ✅ Gate Condition — M6

```
1. Pure TS tests pass (no browser required):
   eventEngine.test.ts — all 7 tests green

2. Integration test:
   Configure refresh_lookup event in designer → publish → navigate to runtime
   Change trigger field → target entity_picker refreshes its options

3. Circular dependency:
   POST /api/v1/studio/views/circular_view/publish
   Expected: 422 with errors[{ code: 'V021' }]

4. Visibility rule:
   Configure hide event: when orderType='Internal', hide discount field
   Runtime: set orderType='Internal' → discount field disappears from DOM
```

> **Previous phase:** [Phase 4](P4-runtime-renderer.md)
> **Next phase:** [Phase 6 — Header-Line Workspace](P6-header-line-workspace.md)
