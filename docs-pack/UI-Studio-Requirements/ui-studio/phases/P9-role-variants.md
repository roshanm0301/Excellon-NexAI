# Phase 9 â€” Role Variants, Permissions & Enterprise Depth

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M10 |
| **Gate Condition** | All P1 features operational â€” role variants, full DOM-removal permissions, cascading lookups |
| **Depends On** | [Phase 4](P4-runtime-renderer.md) `PermissionFilter` (basic) Â· [Phase 8](P8-publish-governance.md) published lifecycle stable |
| **Agents** | Agent 12 â€– Agent 8 â€– Agent 5 (parallel) â†’ Agent 4 â†’ Agent 14 (QA) + Agent 17 + Agent 15 + Agent 16 |
| **Code Changes** | âœ… VariantPanel Â· RelationshipPanelRuntime Â· ModalDrawerRuntime Â· variantResolver Â· full PermissionFilter |
| **Commit** | `feat: ui-studio Phase 9 â€” role variants, full permission-aware rendering (DOM removal), cascading lookups, all P1 features` |

---

## New Files to Create

```
app/src/react/src/components/studio-v2/VariantPanel.tsx                    NEW
app/src/react/src/components/studio-v2/runtime/RelationshipPanelRuntime.tsx NEW
app/src/react/src/components/studio-v2/runtime/ModalDrawerRuntime.tsx       NEW
app/src/react/src/lib/studio-v2/variantResolver.ts                          NEW
```

---

## 9.1 Role / Context Variants (overlay â€” not clone)

```typescript
// At runtime â€” variant resolution order:
// 1. Load published base version payload
// 2. GET /api/v1/studio/views/:viewKey/variants?role=Clerk&context={...}
// 3. Apply matching variant overrides as delta onto base payload
// 4. Multiple matching variants: highest priority (lowest number) wins per field

// Variant condition examples:
// { type: 'role',           operator: 'equals',  value: 'Clerk' }
// { type: 'record_field',   operator: 'in',      value: ['DomesticSale','Export'] }

// Overrides structure (delta only â€” not full payload):
// { field_overrides: { discount: { readonly: true } },
//   action_overrides: { delete: { visible: false } },
//   section_overrides: { internal_section: { visible: false } } }
```

---

## 9.2 Full Permission-Aware Rendering

```typescript
// Runtime calls:
// POST /api/v1/permission/evaluate-view
// Body: { view_key, entity_type, record_id, user_id, role }
// Response: { visible_fields, editable_fields, masked_fields, allowed_actions, disabled_reasons }

// PermissionFilter applies BEFORE rendering:
// - NOT in visible_fields  â†’ component ABSENT from DOM (NOT CSS display:none)
// - NOT in editable_fields â†’ component rendered as disabled
// - IN masked_fields       â†’ value shown as ***
// - NOT in allowed_actions â†’ action button not rendered at all
```

> âš ï¸ **CRITICAL (Agent 12):** Hidden fields must be ABSENT from the DOM.
> CSS `display:none` or `visibility:hidden` is NOT acceptable.
> Agent 14 security test: `document.querySelector('[data-field="salary"]') === null`

---

## 9.3 P1 Features Delivered in Phase 9

| Feature | Implementation |
|---|---|
| P1-24 Relationship Panel | `RelationshipPanelRuntime` â€” related records list below main form |
| P1-29 Bulk Actions | Checkbox column in `list_grid` + bulk action bar when rows selected |
| P1-30 Saved View Config | User filter presets stored per view per user in `user_preferences` table |
| P1-31 Advanced Filter Builder | `ConditionTreeBuilder` in filter mode on `list_grid` |
| P1-32 Role/Persona Variants | `VariantPanel` in designer + `variantResolver` at runtime |
| P1-33 Permission-Aware Rendering | Full `PermissionFilter` (DOM removal) â€” upgrade from Phase 4 stub |
| P1-34 Cascading Lookup Config | Parent field selector in Inspector Binding tab |
| P1-35 Modal/Drawer/Side Panel | `ModalDrawerRuntime` triggered by action button |
| P1-36 Record Summary/Highlights | `RecordHighlights` shows computed KPI values |

