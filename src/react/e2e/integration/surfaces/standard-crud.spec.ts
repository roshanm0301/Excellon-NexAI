/**
 * standard-crud.spec.ts — Integration tests for Standard CRUD surface views
 *
 * Tests: Vehicle Master, Customer Master, Parts Inventory seeded views.
 * API: creates/verifies standard_crud surface views.
 */

import { test, expect } from '@playwright/test'
import { SEL } from '../helpers/selectors'

const DEV_HEADERS = {
  'x-tenant-id': '00000000-0000-0000-0000-000000000001',
  'x-user-id': '00000000-0000-0000-0000-000000000001',
  'x-role': 'admin',
  'Content-Type': 'application/json',
}

const BASE = '/api/v1/studio'

test.describe('Standard CRUD surface — Seeded DMS views', () => {
  test('Vehicle Master view loads in designer', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Fill search to filter grid to this view (VirtualGrid only renders visible rows)
    const searchInput1 = page.locator(SEL.searchInput)
    if (await searchInput1.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput1.fill('Vehicle Master')
      await page.waitForTimeout(300)
    }

    const vehicleView = page.locator(SEL.viewsGrid).getByText('Vehicle Master', { exact: false })
    if (!await vehicleView.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Vehicle Master seed view not found — run db/seeds/seed_all.sh first')
    }

    await vehicleView.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('View not found')
  })

  test('Vehicle Master designer shows component tree and palette', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Fill search to filter grid to this view (VirtualGrid only renders visible rows)
    const searchInput = page.locator(SEL.searchInput)
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Vehicle Master')
      await page.waitForTimeout(300)
    }

    const vehicleView = page.locator(SEL.viewsGrid).getByText('Vehicle Master', { exact: false })
    if (!await vehicleView.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Vehicle Master seed view not found')
    }

    await vehicleView.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)

    // Component tree and palette should be visible in non-preview mode
    await expect(page.locator(SEL.componentPalette)).toBeVisible({ timeout: 10000 })
    await expect(page.locator(SEL.componentTree)).toBeVisible()
  })

  test('Vehicle Master toolbar has save and publish buttons', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Fill search to filter grid to this view (VirtualGrid only renders visible rows)
    const searchInput = page.locator(SEL.searchInput)
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Vehicle Master')
      await page.waitForTimeout(300)
    }

    const vehicleView = page.locator(SEL.viewsGrid).getByText('Vehicle Master', { exact: false })
    if (!await vehicleView.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Vehicle Master seed view not found')
    }

    await vehicleView.click()
    await expect(page.locator(SEL.vdSaveBtn)).toBeVisible()
    await expect(page.locator(SEL.vdPublishBtn)).toBeVisible()
    await expect(page.locator(SEL.vdPreviewBtn)).toBeVisible()
  })

  test('Customer Master view loads in designer', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Fill search to filter grid to this view (VirtualGrid only renders visible rows)
    const searchInput = page.locator(SEL.searchInput)
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Customer Master')
      await page.waitForTimeout(300)
    }

    const view = page.locator(SEL.viewsGrid).getByText('Customer Master', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Customer Master seed view not found')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
  })

  test('Parts Inventory view loads in designer', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Fill search to filter grid to this view (VirtualGrid only renders visible rows)
    const searchInput = page.locator(SEL.searchInput)
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Parts Inventory')
      await page.waitForTimeout(300)
    }

    const view = page.locator(SEL.viewsGrid).getByText('Parts Inventory', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Parts Inventory seed view not found')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
  })

  test('designer back button navigates to list', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Fill search to filter grid to this view (VirtualGrid only renders visible rows)
    const searchInput = page.locator(SEL.searchInput)
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Vehicle Master')
      await page.waitForTimeout(300)
    }

    const firstView = page.locator(SEL.viewsGrid).getByText('Vehicle Master', { exact: false })
    if (!await firstView.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No seeded views found')
    }

    await firstView.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)

    // Back button (ChevronLeft ghost button)
    const backBtn = page.locator('[data-testid="vd-toolbar"]').getByRole('button').first()
    await backBtn.click()
    await expect(page).toHaveURL(/studio\/views$/)
  })
})

test.describe('Standard CRUD surface — API verification', () => {
  test('GET /studio/views returns items with surface_type', async ({ request }) => {
    const res = await request.get(`${BASE}/views`, { headers: DEV_HEADERS })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBeTruthy()
    expect(typeof data.total).toBe('number')
  })

  test('GET /studio/views?surface=standard_crud filters correctly', async ({ request }) => {
    const res = await request.get(`${BASE}/views?surface=standard_crud`, { headers: DEV_HEADERS })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    for (const item of data.items) {
      expect(item.surface_type).toBe('standard_crud')
    }
  })

  test('create standard_crud view returns correct structure', async ({ request }) => {
    const ts = Date.now()
    const res = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'CRUD Surface Test ' + ts,
        surface_type: 'standard_crud',
        primary_entity: 'vehicle',
        view_code: 'crud_surface_test_' + ts,
      },
      headers: DEV_HEADERS,
    })
    expect(res.status()).toBe(201)
    const view = await res.json()
    expect(view).toHaveProperty('artifact_id')
    expect(view.surface_type).toBe('standard_crud')
    expect(view.primary_entity).toBe('vehicle')
    expect(view.is_draft).toBe(true)
    expect(view.is_active).toBe(false)

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('create standard_crud view requires view_label and primary_entity', async ({ request }) => {
    // Missing primary_entity — should return 422
    const res = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Missing Entity Test',
        surface_type: 'standard_crud',
        // primary_entity intentionally omitted
      },
      headers: DEV_HEADERS,
    })
    expect(res.status()).toBe(422)
  })

  test('GET /studio/views/:id returns full view with payload', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Get View Test ' + Date.now(),
        surface_type: 'standard_crud',
        primary_entity: 'customer',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const created = await createRes.json()

    const getRes = await request.get(`${BASE}/views/${created.artifact_id}`, {
      headers: DEV_HEADERS,
    })
    expect(getRes.ok()).toBeTruthy()
    const view = await getRes.json()
    expect(view).toHaveProperty('artifact_id')
    expect(view).toHaveProperty('latest_payload')
    expect(view.surface_type).toBe('standard_crud')

    // Cleanup
    await request.delete(`${BASE}/views/${created.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('component registry returns registered components', async ({ request }) => {
    const res = await request.get(`${BASE}/component-registry`, { headers: DEV_HEADERS })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    // Should be an array of component entries
    expect(Array.isArray(data)).toBeTruthy()
    if (data.length > 0) {
      const comp = data[0]
      expect(comp).toHaveProperty('component_code')
      expect(comp).toHaveProperty('component_name')
      expect(comp).toHaveProperty('category')
    }
  })

  test('GET /studio/entities lists entity types', async ({ request }) => {
    const res = await request.get(`${BASE}/entities`, { headers: DEV_HEADERS })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBeTruthy()
  })
})
