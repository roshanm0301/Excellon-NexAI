# Phase 3 — View Designer Shell

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M4 |
| **Gate Condition** | Designer creates valid draft: typed surface + entity binding + drag component + inspector + save draft |
| **Depends On** | [Phase 2](P2-component-registry.md) — component registry seeded; entity API routes available |
| **Agents** | Agent 5 ‖ Agent 8 → Agent 4 → Agent 14 (QA) + Agent 17 (Contract) + Agent 15 (Docs) + Agent 16 (Coordinator) |
| **Code Changes** | ✅ Wizard · Canvas · Left Rail · Right Inspector · Zustand store · EntityFieldPicker · DataSourcePanel |
| **Commit** | `feat: ui-studio Phase 3 — view designer shell, canvas, entity field picker, right inspector, Zustand store` |

> **Depends on Phase 2:** Component registry must be seeded so the Library panel can load components.

---

## New Files to Create

```
app/src/react/src/pages/admin/ui-studio-v2/UIStudioV2NewWizard.tsx    ← complete (was stub)
app/src/react/src/components/studio-v2/StudioV2Canvas.tsx             ← extend (was 40%)
app/src/react/src/components/studio-v2/StudioV2LeftRail.tsx           ← extend (was 40%)
app/src/react/src/components/studio-v2/StudioV2RightInspector.tsx     ← extend (was 40%)
app/src/react/src/components/studio-v2/EntityFieldPicker.tsx          NEW
app/src/react/src/components/studio-v2/DataSourcePanel.tsx            NEW
app/src/react/src/components/studio-v2/panels/TextInputPanel.tsx      NEW (one per component type)
app/src/react/src/stores/studioStore.ts                               NEW (Zustand)
```

---

## 3.1 Zustand Store — `stores/studioStore.ts`

```typescript
import { create } from 'zustand'
import { ViewArtifactPayload, ComponentNode } from '../types/studio'

interface StudioStore {
  viewKey:              string | null
  payload:              ViewArtifactPayload | null
  selectedComponentKey: string | null
  isDirty:              boolean
  isSaving:             boolean

  // Actions
  loadView:             (viewKey: string) => Promise<void>
  setSelectedComponent: (key: string | null) => void
  updateComponentProps: (key: string, props: Record<string, unknown>) => void
  addComponent:         (parentKey: string, component: ComponentNode, position: number) => void
  removeComponent:      (key: string) => void
  moveComponent:        (key: string, newParentKey: string, position: number) => void
  saveDraft:            () => Promise<void>
  publish:              (changelog: string) => Promise<void>
  setDirty:             (dirty: boolean) => void
}
```

---

## 3.2 New View Wizard — complete `UIStudioV2NewWizard.tsx`

```
Step 1: Surface Type  (visual cards — icon + description per type)
Step 2: Primary Entity  (searchable picker from GET /api/v1/studio/entities)
Step 3: ViewCode  (optional — monospace input, unique per entity+surface)
Step 4: View Name + Key  (auto-generated from name, editable)
Step 5: Quick Start  (Blank Canvas / Smart CRUD Scaffold / Clone Existing)
→ Creates artifact_header + initial draft artifact_version
```

---

## 3.3 Designer Canvas — extend `StudioV2Canvas.tsx`