---

## Testing Phase 9

### Security / DOM Removal Tests â€” `Permissions.test.ts`

```typescript
// 1. Hidden field is ABSENT from DOM
test('field not in visible_fields is absent from DOM', async () => {
  server.use(rest.post('/api/v1/permission/evaluate-view', (req, res, ctx) =>
    res(ctx.json({
      visible_fields:  ['name', 'email'],   // salary NOT included
      editable_fields: ['name', 'email'],
      masked_fields:   [],
      allowed_actions: ['save']
    }))
  ))
  render(<StudioRenderer viewKey="test_view" />)
  await waitFor(() => {
    expect(document.querySelector('[data-field="salary"]')).toBeNull()
  })
  // Extra check: not just hidden via CSS
  const allElements = document.querySelectorAll('[data-field]')
  const codes = Array.from(allElements).map(el => el.getAttribute('data-field'))
  expect(codes).not.toContain('salary')
})

// 2. Masked field shows ***
test('field in masked_fields renders value as ***', async () => {
  server.use(rest.post('/api/v1/permission/evaluate-view', (req, res, ctx) =>
    res(ctx.json({ visible_fields: ['salary'], editable_fields: [], masked_fields: ['salary'], allowed_actions: [] }))
  ))
  render(<StudioRenderer viewKey="test_view" recordId="123" />)
  await expect(screen.findByTestId('field-salary')).resolves.toHaveTextContent('***')
})

// 3. Action not in allowed_actions absent from DOM
test('action button not in allowed_actions is absent', async () => {
  server.use(rest.post('/api/v1/permission/evaluate-view', (req, res, ctx) =>
    res(ctx.json({ visible_fields: ['name'], editable_fields: ['name'], masked_fields: [], allowed_actions: ['save'] }))
  ))
  render(<StudioRenderer viewKey="test_view" />)
  await waitFor(() => {
    expect(document.querySelector('[data-action="delete"]')).toBeNull()
  })
})

// 4. Tenant isolation â€” tenant B cannot see tenant A data
test('permission API called with correct tenant context', async () => {
  let capturedBody: any = null
  server.use(rest.post('/api/v1/permission/evaluate-view', async (req, res, ctx) => {
    capturedBody = await req.json()
    return res(ctx.json({ visible_fields: [], editable_fields: [], masked_fields: [], allowed_actions: [] }))
  }))
  render(<StudioRenderer viewKey="test_view" />, { user: { tenantId: 'TENANT-B' } })
  await waitFor(() => expect(capturedBody).not.toBeNull())
  expect(capturedBody.tenant_id).toBe('TENANT-B')
})
```

### Variant Tests â€” `Variants.test.ts`

