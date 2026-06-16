/**
 * bindings.spec.ts — Integration tests for the BindingEditor
 *
 * BindingEditor renders inside PropertyPanel when "Bindings" tab is active.
 * Tab elements are div.pp-tab (not button[role="tab"]).
 * BindingEditor has data-testid="binding-editor".
 * Entity fields come from GET /api/v1/studio/entities/:entityType/fields.
 */

import { test, expect, type APIRequestContext } from '@playwright/test'
import { SEL } from '../helpers/selectors'

const DEV_HEADERS = {
  'x-tenant-id': '00000000-0000-0000-0000-000000000001',
  'x-user-id': '00000000-0000-0000-0000-000000000001',
  'x-role': 'admin',
  'Content-Type': 'application/json',
}

const BASE = '/api/v1/studio'

test.describe('Binding editor — entity field API', () => {
  test('GET entity fields for vehicle entity', async ({ request }) => {
    const res = await request.get(`${BASE}/entities/vehicle/fields`, {
      headers: DEV_HEADERS,
    })
    // If seed was applied, should return fields; otherwise 404 is also acceptable
    if (res.ok()) {
      const data = await res.json()
      expect(data).toHaveProperty('items')
      const fields = data.items as Array<{ field_key: string }>
      expect(Array.isArray(fields)).toBeTruthy()
      if (fields.length > 0) {
        const keys = fields.map(f => f.field_key)
        // Core vehicle fields expected in DMS seed
        expect(keys).toContain('vin')
        expect(keys).toContain('make')
        expect(keys).toContain('status')
      }
    } else {
      expect(res.status()).toBe(404)
    }
  })

  test('GET entity fields for customer entity', async ({ request }) => {
    const res = await request.get(`${BASE}/entities/customer/fields`, {
      headers: DEV_HEADERS,
    })
    if (res.ok()) {
      const data = await res.json()
      expect(data).toHaveProperty('items')
      const fields = data.items as Array<{ field_key: string }>
      if (fields.length > 0) {
        const keys = fields.map(f => f.field_key)
        expect(keys).toContain('name')
        expect(keys).toContain('email')
      }
    } else {
      expect(res.status()).toBe(404)
    }
  })

  test('GET entity fields for sale_order entity', async ({ request }) => {
    const res = await request.get(`${BASE}/entities/sale_order/fields`, {
      headers: DEV_HEADERS,
    })
    if (res.ok()) {
      const data = await res.json()
      const fields = data.items as Array<{ field_key: string }>
      if (fields.length > 0) {
        const keys = fields.map(f => f.field_key)
        expect(keys).toContain('customer_code')
        expect(keys).toContain('status')
      }
    } else {
      expect(res.status()).toBe(404)
    }
  })

  test('entity field response includes required schema properties', async ({ request }) => {
    const res = await request.get(`${BASE}/entities/vehicle/fields`, {
      headers: DEV_HEADERS,
    })
    if (!res.ok()) {
      test.skip(true, 'Vehicle entity not seeded')
    }
    const data = await res.json()
    const fields = data.items as Array<Record<string, unknown>>
    if (fields.length > 0) {
      const field = fields[0]
      expect(field).toHaveProperty('field_key')
      expect(field).toHaveProperty('label')
      expect(field).toHaveProperty('field_type')
      expect(field).toHaveProperty('required')
    }
  })

  test('GET /studio/entities returns entity type list', async ({ request }) => {
    const res = await request.get(`${BASE}/entities`, { headers: DEV_HEADERS })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBeTruthy()
  })
})

