/**
 * dashboard.spec.ts — Integration tests for Dashboard surface views
 *
 * Tests: Sales Dashboard, Service Dashboard seeded views.
 * API: creates/verifies dashboard surface views.
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

test.describe('Dashboard surface — Seeded DMS views', () => {
  test('Sales Dashboard view loads in designer', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    const view = page.locator(SEL.viewsGrid).getByText('Sales Dashboard', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Sales Dashboard seed view not found — run db/seeds/seed_all.sh first')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('View not found')
  })

  test('Sales Dashboard designer shows palette', async ({ page }) => {
    await page.goto('studio/views')

    const view = page.locator(SEL.viewsGrid).getByText('Sales Dashboard', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Sales Dashboard seed view not found')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.componentPalette)).toBeVisible({ timeout: 10000 })
  })

  test('Service Dashboard view loads in designer', async ({ page }) => {
    await page.goto('studio/views')

    const view = page.locator(SEL.viewsGrid).getByText('Service Dashboard', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Service Dashboard seed view not found')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
  })
})

test.describe('Dashboard surface — API', () => {
  test('create dashboard surface view returns correct structure', async ({ request }) => {
    const ts = Date.now()
    const res = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Dashboard Test ' + ts,
        surface_type: 'dashboard',
        primary_entity: 'vehicle',
        view_code: 'dashboard_test_' + ts,
        description: 'Integration test dashboard view',
      },
      headers: DEV_HEADERS,
    })
    expect(res.status()).toBe(201)
    const view = await res.json()
    expect(view).toHaveProperty('artifact_id')
    expect(view.surface_type).toBe('dashboard')

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('GET /studio/views?surface=dashboard filters correctly', async ({ request }) => {
    const res = await request.get(`${BASE}/views?surface=dashboard`, { headers: DEV_HEADERS })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    for (const item of data.items) {
      expect(item.surface_type).toBe('dashboard')
    }
  })

  test('dashboard view draft saved with chart and metric components', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Dashboard Draft Test ' + Date.now(),
        surface_type: 'dashboard',
        primary_entity: 'vehicle',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()

    const payload = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        label: 'Dashboard Root',
        props: {},
        children: [
          {
            component_key: 'metric_abc12345',
            component_code: 'metric_card',
            label: 'Total Vehicles',
            props: { title: 'Total Vehicles', format: 'number' },
            children: [],
          },
          {
            component_key: 'chart_def67890',
            component_code: 'chart',
            label: 'Sales Chart',
            props: { chart_type: 'bar', title: 'Monthly Sales' },
            children: [],
          },
        ],
      },
      data_sources: [
        {
          source_key: 'vehicles_summary',
          entity_type: 'vehicle',
          mode: 'list',
        },
      ],
      events: [],
    }

    const draftRes = await request.put(`${BASE}/views/${view.artifact_id}/draft`, {
      data: { payload, revision: view.revision ?? 0 },
      headers: DEV_HEADERS,
    })
    expect(draftRes.ok()).toBeTruthy()

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('dashboard view designer loads via direct URL navigation', async ({ page, request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Dashboard Nav Test ' + Date.now(),
        surface_type: 'dashboard',
        primary_entity: 'vehicle',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()

    await page.goto(`studio/views/${view.artifact_id}/edit`)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('View not found')

    // Surface type should appear in toolbar
    const meta = page.locator('.vd-toolbar__meta')
    if (await meta.isVisible()) {
      await expect(meta).toContainText(/dashboard/i)
    }

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })
})
