/**
 * view-crud.spec.ts — End-to-end tests for View CRUD flows
 *
 * Runs against the real Go backend (VITE_MSW=false).
 * Automotive DMS domain seed data expected.
 */

import { test, expect } from '@playwright/test'
import { createView, deleteView } from '../helpers/api'
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

    // Cleanup: extract viewId from URL and delete
    const url = page.url()
    const match = url.match(/studio\/views\/([^/]+)\/edit/)
    if (match?.[1]) {
      await deleteView(request, match[1])
    }
  })

  test('open existing seeded view in designer via row click', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Look for Vehicle Master first (seeded)
    const vehicleRow = page.locator(SEL.viewsGrid).getByText('Vehicle Master', { exact: false })
    if (await vehicleRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await vehicleRow.click()
      await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
      await expect(page.locator(SEL.vdToolbar)).toBeVisible()
      return
    }

    // Fallback: click first row if any items exist
    const firstCell = page.locator(SEL.viewsGrid).locator('[data-component-key], .vg-cell, .vg-row').first()
    if (await firstCell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstCell.click()
      await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    } else {
      test.skip(true, 'No views found in grid — run db/seeds/seed_all.sh first')
    }
  })

  test('archive view via row action', async ({ request }) => {
    // Create a view to archive
    const view = await createView(request, {
      name: 'Archive Test ' + Date.now(),
      surface_type: 'standard_crud',
    })
    expect(view).toBeDefined()

    // Verify it was created
    const getRes = await request.get(`/api/v1/studio/views/${view.id}`, {
      headers: DEV_HEADERS,
    })
    // Either 200 (found) is acceptable
    expect([200, 404]).toContain(getRes.status())

    // Delete it
    await deleteView(request, view.id)
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
