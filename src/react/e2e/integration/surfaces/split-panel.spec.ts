/**
 * split-panel.spec.ts — Integration tests for Split View surface views
 *
 * Tests: Customer 360 seeded view.
 * API: creates/verifies split_view surface views.
 *
 * Note: The Go backend uses surface_type "split_view" (not "split_panel").
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

test.describe('Split View surface — Seeded DMS views', () => {
  test('Customer 360 view loads in designer', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    const view = page.locator(SEL.viewsGrid).getByText('Customer 360', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Customer 360 seed view not found — run db/seeds/seed_all.sh first')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('View not found')
  })

  test('Customer 360 designer shows component tree and palette', async ({ page }) => {
    await page.goto('studio/views')

    const view = page.locator(SEL.viewsGrid).getByText('Customer 360', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Customer 360 seed view not found')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.componentPalette)).toBeVisible({ timeout: 10000 })
    await expect(page.locator(SEL.componentTree)).toBeVisible()
  })
})

test.describe('Split View surface — API', () => {
  test('create split_view surface view returns correct structure', async ({ request }) => {
    const ts = Date.now()
    const res = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Split View Test ' + ts,
        surface_type: 'split_view',
        primary_entity: 'customer',
        view_code: 'split_view_test_' + ts,
        description: 'Integration test split_view surface',
      },
      headers: DEV_HEADERS,
    })
    expect(res.status()).toBe(201)
    const view = await res.json()
    expect(view).toHaveProperty('artifact_id')
    expect(view.surface_type).toBe('split_view')
    expect(view.primary_entity).toBe('customer')

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('GET /studio/views?surface=split_view filters correctly', async ({ request }) => {
    const res = await request.get(`${BASE}/views?surface=split_view`, { headers: DEV_HEADERS })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    for (const item of data.items) {
      expect(item.surface_type).toBe('split_view')
    }
  })

  test('split_view draft saved with master-detail structure', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Split View Draft Test ' + Date.now(),
        surface_type: 'split_view',
        primary_entity: 'customer',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()

    const payload = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        label: 'Split View Root',
        props: {},
        children: [
          {
            component_key: 'master_abc12345',
            component_code: 'section',
            label: 'Master Panel',
            props: { title: 'Customer List' },
            children: [
              {
                component_key: 'list_aaa11111',
                component_code: 'data_table',
                label: 'Customer Grid',
                props: { title: 'Customers', selectable: true },
                children: [],
              },
            ],
          },
          {
            component_key: 'detail_def67890',
            component_code: 'section',
            label: 'Detail Panel',
            props: { title: 'Customer Details' },
            children: [
              {
                component_key: 'detail_form_bbb22222',
                component_code: 'form',
                label: 'Customer Form',
                props: { title: 'Customer Info', readonly: true },
                children: [],
              },
            ],
          },
        ],
      },
      data_sources: [
        {
          source_key: 'customer_ds',
          entity_type: 'customer',
          mode: 'list',
        },
      ],
      events: [
        {
          event_type: 'on_row_select',
          source_field: 'list_aaa11111',
          actions: [],
          priority: 100,
          is_active: true,
        },
      ],
    }

    const draftRes = await request.put(`${BASE}/views/${view.artifact_id}/draft`, {
      data: { payload, revision: view.revision ?? 0 },
      headers: DEV_HEADERS,
    })
    expect(draftRes.ok()).toBeTruthy()

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('split_view designer loads via direct URL navigation', async ({ page, request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Split Nav Test ' + Date.now(),
        surface_type: 'split_view',
        primary_entity: 'customer',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()

    await page.goto(`studio/views/${view.artifact_id}/edit`)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    // Surface type should appear in toolbar meta
    const meta = page.locator('.vd-toolbar__meta')
    if (await meta.isVisible()) {
      await expect(meta).toContainText(/split/i)
    }

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('split_view export endpoint accessible', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Split Export Test ' + Date.now(),
        surface_type: 'split_view',
        primary_entity: 'customer',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()

    const exportRes = await request.get(`${BASE}/views/${view.artifact_id}/export`, {
      headers: DEV_HEADERS,
    })
    // 200 = export OK, 404 = nothing to export yet
    expect([200, 404]).toContain(exportRes.status())

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })
})
