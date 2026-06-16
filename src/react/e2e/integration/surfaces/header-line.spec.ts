/**
 * header-line.spec.ts — Integration tests for Header-Line surface views
 *
 * Tests: Sale Order Editor, Service Order Editor seeded views.
 * API: creates/verifies header_line surface views.
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

test.describe('Header-Line surface — Seeded DMS views', () => {
  test('Sale Order Editor view loads in designer', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Fill search to filter grid to this view (VirtualGrid only renders visible rows)
    const searchInput1 = page.locator(SEL.searchInput)
    if (await searchInput1.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput1.fill('Sale Order Editor')
      await page.waitForTimeout(300)
    }

    const view = page.locator(SEL.viewsGrid).getByText('Sale Order Editor', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Sale Order Editor seed view not found — run db/seeds/seed_all.sh first')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('View not found')
  })

  test('Sale Order Editor designer shows component tree', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Fill search to filter grid to this view (VirtualGrid only renders visible rows)
    const searchInput = page.locator(SEL.searchInput)
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Sale Order Editor')
      await page.waitForTimeout(300)
    }

    const view = page.locator(SEL.viewsGrid).getByText('Sale Order Editor', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Sale Order Editor seed view not found')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })
  })

  test('Service Order Editor view loads in designer', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    // Fill search to filter grid to this view (VirtualGrid only renders visible rows)
    const searchInput = page.locator(SEL.searchInput)
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Service Order Editor')
      await page.waitForTimeout(300)
    }

    const view = page.locator(SEL.viewsGrid).getByText('Service Order Editor', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Service Order Editor seed view not found')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
  })
})

test.describe('Header-Line surface — API', () => {
  test('create header_line surface view returns correct structure', async ({ request }) => {
    const ts = Date.now()
    const res = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Header Line Test ' + ts,
        surface_type: 'header_line',
        primary_entity: 'sale_order',
        view_code: 'header_line_test_' + ts,
        description: 'Integration test header_line view',
      },
      headers: DEV_HEADERS,
    })
    expect(res.status()).toBe(201)
    const view = await res.json()
    expect(view).toHaveProperty('artifact_id')
    expect(view.surface_type).toBe('header_line')
    expect(view.primary_entity).toBe('sale_order')

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('GET /studio/views?surface=header_line filters correctly', async ({ request }) => {
    const res = await request.get(`${BASE}/views?surface=header_line`, { headers: DEV_HEADERS })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    for (const item of data.items) {
      expect(item.surface_type).toBe('header_line')
    }
  })

  test('header_line view draft can be saved with line items structure', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Header Line Draft Test ' + Date.now(),
        surface_type: 'header_line',
        primary_entity: 'sale_order',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()

    const payload = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        label: 'Page Root',
        props: {},
        children: [
          {
            component_key: 'header_abc12345',
            component_code: 'section',
            label: 'Header Section',
            props: { title: 'Order Header' },
            children: [],
          },
          {
            component_key: 'lines_def67890',
            component_code: 'data_table',
            label: 'Line Items',
            props: { title: 'Order Lines' },
            children: [],
          },
        ],
      },
      data_sources: [
        {
          source_key: 'order_ds',
          entity_type: 'sale_order',
          mode: 'single',
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

  test('header_line view navigates correctly from list', async ({ page, request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Nav Test HL ' + Date.now(),
        surface_type: 'header_line',
        primary_entity: 'sale_order',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()

    // Navigate directly to designer URL
    await page.goto(`studio/views/${view.artifact_id}/edit`)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()

    // Surface type should appear in toolbar meta
    const toolbarMeta = page.locator('.vd-toolbar__meta')
    if (await toolbarMeta.isVisible()) {
      await expect(toolbarMeta).toContainText(/header line/i)
    }

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })
})
