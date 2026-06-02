# Phase 7 — Workflow & Rule UX Integration

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M8 |
| **Gate Condition** | Published views show workflow state and rule feedback driven by backend engine outputs |
| **Depends On** | [Phase 6](P6-header-line-workspace.md) — runtime renderer operational; workflow + rule engines already exist |
| **Agents** | Agent 10 ‖ Agent 4 (parallel) → Agent 14 (QA) → Agent 17 + Agent 15 + Agent 16 |
| **Code Changes** | ✅ WorkflowStatusStripRuntime · WorkflowTimelineRuntime · ApprovalPanelRuntime · ValidationSummaryRuntime |
| **Commit** | `feat: ui-studio Phase 7 — workflow status strip, approval panel, rule validation display, timeline` |

> ⚠️ **BOUNDARY:** UI Studio DISPLAYS workflow state. It does NOT own transitions or rule logic.
> Workflow action buttons call the workflow transition API. Rule errors come from the rule engine API.
> UI Studio never duplicates that logic.

---

## New Files to Create

```
app/src/react/src/components/studio-v2/runtime/WorkflowStatusStripRuntime.tsx  NEW
app/src/react/src/components/studio-v2/runtime/WorkflowTimelineRuntime.tsx     NEW
app/src/react/src/components/studio-v2/runtime/ApprovalPanelRuntime.tsx        NEW
app/src/react/src/components/studio-v2/runtime/ValidationSummaryRuntime.tsx    NEW
```

---

## 7.1 WorkflowStatusStrip Runtime

**API call:** `GET /api/v1/workflow/:entityType/:recordId/state`

**Expected response shape:**
```json
{
  "current_state":    "PENDING_APPROVAL",
  "state_label":      "Pending Approval",
  "allowed_actions":  [{ "action_key": "approve", "label": "Approve", "requires_comment": true  }],
  "disabled_actions": [{ "action_key": "submit",  "label": "Submit",  "reason": "Already submitted" }],
  "approval_log":     [{ "action": "submitted", "by": "salesperson", "at": "...", "comment": "" }],
  "timeline":         [{ "state": "DRAFT", "entered_at": "...", "duration_minutes": 5 }]
}
```

**Renders:**
- Step indicator: all workflow states as breadcrumb strip, current step highlighted
- Allowed action buttons (driven by `allowed_actions` — not hardcoded)
- Disabled actions shown greyed with tooltip showing `reason`
- Time elapsed in current step

---

## 7.2 Approval Panel

Shown when `allowed_actions` contains action with `requires_comment: true`:

- List of previous decisions with comment + approver + timestamp
- Textarea for comment (required when `requires_comment: true`)
- Approve / Reject buttons
- **API call:** `POST /api/v1/workflow/:entityType/:recordId/transition`
  Body: `{ action_key: 'approve', comment: '...' }`
- On success: WorkflowStatusStrip refreshes, new state reflects

---

## 7.3 Rule Validation Display

**API call:** `POST /api/v1/rules/:entityType/evaluate`
Body: `{ record: {...}, view_code: 'SO_VEHICLE_BOOKING' }`

**Expected response:**
```json
{
  "errors":   [{ "field_key": "qty",      "message": "Quantity must be > 0",              "rule_code": "qty_positive" }],
  "warnings": [{ "field_key": "discount", "message": "Discount > 20% requires approval",  "rule_code": "discount_approval" }]
}
```

**UI rendering rules:**
- Field error → red border + error message below field
- Field warning → yellow border + warning message below field
- `ValidationSummary` component → collapsible list of all errors and warnings
- Block save/submit if `errors.length > 0`
- Fire on: field change (debounced 500ms) + before save/submit click

---

## Testing Phase 7

### Unit Tests — `WorkflowStatusStrip.test.tsx`