```typescript
// 1. Salesperson variant: discount field read-only
test('Salesperson variant makes discount field read-only', async () => {
  server.use(rest.get('/api/v1/studio/views/test_view/variants', (req, res, ctx) =>
    res(ctx.json([{
      variant_name: 'Salesperson',
      conditions: [{ type: 'role', operator: 'equals', value: 'Salesperson' }],
      overrides: { field_overrides: { discount: { readonly: true } } },
      priority: 100
    }]))
  ))
  render(<StudioRenderer viewKey="test_view" />, { user: { role: 'Salesperson' } })
  await expect(screen.findByTestId('field-discount')).resolves.toBeDisabled()
})

// 2. After-approval variant: all fields disabled
  server.use(rest.get('/api/v1/studio/views/test_view/variants', (req, res, ctx) =>
    res(ctx.json([{
      variant_name: 'Post-Approval',
      overrides: { section_overrides: { main_form: { readonly: true } } },
      priority: 50
    }]))
  ))
  const inputs = screen.getAllByRole('textbox')
  inputs.forEach(input => expect(input).toBeDisabled())
})

// 3. Two matching variants â€” higher priority (lower number) wins
test('variant with priority=50 overrides variant with priority=100', async () => {
  server.use(rest.get('/api/v1/studio/views/test_view/variants', (req, res, ctx) =>
    res(ctx.json([
      { variant_name: 'A', conditions: [{ type: 'role', operator: 'equals', value: 'Clerk' }],
        overrides: { field_overrides: { notes: { visible: false } } }, priority: 100 },
      { variant_name: 'B', conditions: [{ type: 'role', operator: 'equals', value: 'Clerk' }],
        overrides: { field_overrides: { notes: { visible: true } } },  priority: 50 },
    ]))
  ))
  render(<StudioRenderer viewKey="test_view" />, { user: { role: 'Clerk' } })
  // priority 50 wins â€” notes visible=true
  await expect(screen.findByTestId('field-notes')).resolves.toBeInTheDocument()
})

// 4. No matching variant â€” base payload used unchanged
test('no matching variant â€” base payload rendered unchanged', async () => {
  server.use(rest.get('/api/v1/studio/views/test_view/variants', (req, res, ctx) =>
    res(ctx.json([])) // no variants
  ))
  render(<StudioRenderer viewKey="test_view" />, { user: { role: 'Admin' } })
  // All base fields visible
  await expect(screen.findByTestId('field-discount')).resolves.toBeInTheDocument()
  await expect(screen.findByTestId('field-salary')).resolves.toBeInTheDocument()
})
```

### Cascading Lookup Tests â€” `CascadingLookup.test.ts`

```typescript
// 1. warehouseId lookup filters by current branchId
test('warehouseId options filtered by branchId=BR001', async () => {
  let capturedParams: URLSearchParams | null = null
  server.use(rest.get('/api/v1/entities/Warehouse', (req, res, ctx) => {
    capturedParams = req.url.searchParams
    return res(ctx.json([{ id: 'WH-001', branch_id: 'BR001' }]))
  }))
  render(<StudioRenderer viewKey="test_view" />)
  // Set branchId value
  fireEvent.change(screen.getByTestId('field-branchId'), { target: { value: 'BR001' } })
  await waitFor(() => expect(capturedParams?.get('branch_id')).toBe('BR001'))
})

// 2. Changing branchId resets warehouseId value
test('changing branchId clears warehouseId value', async () => {
  render(<StudioRenderer viewKey="test_view" />)
  fireEvent.change(screen.getByTestId('field-branchId'), { target: { value: 'BR002' } })
  await waitFor(() => {
    expect((screen.getByTestId('field-warehouseId') as HTMLInputElement).value).toBe('')
  })
})
```

### Bulk Action Tests â€” `BulkActions.test.ts`

```typescript
// 1. Select rows â†’ bulk action bar appears
test('selecting 3 rows shows bulk action bar', async () => {
  render(<ListGridRuntime config={listConfig} />)
  // check 3 rows
  await userEvent.click(screen.getAllByRole('checkbox')[0])
  await userEvent.click(screen.getAllByRole('checkbox')[1])
  await userEvent.click(screen.getAllByRole('checkbox')[2])
  await expect(screen.findByTestId('bulk-action-bar')).resolves.toBeVisible()
  await expect(screen.findByText('3 selected')).resolves.toBeInTheDocument()
})

// 2. Bulk action fires confirmation modal
test('bulk delete shows confirmation modal', async () => {
  render(<ListGridRuntime config={listConfig} />)
  await userEvent.click(screen.getAllByRole('checkbox')[0])
  await userEvent.click(screen.getByRole('button', { name: /bulk delete/i }))
  await expect(screen.findByRole('dialog')).resolves.toBeInTheDocument()
})

// 3. Confirm bulk action fires for all selected records
test('confirm bulk action fires for all selected records', async () => {
  const calls: string[] = []
  server.use(rest.post('/api/v1/bulk-action', async (req, res, ctx) => {
    const body = await req.json()
    calls.push(...body.record_ids)
    return res(ctx.json({ success: true }))
  }))
  render(<ListGridRuntime config={listConfig} />)
  await userEvent.click(screen.getAllByRole('checkbox')[0])
  await userEvent.click(screen.getAllByRole('checkbox')[1])
  await userEvent.click(screen.getByRole('button', { name: /bulk delete/i }))
  await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
  expect(calls).toHaveLength(2)
})
```

