/**
 * wizard.spec.ts — Integration tests for Wizard surface views
 *
 * Tests: New Vehicle Sale Wizard seeded view.
 * API: creates/verifies wizard surface views.
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

test.describe('Wizard surface — Seeded DMS views', () => {
  test('New Vehicle Sale Wizard view loads in designer', async ({ page }) => {
    await page.goto('studio/views')
    await expect(page.locator(SEL.viewsGrid)).toBeVisible()

    const view = page.locator(SEL.viewsGrid).getByText('New Vehicle Sale Wizard', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'New Vehicle Sale Wizard seed view not found — run db/seeds/seed_all.sh first')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.vdToolbar)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('View not found')
  })

  test('New Vehicle Sale Wizard shows component tree', async ({ page }) => {
    await page.goto('studio/views')

    const view = page.locator(SEL.viewsGrid).getByText('New Vehicle Sale Wizard', { exact: false })
    if (!await view.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'New Vehicle Sale Wizard seed view not found')
    }

    await view.click()
    await expect(page).toHaveURL(/studio\/views\/.+\/edit/)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })
    await expect(page.locator(SEL.componentPalette)).toBeVisible()
  })
})

test.describe('Wizard surface — API', () => {
  test('create wizard surface view returns correct structure', async ({ request }) => {
    const ts = Date.now()
    const res = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Wizard Test ' + ts,
        surface_type: 'wizard',
        primary_entity: 'sale_order',
        view_code: 'wizard_test_' + ts,
        description: 'Integration test wizard view',
      },
      headers: DEV_HEADERS,
    })
    expect(res.status()).toBe(201)
    const view = await res.json()
    expect(view).toHaveProperty('artifact_id')
    expect(view.surface_type).toBe('wizard')
    expect(view.primary_entity).toBe('sale_order')

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('GET /studio/views?surface=wizard filters correctly', async ({ request }) => {
    const res = await request.get(`${BASE}/views?surface=wizard`, { headers: DEV_HEADERS })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    for (const item of data.items) {
      expect(item.surface_type).toBe('wizard')
    }
  })

  test('wizard view draft saved with step structure', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Wizard Steps Test ' + Date.now(),
        surface_type: 'wizard',
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
        label: 'Wizard Root',
        props: {},
        children: [
          {
            component_key: 'step1_abc12345',
            component_code: 'wizard_step',
            label: 'Step 1: Customer',
            props: { step_no: 1, title: 'Customer Selection', description: 'Select or create customer' },
            children: [],
          },
          {
            component_key: 'step2_def67890',
            component_code: 'wizard_step',
            label: 'Step 2: Vehicle',
            props: { step_no: 2, title: 'Vehicle Selection', description: 'Select vehicle to sell' },
            children: [],
          },
          {
            component_key: 'step3_ghi11223',
            component_code: 'wizard_step',
            label: 'Step 3: Finance',
            props: { step_no: 3, title: 'Finance & Pricing', description: 'Configure pricing and finance' },
            children: [],
          },
        ],
      },
      data_sources: [
        {
          source_key: 'sale_order_ds',
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

  test('wizard view designer loads via direct URL', async ({ page, request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Wizard Nav Test ' + Date.now(),
        surface_type: 'wizard',
        primary_entity: 'sale_order',
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
      await expect(meta).toContainText(/wizard/i)
    }

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('wizard view validate endpoint returns result', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Wizard Validate Test ' + Date.now(),
        surface_type: 'wizard',
        primary_entity: 'sale_order',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()

    const validateRes = await request.post(`${BASE}/views/${view.artifact_id}/validate`, {
      data: {},
      headers: DEV_HEADERS,
    })
    // 200 = valid, 422 = invalid — both acceptable
    expect([200, 422]).toContain(validateRes.status())

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })
})
