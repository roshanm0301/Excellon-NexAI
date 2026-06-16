# Phase 6 â€” Header-Line Transaction Workspace

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M7 |
| **Gate Condition** | Generic header-line surface fully operational â€” validated with Sale Order E2E |
| **Depends On** | [Phase 5](P5-event-engine.md) â€” Event engine operational for row-level events |
| **Agents** | Agent 4 â€– Agent 11 â€– Agent 8 (parallel) â†’ Agent 14 (QA) + Agent 17 + Agent 15 + Agent 16 |
| **Code Changes** | âœ… HeaderLineRenderer Â· EditorGridRuntime Â· TotalsPanelRuntime Â· HeaderLineCanvas Â· ActionBarRuntime Â· AttachmentNotesRuntime |
| **Commit** | `feat: ui-studio Phase 6 â€” header-line transaction workspace, editor grid, totals panel, ViewCode propagation` |

> âš ï¸ **GENERIC ONLY â€” no hardcoded Sale Order, Purchase Order, or Service Job logic.**
> All configuration is metadata-driven via `HeaderLineConfig`. The Sale Order E2E test is the exit
> condition but it must pass through generic configuration, not special-cased code.

---

## New Files to Create

```
app/src/react/src/components/studio-v2/runtime/HeaderLineRenderer.tsx    NEW
app/src/react/src/components/studio-v2/runtime/EditorGridRuntime.tsx     NEW
app/src/react/src/components/studio-v2/runtime/TotalsPanelRuntime.tsx    NEW
app/src/react/src/components/studio-v2/runtime/ActionBarRuntime.tsx      NEW
app/src/react/src/components/studio-v2/runtime/AttachmentNotesRuntime.tsx NEW
app/src/react/src/components/studio-v2/HeaderLineCanvas.tsx              NEW (designer canvas zones)
```

---

## 6.1 TypeScript Types

```typescript
export interface HeaderLineConfig {
  header: {
    entity_type: string           // primary entity (generic â€” not hardcoded)
    sections:    SectionConfig[]
    action_bar:  ActionBarConfig
  }
  lines:             LineGridConfig[]       // one or more line grids
  totals_panel:      TotalsPanelConfig
  attachment_panel:  AttachmentConfig
  validation_summary: ValidationSummaryConfig
}

export interface LineGridConfig {
  grid_key:                string
  label:                   string
  line_entity_type:        string          // line entity (generic)
  columns:                 GridColumnConfig[]
  dynamic_charge_columns:  DynamicChargeColumnConfig[]
  allow_add_row:           boolean
  allow_delete_row:        boolean
  allow_inline_edit:       boolean
  row_event_definitions:   EventDefinition[]
  totals_contribution:     TotalsContributionConfig
}

export interface TotalsPanelConfig {
  rows: Array<{
    label:      string
    expression: string            // JSONata over lines[] and header.*
    bold:       boolean
    separator:  boolean
  }>
  position: 'bottom' | 'right_panel'
}

export interface DynamicChargeColumnConfig {
  charge_code:          string
  label:                string
  is_editable:          boolean
  calculation_service?: string    // endpoint to call for auto-calculation
}
```

---

## 6.2 Designer Canvas Zones â€” `HeaderLineCanvas.tsx`

```
header_line surface shows these fixed zones:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  HEADER ZONE                                    â”‚
â”‚  (form sections + field bindings to header      â”‚
â”‚   entity â€” e.g. Customer, Branch, Date)         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  LINE GRID ZONE 1                               â”‚
â”‚  [Configure columns] [+ Dynamic Charge Column]  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [+ Add Another Line Grid]                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  TOTALS PANEL                                   â”‚
â”‚  [+ Add Total Row]   Expression: JSONata        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  ATTACHMENTS / NOTES                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Right Inspector tabs when header_line surface selected:
- Header Fields: entity field picker for header form sections
- Line Grid: column picker, dynamic charge column config, row events config
- Totals: expression row builder (label + JSONata expression + bold/separator)
- Actions: save/submit/approve/reject/cancel button config
```

---

## 6.3 Runtime Behavior

```
On view load:
  1. Load header entity record by ID
  2. Load all line grid data (paginated for large sets)
  3. Render header form with field bindings
  4. Render each line grid with static + dynamic columns
  5. Render totals panel (computed from line data via JSONata)

On any header field change:
  â†’ Fire event engine for field-level events

On line cell change:
  â†’ Fire row event chain (recalculate_row_amount, etc.)
  â†’ Recompute totals panel

ViewCode propagated on ALL API calls from runtime:
  GET  /api/v1/entities/SaleOrder/123?viewCode=SO_VEHICLE_BOOKING
  POST /api/v1/entities/SaleOrder  body: { viewCode: 'SO_VEHICLE_BOOKING', ... }

Save:
  - Persist header entity record
  - Persist all line entity records in a single DB transaction
  - ViewCode included in POST body for backend RuleSet resolution

Submit:
  - UI Studio does NOT own the transition logic â€” just calls the API
```