### E2E Tests â€” `RoleVariants.e2e.ts` (Playwright)

```typescript
// E2E 1: Clerk cannot see salary field
test('Clerk user cannot see salary field in DOM', async ({ page, context }) => {
  await context.addCookies([{ name: 'role', value: 'Clerk', domain: 'localhost' }])
  await page.goto('http://localhost:5173/employees/123')
  await expect(page.locator('[data-field="salary"]')).toHaveCount(0)
})

// E2E 2: Admin sees all fields
test('Admin user sees all fields including salary', async ({ page, context }) => {
  await context.addCookies([{ name: 'role', value: 'Admin', domain: 'localhost' }])
  await page.goto('http://localhost:5173/employees/123')
  await expect(page.locator('[data-field="salary"]')).toBeVisible()
})

// E2E 3: Relationship panel shows related records
test('relationship panel shows related purchase orders', async ({ page }) => {
  await page.goto('http://localhost:5173/customers/123')
  await expect(page.locator('[data-panel="related-purchase-orders"]')).toBeVisible()
  await expect(page.locator('[data-panel="related-purchase-orders"] tbody tr')).not.toHaveCount(0)
})
```

---

## Agents â€” Phase 9

> ðŸ”€ **PARALLEL** â€” Agents 12, 8, and 5 run simultaneously.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 12: Security and Permission](../reference/agent-specifications.md#agent-12-security-and-permission-agent)** | Full DOM-removal PermissionFilter, role variant overlay, VariantPanel | `PermissionFilter.ts`, `variantResolver.ts`, `VariantPanel.tsx` |
| B | **[Agent 8: Data Binding](../reference/agent-specifications.md#agent-8-data-binding-and-data-source-agent)** | Cascading lookup runtime, advanced filter builder | `BindingResolver.ts` (cascading section) |
| C | **[Agent 5: Frontend Designer](../reference/agent-specifications.md#agent-5-frontend-designer-agent)** | Bulk action config, saved filter config, modal/drawer builder | Designer config panels |

After A, B, C complete:

> âž¡ï¸ **SEQUENTIAL** â€” Agent 4 after all frontend done.

| Agent | Task |
|---|---|
| **Agent 4: Backend API** | Variant storage/resolution API, bulk action routes |
| **Agent 14: QA** | Run all security, variant, cascading, bulk action, and E2E tests above |
| **Agent 17: API Contract Alignment** | `ViewVariant`, `PermissionEvaluateResponse` types match Go structs |
| **Agent 15: Documentation** | M10 milestone summary + role variants guide + permission rendering reference |
| **Agent 16: Phase Coordinator** | Hidden fields absent from DOM, variants overlay correctly, all P1 operational â€” **gate M11** |

---

## âœ… Gate Condition â€” M10

```
Security (automated â€” must be exact):
  document.querySelector('[data-field="salary"]') === null
  for a Clerk-role user navigating to /employees/123

Variant overlay:
  Salesperson variant â†’ discount field rendered as disabled (not absent)

Cascading lookup:
  branchId change â†’ warehouseId options re-query with branch_id filter
  branchId change â†’ warehouseId value cleared

All P1 features:
  [ ] P1-24 Relationship Panel visible on record page
  [ ] P1-29 Bulk action bar appears on row selection
  [ ] P1-32 Variant Panel visible in designer
  [ ] P1-33 DOM removal confirmed by querySelector test
  [ ] P1-34 Cascading lookup re-queries on parent change
  [ ] P1-35 Modal/Drawer opens on action button click
```

> **Previous phase:** [Phase 8](P8-publish-governance.md)
> **Next phase:** [Phase 10 â€” AI Generation & Templates](P10-ai-templates.md)
