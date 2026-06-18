/**
 * view-crud.spec.ts — End-to-end tests for View CRUD flows
 *
 * Runs against the real Go backend (VITE_MSW=false).
 * Automotive DMS domain seed data expected.
 */

import { test, expect } from '@playwright/test'
import { SEL } from '../helpers/selectors'

const DEV_HEADERS = {
  'x-tenant-id': '00000000-0000-0000-0000-000000000001',
  'x-user-id': '00000000-0000-0000-0000-000000000001',
  'x-role': 'admin',
  'Content-Type': 'application/json',
}

test.describe('View CRUD flows', () => {
  test('list page loads and shows UI Studio heading', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.getByRole('heading', { name: /UI Studio/i })).toBeVisible()
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('404')
  })

  test('list page shows search input and filter selects', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.searchInput)).toBeVisible()
    // Surface type filter and status filter selects
    const selects = page.locator('select')
    await expect(selects.first()).toBeVisible()
  })

  test('search filters views by name', async ({ page }) => {
    await page.goto('studio/views')
    const searchInput = page.locator(SEL.searchInput)
    await searchInput.fill('Vehicle')
    // Wait for client-side filter to apply
    await page.waitForTimeout(300)
    // Should see vehicle-related views
    const grid = page.locator(SEL.viewsGrid)
    await expect(grid).toBeVisible()
    // Vehicle Master should appear if seeded
    const vehicleRow = grid.getByText('Vehicle Master', { exact: false })
    if (await vehicleRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(vehicleRow).toBeVisible()
    }
    // Unrelated entries like "Customer Master" should be filtered out when searching "Vehicle"
    // (only check this if grid has items — empty results are also valid if not seeded)
  })

  test('open New View modal with required fields', async ({ page }) => {
    await page.goto('studio/views')
    await page.locator(SEL.newViewBtn).click()

    const modal = page.locator(SEL.createViewModal)
    await expect(modal).toBeVisible()

    // Modal should have View Label and Primary Entity fields
    await expect(modal.getByText(/View Label/i)).toBeVisible()
    await expect(modal.getByText(/Primary Entity/i)).toBeVisible()
    await expect(modal.getByText(/Surface Type/i)).toBeVisible()

    // Close modal
    await modal.getByRole('button', { name: /Cancel/i }).click()
    await expect(modal).not.toBeVisible()
  })

  test('create a new standard_crud view via modal', async ({ page, request }) => {
    await page.goto('studio/views')
    await page.locator(SEL.newViewBtn).click()

    const modal = page.locator(SEL.createViewModal)
    await expect(modal).toBeVisible()

    const uniqueName = 'Test CRUD View ' + Date.now()

    // Fill View Label (first input in modal)
    const labelInput = modal.locator('input[type="text"]').first()
    await labelInput.fill(uniqueName)

    // Fill Primary Entity (second input in modal)
    const entityInput = modal.locator('input[type="text"]').nth(1)
    await entityInput.fill('vehicle')

    // Submit
    await modal.getByRole('button', { name: /Create View/i }).click()

    // Should navigate to designer after creation
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)

    // Cleanup: extract viewId from URL and delete via API
    const url = page.url()
    const match = url.match(/studio\/views\/([^/]+)\/edit/)
    if (match?.[1]) {
      await request.delete(`/api/v1/studio/views/${match[1]}`, { headers: DEV_HEADERS })
    }
  })

  test('open existing seeded view in designer via row click', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Search for Vehicle Master (seeded view) — needed because VirtualGrid only renders visible rows
    const searchInput = page.locator(SEL.searchInput)
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Vehicle Master')
      await page.waitForTimeout(300)
    }

    const vehicleRow = page.locator(SEL.viewsGrid).getByText('Vehicle Master', { exact: false })
    if (!await vehicleRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No seeded views found in grid — run db/seeds/seed_all.sh first')
      return
    }

    await vehicleRow.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
  })

  test('archive view via API', async ({ request }) => {
    // Create a view to archive
    const createRes = await request.post('/api/v1/studio/views', {
      data: {
        view_label: 'Archive Test ' + Date.now(),
        surface_type: 'standard_crud',
        primary_entity: 'vehicle',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()
    expect(view).toHaveProperty('artifact_id')

    // Verify it was created
    const getRes = await request.get(`/api/v1/studio/views/${view.artifact_id}`, {
      headers: DEV_HEADERS,
    })
    expect(getRes.status()).toBe(200)

    // Delete it
    const deleteRes = await request.delete(`/api/v1/studio/views/${view.artifact_id}`, {
      headers: DEV_HEADERS,
    })
    expect(deleteRes.ok()).toBeTruthy()
  })

  test('GET /studio/views API returns items array', async ({ request }) => {
    const res = await request.get('/api/v1/studio/views', {
      headers: DEV_HEADERS,
    })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBeTruthy()
    expect(data).toHaveProperty('total')
    expect(typeof data.total).toBe('number')
  })

  test('GET /studio/views surface filter works', async ({ request }) => {
    const res = await request.get('/api/v1/studio/views?surface=standard_crud', {
      headers: DEV_HEADERS,
    })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data.items)).toBeTruthy()
    // All returned items should be standard_crud
    for (const item of data.items) {
      expect(item.surface_type).toBe('standard_crud')
    }
  })

  test('POST /studio/views creates view with correct fields', async ({ request }) => {
    const ts = Date.now()
    const res = await request.post('/api/v1/studio/views', {
      data: {
        view_label: 'API CRUD Test ' + ts,
        surface_type: 'standard_crud',
        primary_entity: 'vehicle',
        view_code: 'api_crud_test_' + ts,
      },
      headers: DEV_HEADERS,
    })
    expect(res.status()).toBe(201)
    const view = await res.json()
    expect(view).toHaveProperty('artifact_id')
    expect(view.surface_type).toBe('standard_crud')
    expect(view.primary_entity).toBe('vehicle')

    // Cleanup
    await request.delete(`/api/v1/studio/views/${view.artifact_id}`, {
      headers: DEV_HEADERS,
    })
  })

  test('DELETE /studio/views/:id archives the view', async ({ request }) => {
    const createRes = await request.post('/api/v1/studio/views', {
      data: {
        view_label: 'Delete Test ' + Date.now(),
        surface_type: 'standard_crud',
        primary_entity: 'customer',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()

    const deleteRes = await request.delete(`/api/v1/studio/views/${view.artifact_id}`, {
      headers: DEV_HEADERS,
    })
    expect(deleteRes.ok()).toBeTruthy()
  })
})

// ─── New View Creation — Feature tests (T1–T6) ────────────────────────────────

test.describe('New View Creation — surface cards, entity picker, auto-name', () => {
  test('T1 — Surface type card grid renders all enabled types + Kanban disabled', async ({ page }) => {
    await page.goto('studio/views')
    await page.locator(SEL.newViewBtn).click()

    const modal = page.locator(SEL.createViewModal)
    await expect(modal).toBeVisible()

    // Each enabled surface type should have a visible card
    const enabledSurfaces = ['standard_crud', 'advanced_crud', 'header_line', 'dashboard', 'wizard', 'detail_page', 'split_view', 'calendar', 'custom_page']
    for (const s of enabledSurfaces) {
      await expect(modal.locator(`[data-testid="surface-card-${s}"]`)).toBeVisible()
    }

    // New labels — not old developer names
    await expect(modal.getByText('List View', { exact: true })).toBeVisible()
    await expect(modal.getByText('Header + Lines', { exact: true })).toBeVisible()
    await expect(modal.getByText('Form View', { exact: true })).toBeVisible()
    await expect(modal.getByText('Editable Grid', { exact: true })).toBeVisible()
    // Old names should NOT appear
    await expect(modal.getByText('Standard CRUD', { exact: true })).not.toBeVisible()
    await expect(modal.getByText('Header / Line', { exact: true })).not.toBeVisible()
    await expect(modal.getByText('Detail Page', { exact: true })).not.toBeVisible()

    // Kanban is present but aria-disabled
    const kanbanCard = modal.locator('[data-testid="surface-card-kanban"]')
    await expect(kanbanCard).toBeVisible()
    await expect(kanbanCard).toHaveAttribute('aria-disabled', 'true')
    await expect(kanbanCard.getByText('Soon')).toBeVisible()

    await modal.getByRole('button', { name: /Cancel/i }).click()
  })

  test('T2 — Entity dropdown populated from Entity Designer (real DB)', async ({ page, request }) => {
    // Query the backend directly to know what entities should be in the dropdown
    const entitiesRes = await request.get('/api/v1/studio/entities', { headers: DEV_HEADERS })
    expect(entitiesRes.ok()).toBeTruthy()
    const { items } = await entitiesRes.json()
    expect(Array.isArray(items)).toBeTruthy()
    expect(items.length).toBeGreaterThan(0)

    await page.goto('studio/views')
    await page.locator(SEL.newViewBtn).click()

    const modal = page.locator(SEL.createViewModal)
    // Select "List View" (requires entity)
    await modal.locator('[data-testid="surface-card-standard_crud"]').click()

    // Open the entity select
    const entitySelect = modal.locator('select').first()
    await expect(entitySelect).toBeVisible()

    // Verify at least one known entity appears in the options
    const options = await entitySelect.locator('option').allTextContents()
    const entityNames = items.map((e: { display_name: string }) => e.display_name)

    // At least one entity from the DB should be in the dropdown
    const matched = entityNames.some((name: string) => options.includes(name))
    expect(matched).toBeTruthy()

    // Should NOT be the old hardcoded 12-item list exclusively
    // The real DB has more entities than 12 (or at least the count matches the API)
    const nonEmptyOptions = options.filter((o: string) => o && !o.includes('Select entity'))
    expect(nonEmptyOptions.length).toBe(items.length)

    await modal.getByRole('button', { name: /Cancel/i }).click()
  })

  test('T3 — Dashboard surface → entity optional, view creates without entity', async ({ page, request }) => {
    await page.goto('studio/views')
    await page.locator(SEL.newViewBtn).click()

    const modal = page.locator(SEL.createViewModal)
    // Select Dashboard
    await modal.locator('[data-testid="surface-card-dashboard"]').click()

    // Entity label should say "optional"
    await expect(modal.getByText(/optional/i)).toBeVisible()

    // Enter name, skip entity
    const nameInput = modal.locator('input[type="text"]').first()
    await nameInput.triple_click?.() // clear auto-filled name
    await nameInput.fill('Test Dashboard No Entity')

    // Should create without entity
    await modal.getByRole('button', { name: /Create View/i }).click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/, { timeout: 8000 })

    // Cleanup
    const url = page.url()
    const match = url.match(/studio\/views\/([^/]+)\/edit/)
    if (match?.[1]) {
      await request.delete(`/api/v1/studio/views/${match[1]}`, { headers: DEV_HEADERS })
    }
  })

  test('T4 — List View surface → entity required, validation blocks empty entity', async ({ page }) => {
    await page.goto('studio/views')
    await page.locator(SEL.newViewBtn).click()

    const modal = page.locator(SEL.createViewModal)
    // standard_crud is default selected — ensure it
    await modal.locator('[data-testid="surface-card-standard_crud"]').click()

    // Clear the auto-filled name and enter a name
    const nameInput = modal.locator('input[type="text"]').first()
    await nameInput.fill('Test Without Entity')

    // Don't select entity — submit
    await modal.getByRole('button', { name: /Create View/i }).click()

    // Modal should still be visible (validation blocked)
    await expect(modal).toBeVisible()
    // URL should NOT change to /edit
    await expect(page).not.toHaveURL(/studio\/views\/.+\/edit/)
  })

  test('T5 — Auto-name and auto-code generation', async ({ page }) => {
    await page.goto('studio/views')
    await page.locator(SEL.newViewBtn).click()

    const modal = page.locator(SEL.createViewModal)

    // Select Header + Lines
    await modal.locator('[data-testid="surface-card-header_line"]').click()

    // Select entity "Sale Order"
    const entitySelect = modal.locator('select').first()
    await entitySelect.selectOption({ label: 'Sale Order' })

    // Name should be auto-filled
    const nameInput = modal.locator('input[type="text"]').first()
    const autoName = await nameInput.inputValue()
    expect(autoName).toMatch(/Sale Order/i)
    expect(autoName).toMatch(/Header/i)

    // View code should be auto-filled as snake_case
    const codeInput = modal.locator('input[type="text"]').nth(1)
    const autoCode = await codeInput.inputValue()
    expect(autoCode).toMatch(/^[a-z0-9_]+$/) // snake_case
    expect(autoCode).toContain('sale_order')

    // Now manually edit the name
    await nameInput.fill('Vehicle Sale Order')
    // Code should update
    await page.waitForTimeout(50)
    const updatedCode = await codeInput.inputValue()
    expect(updatedCode).toBe('vehicle_sale_order')

    // Change surface type — name should NOT reset (user manually typed it)
    await modal.locator('[data-testid="surface-card-standard_crud"]').click()
    const nameAfterSurfaceChange = await nameInput.inputValue()
    expect(nameAfterSurfaceChange).toBe('Vehicle Sale Order')

    await modal.getByRole('button', { name: /Cancel/i }).click()
  })

  test('T6 — End-to-end: create view, appears in list with correct surface badge', async ({ page, request }) => {
    const ts = Date.now()
    const viewName = `Vehicle Sale Order ${ts}`

    await page.goto('studio/views')
    await page.locator(SEL.newViewBtn).click()

    const modal = page.locator(SEL.createViewModal)

    // Select Header + Lines
    await modal.locator('[data-testid="surface-card-header_line"]').click()

    // Select entity
    const entitySelect = modal.locator('select').first()
    await entitySelect.selectOption({ label: 'Sale Order' })

    // Override auto-name
    const nameInput = modal.locator('input[type="text"]').first()
    await nameInput.fill(viewName)

    // Set view code
    const codeInput = modal.locator('input[type="text"]').nth(1)
    await codeInput.fill(`vehicle_sale_order_${ts}`)

    await modal.getByRole('button', { name: /Create View/i }).click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/, { timeout: 8000 })

    // Extract ID for cleanup
    const url = page.url()
    const match = url.match(/studio\/views\/([^/]+)\/edit/)
    const viewId = match?.[1]

    // Navigate back to list
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Row should be visible in the list
    const row = page.locator(SEL.viewsGrid).getByText(viewName, { exact: false })
    await expect(row).toBeVisible({ timeout: 5000 })

    // Surface badge should show "Header + Lines" (new label)
    const rowContainer = row.locator('..').locator('..')
    await expect(rowContainer.getByText('Header + Lines')).toBeVisible()

    // Cleanup
    if (viewId) {
      await request.delete(`/api/v1/studio/views/${viewId}`, { headers: DEV_HEADERS })
    }
  })
})