---

## 6.4 ViewCode Propagation

```typescript
// All entity data API calls must include viewCode:
GET  /api/v1/entities/SaleOrder/123?viewCode=SO_VEHICLE_BOOKING
POST /api/v1/entities/SaleOrder    body: { viewCode: 'SO_VEHICLE_BOOKING', ... }
PUT  /api/v1/entities/SaleOrder/123 body: { viewCode: 'SO_VEHICLE_BOOKING', ... }

// ViewCode comes from ViewArtifactPayload.view_code â€” set at view design time.
```

---

## 6.5 Dynamic Tax / Charge Columns

```typescript
// LineGridRuntime.tsx â€” at render time:
// POST /api/v1/charges/applicable
// body: { view_code: viewCode, primary_entity: entityType, context: headerValues }
// response: [{ charge_code, label, is_editable }]
// Merge returned columns into fixed columns list â€” prevents hardcoding tax structures in UI

// Agree on API shape BEFORE parallel agent execution:
interface ChargeColumnResponse {
  charge_code: string
  label:       string
  is_editable: boolean
  sort_order:  number
}
```

---

## 6.6 Totals Panel Expressions

```
Designer config panel for TotalsPanel (JSONata â€” no eval(), no new Function()):

[+ Add Total Row]

| Label    | Expression                             | Bold | Separator |
|----------|----------------------------------------|------|-----------|
| Subtotal | $sum(lines.amount)                     | No   | No        |
| Tax      | $sum(lines.taxAmount)                  | No   | Yes       |
| Total    | header.totalAmount                     | Yes  | No        |
```

---

## Testing Phase 6

### Unit Tests â€” `HeaderLineConfig.test.ts`

```typescript
// 1. Totals panel expression evaluates correctly via JSONata
test('totals panel $sum(lines.amount) computes correct subtotal', () => {
  const lines = [{ amount: 100 }, { amount: 200 }, { amount: 50 }]
  const result = evaluateTotalsExpression('$sum(lines.amount)', { lines, header: {} })
  expect(result).toBe(350)
})

// 2. Dynamic charge column merged into fixed columns
test('dynamic charge columns merged at correct position', () => {
  const fixed = [{ key: 'item' }, { key: 'qty' }, { key: 'rate' }]
  const dynamic = [{ charge_code: 'GST', label: 'GST', is_editable: false, sort_order: 10 }]
  const merged = mergeColumns(fixed, dynamic)
  expect(merged.some(c => c.key === 'GST')).toBe(true)
})

// 3. Row event fires on cell change
test('qty cell change fires recalculate_row_amount event', () => {
  const engine = buildEventEngine(rowEvents)
  const effects = engine.fire('grid_cell_change', 'qty', { header: {}, lines: [{ qty: 3, rate: 100 }], context: {} as any })
  expect(effects.some(e => e.type === 'recalculate_row_amount')).toBe(true)
})

// 4. ViewCode present in all save requests
test('save request body includes view_code', async () => {
  let capturedBody: any = null
  server.use(rest.post('/api/v1/entities/SaleOrder', async (req, res, ctx) => {
    capturedBody = await req.json()
    return res(ctx.json({ id: '123' }))
  }))
  await saveHeaderLineRecord({ viewCode: 'SO_VEHICLE_BOOKING', header: {}, lines: [] })
  expect(capturedBody.viewCode).toBe('SO_VEHICLE_BOOKING')
})
```

### Integration Tests â€” `HeaderLineIntegration.integration.test.ts`

```typescript
// 1. Add row creates line entity record
test('add row creates new line entity record in DB', async () => {
  const before = await countLines(headerId)
  await addRowToGrid(headerId, { qty: 1, rate: 100 })
  const after = await countLines(headerId)
  expect(after).toBe(before + 1)
})

// 2. Delete row soft-deletes line entity record
test('delete row soft-deletes line record', async () => {
  const lineId = await addRowToGrid(headerId, { qty: 1, rate: 100 })
  await deleteRowFromGrid(lineId)
  const line = await getLine(lineId)
  expect(line.is_deleted).toBe(true)
})

// 3. Partial save failure rolls back all lines (transaction integrity)
test('partial save failure rolls back â€” no orphan line records', async () => {
  // mock header save to succeed, second line save to fail
  server.use(rest.post('/api/v1/entities/SaleOrderLine', (req, res, ctx, count) =>
    count === 1 ? res(ctx.status(500)) : res(ctx.json({}))
  ))
  const before = await countLines(headerId)
  try { await saveAll(headerId, threeLines) } catch {}
  const after = await countLines(headerId)
  expect(after).toBe(before) // no orphans
})

// 4. Dynamic charge columns loaded from charges API
test('dynamic charge columns fetched and merged at render', async () => {
  server.use(rest.post('/api/v1/charges/applicable', (req, res, ctx) =>
    res(ctx.json([{ charge_code: 'GST', label: 'GST 18%', is_editable: false, sort_order: 10 }]))
  ))
  render(<EditorGridRuntime config={lineGridConfig} viewCode="SO_TEST" header={mockHeader} />)
  await expect(screen.findByText('GST 18%')).resolves.toBeInTheDocument()
})
```