```typescript
// 1. Correct state badge rendered
test('renders PENDING_APPROVAL state badge', async () => {
  server.use(rest.get('/api/v1/workflow/SaleOrder/123/state', (req, res, ctx) =>
    res(ctx.json({ current_state: 'PENDING_APPROVAL', state_label: 'Pending Approval', allowed_actions: [], disabled_actions: [] }))
  ))
  render(<WorkflowStatusStripRuntime entityType="SaleOrder" recordId="123" />)
  await expect(screen.findByText('Pending Approval')).resolves.toBeInTheDocument()
})

// 2. Allowed actions render as active buttons
test('allowed action buttons are enabled', async () => {
  server.use(rest.get('/api/v1/workflow/SaleOrder/123/state', (req, res, ctx) =>
    res(ctx.json({ current_state: 'PENDING_APPROVAL', state_label: 'Pending Approval',
      allowed_actions: [{ action_key: 'approve', label: 'Approve', requires_comment: false }],
      disabled_actions: [] }))
  ))
  render(<WorkflowStatusStripRuntime entityType="SaleOrder" recordId="123" />)
  const btn = await screen.findByRole('button', { name: /approve/i })
  expect(btn).not.toBeDisabled()
})

// 3. Disabled actions render greyed with tooltip
test('disabled action shows tooltip with reason', async () => {
  server.use(rest.get('/api/v1/workflow/SaleOrder/123/state', (req, res, ctx) =>
    res(ctx.json({ current_state: 'PENDING_APPROVAL', state_label: 'Pending Approval',
      allowed_actions: [],
      disabled_actions: [{ action_key: 'submit', label: 'Submit', reason: 'Already submitted' }] }))
  ))
  render(<WorkflowStatusStripRuntime entityType="SaleOrder" recordId="123" />)
  const btn = await screen.findByRole('button', { name: /submit/i })
  expect(btn).toBeDisabled()
  await userEvent.hover(btn)
  await expect(screen.findByText('Already submitted')).resolves.toBeInTheDocument()
})

// 4. Timeline shows state history
test('workflow timeline renders state history entries', async () => {
  server.use(rest.get('/api/v1/workflow/SaleOrder/123/state', (req, res, ctx) =>
    res(ctx.json({ ...baseState, timeline: [
      { state: 'DRAFT', entered_at: '2026-05-27T09:00:00Z', duration_minutes: 5 },
      { state: 'PENDING_APPROVAL', entered_at: '2026-05-27T09:05:00Z', duration_minutes: null }
    ]}))
  ))
  render(<WorkflowTimelineRuntime entityType="SaleOrder" recordId="123" />)
  await expect(screen.findByText('DRAFT')).resolves.toBeInTheDocument()
  await expect(screen.findByText('PENDING_APPROVAL')).resolves.toBeInTheDocument()
})
```

### Unit Tests — `ApprovalPanel.test.tsx`

```typescript
// 1. Approve fires POST to workflow transition API
test('approve button fires POST /workflow/transition with correct body', async () => {
  let capturedBody: any = null
  server.use(rest.post('/api/v1/workflow/SaleOrder/123/transition', async (req, res, ctx) => {
    capturedBody = await req.json()
    return res(ctx.json({ new_state: 'APPROVED' }))
  }))
  render(<ApprovalPanelRuntime entityType="SaleOrder" recordId="123" action={{ action_key: 'approve', requires_comment: false }} />)
  await userEvent.click(screen.getByRole('button', { name: /approve/i }))
  expect(capturedBody.action_key).toBe('approve')
})

// 2. Reject requires comment
test('reject requires comment before button enables', async () => {
  render(<ApprovalPanelRuntime entityType="SaleOrder" recordId="123" action={{ action_key: 'reject', requires_comment: true }} />)
  const rejectBtn = screen.getByRole('button', { name: /reject/i })
  expect(rejectBtn).toBeDisabled()
  await userEvent.type(screen.getByRole('textbox'), 'Not approved due to incorrect pricing')
  expect(rejectBtn).not.toBeDisabled()
})

// 3. After approve — status strip refreshes with new state
test('state badge updates after approve action', async () => {
  // mock transition returns new state, mock state endpoint returns APPROVED after transition
  render(<WorkflowStatusStripRuntime entityType="SaleOrder" recordId="123" />)
  await userEvent.click(await screen.findByRole('button', { name: /approve/i }))
  await expect(screen.findByText('Approved')).resolves.toBeInTheDocument()
})
```

### Unit Tests — `ValidationSummary.test.tsx`