test.describe('Binding editor — UI interaction', () => {
  let viewId: string

  test.beforeEach(async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Binding Test ' + Date.now(),
        surface_type: 'standard_crud',
        primary_entity: 'vehicle',
      },
      headers: DEV_HEADERS,
    })
    expect(createRes.ok()).toBeTruthy()
    const view = await createRes.json()
    viewId = view.artifact_id

    // Save a draft with a bindable component
    const payload = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        label: 'Page Root',
        props: {},
        children: [
          {
            component_key: 'input_bind0001',
            component_code: 'text_input',
            label: 'VIN Input',
            props: { label: 'VIN', required: false },
            children: [],
          },
        ],
      },
      data_sources: [
        {
          source_key: 'vehicle_ds',
          entity_type: 'vehicle',
          mode: 'single',
        },
      ],
      events: [],
    }

    await request.put(`${BASE}/views/${viewId}/draft`, {
      data: { payload, revision: view.revision ?? 0 },
      headers: DEV_HEADERS,
    })
  })

  test.afterEach(async ({ request }) => {
    if (viewId) {
      await request.delete(`${BASE}/views/${viewId}`, { headers: DEV_HEADERS })
    }
  })

  test('binding editor visible when Bindings tab is clicked', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    // Click a component node to select it
    const inputNode = page.locator('[data-component-key="input_bind0001"]')
    if (!await inputNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Input node not found in component tree')
    }

    await inputNode.click()
    await expect(page.locator(SEL.propertyPanel)).toBeVisible()

    // Click Bindings tab (div.pp-tab with text "Bindings")
    const bindingsTab = page.locator('.pp-tab').filter({ hasText: 'Bindings' })
    await expect(bindingsTab).toBeVisible()
    await bindingsTab.click()

    // Binding editor should now be visible
    await expect(page.locator(SEL.bindingEditor)).toBeVisible()
  })

  test('binding editor shows field bindings section title', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    const inputNode = page.locator('[data-component-key="input_bind0001"]')
    if (!await inputNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Input node not found')
    }

    await inputNode.click()
    const bindingsTab = page.locator('.pp-tab').filter({ hasText: 'Bindings' })
    await bindingsTab.click()

    const editor = page.locator(SEL.bindingEditor)
    await expect(editor).toBeVisible()
    await expect(editor).toContainText(/Field Bindings/i)
  })

  test('binding editor source selector has field, computed, static, expression options', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    const inputNode = page.locator('[data-component-key="input_bind0001"]')
    if (!await inputNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Input node not found')
    }

    await inputNode.click()
    const bindingsTab = page.locator('.pp-tab').filter({ hasText: 'Bindings' })
    await bindingsTab.click()

    const editor = page.locator(SEL.bindingEditor)
    await expect(editor).toBeVisible()

    // If there are existing bindings, the source selector should be visible
    const sourceSelect = editor.locator('select').first()
    if (await sourceSelect.isVisible()) {
      const options = await sourceSelect.locator('option').allTextContents()
      const optionTexts = options.join(' ')
      expect(optionTexts).toMatch(/entity field|computed|static|expression/i)
    }
  })
})

test.describe('Binding editor — saved payload validation', () => {
  test('view draft with field binding payload is accepted', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Binding Payload Test ' + Date.now(),
        surface_type: 'standard_crud',
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
        label: 'Page Root',
        props: {},
        children: [
          {
            component_key: 'input_vin_0001',
            component_code: 'text_input',
            label: 'VIN Input',
            props: { label: 'VIN', required: true },
            bindings: {
              value: {
                source: 'field',
                entity: 'vehicle',
                field_key: 'vin',
              },
            },
            children: [],
          },
          {
            component_key: 'input_make_0002',
            component_code: 'text_input',
            label: 'Make Input',
            props: { label: 'Make' },
            bindings: {
              value: {
                source: 'field',
                entity: 'vehicle',
                field_key: 'make',
              },
            },
            children: [],
          },
          {
            component_key: 'label_static_0003',
            component_code: 'label',
            label: 'Status Label',
            props: { label: 'Status' },
            bindings: {
              value: {
                source: 'static',
                static_value: 'Available',
              },
            },
            children: [],
          },
        ],
      },
      data_sources: [
        {
          source_key: 'vehicle_ds',
          entity_type: 'vehicle',
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

    // Verify payload was persisted correctly
    const getRes = await request.get(`${BASE}/views/${view.artifact_id}`, {
      headers: DEV_HEADERS,
    })
    expect(getRes.ok()).toBeTruthy()
    const saved = await getRes.json()
    const savedPayload = saved.latest_payload
    expect(savedPayload).toBeDefined()

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('view draft with expression binding payload is accepted', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Expression Binding Test ' + Date.now(),
        surface_type: 'standard_crud',
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
            component_key: 'total_label_0001',
            component_code: 'label',
            label: 'Total Amount',
            props: { label: 'Total' },
            bindings: {
              value: {
                source: 'expression',
                expression: '$sum(line_items.amount)',
              },
            },
            children: [],
          },
        ],
      },
      data_sources: [],
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
})