### E2E Exit Condition â€” `SaleOrderE2E.e2e.ts` (Playwright)

> This is the **M7 exit condition test** â€” must pass for the gate to open.

```typescript
test('Sale Order E2E â€” header-line workspace complete flow', async ({ page }) => {
  // 1. Create header_line view via designer
  // (assumes view 'sale_order_view' already configured and published)

  // 2. Navigate to new sale order
  await page.goto('http://localhost:5173/sale-orders/new?viewCode=SO_VEHICLE_BOOKING')

  // 3. Fill header fields
  await page.selectOption('[data-field="customerId"]', '{ label: "CUST-001" }')
  await page.selectOption('[data-field="branchId"]', '{ label: "Branch A" }')
  await page.fill('[data-field="orderDate"]', '2026-05-27')

  // 4. Add line items
  await page.click('[data-action="add-row"]')
  await page.fill('[data-row="0"][data-col="itemCode"]', 'ITEM-001')
  await page.fill('[data-row="0"][data-col="qty"]',     '3')
  await page.fill('[data-row="0"][data-col="rate"]',    '1000')

  // 5. qty change â†’ amount recalculates
  await expect(page.locator('[data-row="0"][data-col="amount"]')).toHaveText('3000')

  // 6. Add second line
  await page.click('[data-action="add-row"]')
  await page.fill('[data-row="1"][data-col="itemCode"]', 'ITEM-002')
  await page.fill('[data-row="1"][data-col="qty"]',      '2')
  await page.fill('[data-row="1"][data-col="rate"]',     '500')

  // 7. Totals panel reflects correct values
  await expect(page.locator('[data-total="subtotal"]')).toHaveText('4000')

  // 8. Save
  await page.click('[data-action="save-draft"]')
  await expect(page.locator('[data-toast]')).toContainText('Saved')

  // 9. Submit
  await page.click('[data-action="submit"]')
})

// Validation: cannot save with 0 line items
test('save with 0 lines shows validation error', async ({ page }) => {
  await page.goto('http://localhost:5173/sale-orders/new?viewCode=SO_VEHICLE_BOOKING')
  await page.click('[data-action="save-draft"]')
  await expect(page.locator('[data-error]')).toContainText('at least one line')
})

// Transaction integrity
test('partial save failure shows error and leaves no orphan records', async ({ page }) => {
  // requires backend to simulate line-2 save failure
  // verify: no new records in DB after failure
})
```

---

## Agents â€” Phase 6

> âš ï¸ **Agree on charge column API shape (section 6.5) BEFORE parallel execution.**

> ðŸ”€ **PARALLEL** â€” Agents 4, 11, and 8 run simultaneously after API shape agreed.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 11: Transaction Workspace](../reference/agent-specifications.md#agent-11-transaction-workspace-agent)** | HeaderLineRenderer, EditorGridRuntime, TotalsPanelRuntime, ActionBarRuntime, AttachmentNotesRuntime, HeaderLineCanvas | All new runtime + canvas files |
| B | **[Agent 4: Backend API](../reference/agent-specifications.md#agent-4-backend-api-agent)** | Line entity CRUD routes, dynamic charge column endpoint, ViewCode propagation middleware | `go/internal/` line entity routes |
| C | **[Agent 8: Data Binding](../reference/agent-specifications.md#agent-8-data-binding-and-data-source-agent)** | Dynamic column injection at runtime, line-level binding resolver | `LineGridRuntime.tsx`, `BindingResolver.ts` |

After all complete:

| Agent | Task |
|---|---|
| **Agent 14: QA** | Run all unit, integration, and Sale Order E2E tests above |
| **Agent 17: API Contract Alignment** | `HeaderLineConfig`, `LineGridConfig` TypeScript types match Go structs |
| **Agent 15: Documentation** | M7 milestone summary + header-line workspace config guide |
| **Agent 16: Phase Coordinator** | Sale Order E2E passes, ViewCode propagates, totals compute â€” **gate M8** |

---

## âœ… Gate Condition â€” M7

```
Sale Order E2E test (SaleOrderE2E.e2e.ts) must pass:
  - Header fields fill correctly
  - Add 3 line items
  - qty change â†’ amount recalculates
  - Totals panel reflects correct subtotal
  - Save â†’ header + lines persisted in DB with ViewCode

Transaction integrity:
  - Save with 0 lines â†’ validation error shown
  - Partial save failure â†’ no orphan line records (DB transaction rolled back)
```

> **Previous phase:** [Phase 5](P5-event-engine.md)