**Three-panel layout:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Toolbar: [ViewCode] [Surface: standard_crud] [Status: Draft v1]      │
│          [Undo] [Redo]   [Save Draft]  [Preview]  [Publish]          │
├──────────┬───────────────────────────────────────┬───────────────────┤
│          │                                       │                   │
│  LEFT    │            CANVAS                     │   RIGHT           │
│  RAIL    │                                       │   INSPECTOR       │
│          │  ┌── Header Zone ──────────────────┐  │                   │
│ Outline  │  │  [component] [component]        │  │  Props Tab        │
│ Library  │  └─────────────────────────────────┘  │  Binding Tab      │
│ Entity   │  ┌── Lines Zone ───────────────────┐  │  Style Tab        │
│ Fields   │  │  (header_line surface only)     │  │  Events Tab       │
│ Smart    │  └─────────────────────────────────┘  │                   │
│ CRUD     │  ┌── Footer Zone ──────────────────┐  │  (selected        │
│ Events   │  │  [TotalsPanel] [ActionBar]      │  │   component       │
│          │  └─────────────────────────────────┘  │   config)         │
└──────────┴───────────────────────────────────────┴───────────────────┘
```

**Canvas requirements:**
- Drag from Library → canvas enforces `allowed_parents` / `allowed_children` from Component Registry
- Surface-aware zones: `header_line` → Header + Lines + Footer; `standard_crud` → Form + Grid
- Click to select → opens Right Inspector
- Right-click context menu: duplicate, delete, move up/down, wrap in section
- Multi-select: Shift+click
- Keyboard: `Delete` remove · `Ctrl+Z` undo · `Ctrl+D` duplicate · `Ctrl+S` save draft

**Left Rail tabs:**
1. **Outline** — component tree, drag to reorder, click to select
2. **Library** — component palette by category, filtered by current `surface_type`
3. **Entity Fields** — `EntityFieldPicker`: browse entity attributes, drag to canvas (auto-creates binding)
4. **Smart CRUD** — `SmartCrudPanel.tsx` (reuse existing), syncs with canvas in real-time
5. **Data Sources** — `DataSourcePanel`: define data sources with entity, filters, sort config
6. **Events** — event list for current view (fully enabled in Phase 5)

---

## 3.4 Right Inspector Interface Contract

> ⚠️ **Agree on this interface BEFORE running Agent 5 and Agent 8 in parallel.**
> Agent 5 owns the shell + Props tab. Agent 8 owns the Binding tab contents.

```typescript
interface InspectorProps {
  componentKey:    string
  componentCode:   string
  currentProps:    Record<string, unknown>
  currentBinding?: FieldBinding
  entityType?:     string
  onPropsChange:   (props: Record<string, unknown>) => void
  onBindingChange: (binding: FieldBinding) => void
}
```

**Inspector tabs (context-sensitive):**
```
Props Tab:   renders props form from component's config_schema (JSON Schema → form fields)
Binding Tab: entity field picker | data source selector | expression editor
Style Tab:   width, label position, visibility class, conditional styling
Events Tab:  add/edit field events for this component (Phase 5)
```

---

## Testing Phase 3

### Unit Tests — `studioStore.test.ts`

```typescript
// 1. Initial state
test('store initializes with null viewKey and payload', () => {
  const store = useStudioStore.getState()
  expect(store.viewKey).toBeNull()
  expect(store.payload).toBeNull()
  expect(store.isDirty).toBe(false)
})

// 2. addComponent marks store dirty
test('addComponent sets isDirty=true', () => {
  const { addComponent } = useStudioStore.getState()
  addComponent('page_root', { component_key: 'txt1', component_code: 'text_input' }, 0)
  expect(useStudioStore.getState().isDirty).toBe(true)
})

// 3. removeComponent removes from tree
test('removeComponent removes node from payload tree', () => {
  // seed store with payload containing 'txt1'
  useStudioStore.getState().removeComponent('txt1')
  const tree = useStudioStore.getState().payload?.component_tree
  expect(findNode(tree, 'txt1')).toBeUndefined()
})

// 4. moveComponent changes parent
test('moveComponent places node at correct position under new parent', () => { ... })

// 5. undo restores previous state
test('Ctrl+Z undo restores previous component tree', () => { ... })
```

### Constraint Tests — `DesignerConstraints.test.ts`

```typescript
// 1. Cannot drop editor_grid into section (wrong parent)
test('editor_grid cannot be dropped into section', () => {
  // editor_grid allowed_parents = ['header_line_zone', 'page_root']
  // section is not in allowed_parents
  expect(() => addComponent('section_1', editorGridNode, 0)).toThrow('Invalid parent')
})

// 2. Cannot drop page_root inside tab_container
test('page_root cannot be nested', () => {
  // page_root allowed_parents = []
  expect(() => addComponent('tab_1', pageRootNode, 0)).toThrow('Invalid parent')
})

// 3. Duplicate component_key rejected on save
test('duplicate component_key returns 400 on save draft', async () => {
  // manually create payload with two nodes having same component_key
  const res = await saveDraftAPI({ ...payload, duplicateKeys: true })
  expect(res.status).toBe(400)
  expect(res.body.error).toMatch(/duplicate component_key/)
})
```

### Wizard Tests — `UIStudioV2NewWizard.e2e.ts` (Playwright)

```typescript
// E2E 1: Complete wizard creates view in DB
test('full wizard creates draft view', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio')
  await page.click('text=New View')
  // Step 1: select surface
  await page.click('[data-surface="standard_crud"]')
  await page.click('text=Next')
  // Step 2: select entity
  await page.click('[data-entity="customer"]')
  await page.click('text=Next')
  // Step 3: skip ViewCode
  await page.click('text=Next')
  // Step 4: name
  await page.fill('[name="view_label"]', 'Customer Master')
  await page.click('text=Next')
  // Step 5: Blank Canvas
  await page.click('[data-quickstart="blank"]')
  await page.click('text=Create View')
  // Expect redirect to designer
  await expect(page).toHaveURL(/\/admin\/ui-studio\/.*\/edit/)
})