```typescript
// 1. Field with error shows red border + message
test('field with rule error shows red border and error message', async () => {
  server.use(rest.post('/api/v1/rules/SaleOrder/evaluate', (req, res, ctx) =>
    res(ctx.json({ errors: [{ field_key: 'qty', message: 'Quantity must be > 0', rule_code: 'qty_positive' }], warnings: [] }))
  ))
  render(<StudioRenderer viewKey="test_view" />)
  // trigger validation
  const qtyField = screen.getByTestId('field-qty')
  expect(qtyField).toHaveClass('border-red-500')
  await expect(screen.findByText('Quantity must be > 0')).resolves.toBeInTheDocument()
})

// 2. Field with warning shows yellow border
test('field with rule warning shows yellow border', async () => {
  server.use(rest.post('/api/v1/rules/SaleOrder/evaluate', (req, res, ctx) =>
    res(ctx.json({ errors: [], warnings: [{ field_key: 'discount', message: 'Discount > 20% requires approval', rule_code: 'discount_approval' }] }))
  ))
  render(<StudioRenderer viewKey="test_view" />)
  const discountField = screen.getByTestId('field-discount')
  expect(discountField).toHaveClass('border-yellow-500')
})

// 3. ValidationSummary lists all active errors and warnings
test('ValidationSummary collapsible list shows all errors and warnings', async () => {
  render(<ValidationSummaryRuntime errors={[mockError]} warnings={[mockWarning]} />)
  await userEvent.click(screen.getByText('Validation Summary (1 error, 1 warning)'))
  await expect(screen.findByText('Quantity must be > 0')).resolves.toBeInTheDocument()
  await expect(screen.findByText('Discount > 20% requires approval')).resolves.toBeInTheDocument()
})

// 4. Fixing error removes it from ValidationSummary
test('fixing an error field removes it from ValidationSummary', async () => {
  render(<StudioRenderer viewKey="test_view" />)
  // initially has error
  await expect(screen.findByText('Quantity must be > 0')).resolves.toBeInTheDocument()
  // fix the field
  await userEvent.type(screen.getByTestId('field-qty'), '5')
  // re-evaluation fires (debounced) — error gone
  await waitForElementToBeRemoved(() => screen.queryByText('Quantity must be > 0'))
})

// 5. Cannot submit with active errors
test('save/submit disabled when errors.length > 0', async () => {
  render(<StudioRenderer viewKey="test_view" />)
  // trigger validation that returns errors
  const submitBtn = screen.getByRole('button', { name: /submit/i })
  expect(submitBtn).toBeDisabled()
})
```

### E2E Tests — `WorkflowRuleIntegration.e2e.ts` (Playwright)

```typescript
// E2E 1: Workflow state badge correct for PENDING_APPROVAL record
test('record in PENDING_APPROVAL shows correct state badge', async ({ page }) => {
  await page.goto('http://localhost:5173/sale-orders/456')
  await expect(page.locator('[data-workflow-state]')).toContainText('Pending Approval')
})

// E2E 2: Approve action fires and state updates
test('approve fires transition, badge updates to Approved', async ({ page }) => {
  await page.goto('http://localhost:5173/sale-orders/456')
  await page.click('[data-action="approve"]')
  await expect(page.locator('[data-workflow-state]')).toContainText('Approved', { timeout: 5000 })
})

// E2E 3: Rule error shows field-level feedback
test('rule validation shows error below qty field', async ({ page }) => {
  await page.goto('http://localhost:5173/sale-orders/new?viewCode=SO_VEHICLE_BOOKING')
  await page.fill('[data-field="qty"]', '0')
  await page.blur('[data-field="qty"]')
  await expect(page.locator('[data-field-error="qty"]')).toBeVisible()
  await expect(page.locator('[data-field-error="qty"]')).toContainText('Quantity must be > 0')
})
```

---

## Agents — Phase 7

> 🔀 **PARALLEL** — Agent 10 (UX components) and Agent 4 (backend routes) run simultaneously.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 10: Workflow and Rule Integration](../reference/agent-specifications.md#agent-10-workflow-and-rule-integration-agent)** | WorkflowStatusStrip, WorkflowTimeline, ApprovalPanel, ValidationSummary, status-aware component disabling | All new runtime components |
| B | **[Agent 4: Backend API](../reference/agent-specifications.md#agent-4-backend-api-agent)** | Workflow state endpoint integration, rule evaluation proxy route, approval transition route | `go/internal/` workflow + rule integration |

After A and B complete:

> ➡️ **SEQUENTIAL** — Agent 14 runs tests after both A and B are committed.

| Agent | Task |
|---|---|
| **Agent 14: QA** | Run all unit and E2E tests above |
| **Agent 17: API Contract Alignment** | Workflow state response TypeScript type matches Go engine response |
| **Agent 15: Documentation** | M8 milestone summary + workflow UX integration guide |
| **Agent 16: Phase Coordinator** | Status strip correct, approval fires transition, rule errors display field-level — **gate M9** |

---

## ✅ Gate Condition — M8

```
1. WorkflowStatusStrip:
   Navigate to record in PENDING_APPROVAL state
   Expected: "Pending Approval" badge visible, Approve button enabled, Submit greyed with tooltip

2. Approval:
   Click Approve → POST /workflow/transition fires
   Expected: state badge updates to next state without page reload

3. Rule validation:
   Navigate to form, set qty=0, blur field
   Expected: red border on qty, error message "Quantity must be > 0"
   Set qty=5 → error removed

4. Block submit:
   With active errors → Submit button disabled
   Fix all errors → Submit button enabled
```

> **Previous phase:** [Phase 6](P6-header-line-workspace.md)
> **Next phase:** [Phase 8 — Publish Lifecycle & Governance](P8-publish-governance.md)