// E2E 2: Surface type selection updates canvas zones
test('header_line surface shows Header + Lines + Footer zones', async ({ page }) => {
  // create header_line view via wizard
  await expect(page.locator('[data-zone="header"]')).toBeVisible()
  await expect(page.locator('[data-zone="lines"]')).toBeVisible()
  await expect(page.locator('[data-zone="footer"]')).toBeVisible()
})
```

### Designer E2E Tests — `DesignerCanvas.e2e.ts` (Playwright)

```typescript
// E2E 3: Full drag, bind, save flow
test('drag component, bind field, save draft', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/customer_master/edit')
  // Drag text_input from Library to Form zone
  await dragFromTo(page, '[data-library-item="text_input"]', '[data-zone="form"]')
  // Select it
  await page.click('[data-component-key="text_input_1"]')
  // Binding tab — pick email field
  await page.click('text=Binding')
  await page.click('[data-field="email"]')
  // Save Draft
  await page.click('text=Save Draft')
  await expect(page.locator('[data-status]')).toContainText('Draft')
})

// E2E 4: Refresh page — state persists
test('component and binding survive page refresh', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/customer_master/edit')
  await page.reload()
  await expect(page.locator('[data-component-key="text_input_1"]')).toBeVisible()
  // verify binding still set
  await page.click('[data-component-key="text_input_1"]')
  await page.click('text=Binding')
  await expect(page.locator('[data-bound-field]')).toContainText('email')
})

// E2E 5: Keyboard shortcuts
test('Ctrl+S triggers save draft', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/customer_master/edit')
  await page.keyboard.press('Control+s')
  await expect(page.locator('[data-toast]')).toContainText('Draft saved')
})

test('Delete key removes selected component', async ({ page }) => {
  await page.click('[data-component-key="text_input_1"]')
  await page.keyboard.press('Delete')
  await expect(page.locator('[data-component-key="text_input_1"]')).not.toBeVisible()
})
```

### State Restore Tests — `DesignerStateRestore.test.ts`

```typescript
// 1. loadView populates store from API
test('loadView fills payload from GET /studio/views/:key', async () => {
  await useStudioStore.getState().loadView('customer_master')
  expect(useStudioStore.getState().payload?.view_key).toBe('customer_master')
})

// 2. Inspector wired for all 56 component types
test('right inspector renders for all 56 component codes', () => {
  ALL_56_COMPONENT_CODES.forEach(code => {
    render(<StudioV2RightInspector componentCode={code} ... />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })
})
```

---

## Agents — Phase 3

> ⚠️ **Agree on `InspectorProps` interface (section 3.4) BEFORE starting Agent 5 and Agent 8.**

> 🔀 **PARALLEL** — Agent 5 and Agent 8 run simultaneously after interface contract agreed.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 5: Frontend Designer](../reference/agent-specifications.md#agent-5-frontend-designer-agent)** | Canvas shell, wizard, left rail, context menu, keyboard shortcuts, Zustand store | `UIStudioV2NewWizard.tsx`, `StudioV2Canvas.tsx`, `StudioV2LeftRail.tsx`, `studioStore.ts` |
| B | **[Agent 8: Data Binding](../reference/agent-specifications.md#agent-8-data-binding-and-data-source-agent)** | Binding tab in Inspector, EntityFieldPicker, DataSourcePanel | `StudioV2RightInspector.tsx` (Binding tab), `EntityFieldPicker.tsx`, `DataSourcePanel.tsx` |

After A and B complete:

> ➡️ **SEQUENTIAL** — Agent 4 extends API to support smart CRUD config persistence.

| Agent | Task |
|---|---|
| **Agent 4: Backend API** | Extend entity fields endpoint, smart CRUD config persistence |
| **Agent 14: QA** | Run all unit, constraint, wizard, E2E, and state restore tests above |
| **Agent 17: API Contract Alignment** | Validate `studioV2Api.ts` calls match Go handler responses |
| **Agent 15: Documentation** | M4 milestone summary + designer user guide |
| **Agent 16: Phase Coordinator** | Confirm draft payload valid, inspector wired for all 56 types — **gate M5** |

---

## ✅ Gate Condition — M4

```
Playwright E2E:
1. Navigate /admin/ui-studio → click New View
2. Complete wizard: standard_crud surface, Customer entity, name "Customer Master"
3. Drag text_input from Library to canvas
4. Select component → Right Inspector shows Props + Binding tabs
5. Binding tab: pick 'email' field → binding set
6. Save Draft → 200 response
7. Refresh page → component and binding still present

Constraint check:
- Cannot drop editor_grid into section → error shown
- Save draft with duplicate component_key → 400 returned
```

> **Previous phase:** [Phase 2](P2-component-registry.md)
> **Next phase:** [Phase 4 — Runtime Renderer](P4-runtime-renderer.md)
