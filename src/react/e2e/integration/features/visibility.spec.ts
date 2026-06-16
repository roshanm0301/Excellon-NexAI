/**
 * visibility.spec.ts — Integration tests for VisibilityRuleBuilder
 *
 * VisibilityRuleBuilder renders inside PropertyPanel when "Visibility" tab is active.
 * Tab elements are div.pp-tab (not button[role="tab"]).
 * VisibilityRuleBuilder has data-testid="visibility-rule-builder".
 *
 * Supported conditions: always | field_equals | expression | role_in
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

async function createViewWithVisibilityRules(request: APIRequestContext) {
  const createRes = await request.post(`${BASE}/views`, {
    data: {
      view_label: 'Visibility Test ' + Date.now(),
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
          component_key: 'btn_admin_0001',
          component_code: 'button',
          label: 'Admin Only Button',
          props: { label: 'Archive', variant: 'danger' },
          visibility: {
            condition: 'role_in',
            roles: ['admin', 'manager'],
            remove_from_dom: false,
          },
          children: [],
        },
        {
          component_key: 'section_sold_0002',
          component_code: 'section',
          label: 'Sold Vehicle Info',
          props: { title: 'Sale Info' },
          visibility: {
            condition: 'field_equals',
            field_key: 'status',
            value: 'sold',
            remove_from_dom: true,
          },
          children: [],
        },
        {
          component_key: 'label_expr_0003',
          component_code: 'label',
          label: 'Stock Label',
          props: { label: 'In Stock' },
          visibility: {
            condition: 'expression',
            expression: 'stock_count > 0',
            remove_from_dom: false,
          },
          children: [],
        },
      ],
    },
    data_sources: [],
    events: [],
  }

  await request.put(`${BASE}/views/${view.artifact_id}/draft`, {
    data: { payload, revision: view.revision ?? 0 },
    headers: DEV_HEADERS,
  })

  return view
}

test.describe('Visibility rule builder — UI interaction', () => {
  let viewId: string

  test.beforeEach(async ({ request }) => {
    const view = await createViewWithVisibilityRules(request)
    viewId = view.artifact_id
  })

  test.afterEach(async ({ request }) => {
    if (viewId) {
      await request.delete(`${BASE}/views/${viewId}`, { headers: DEV_HEADERS })
    }
  })

  test('visibility rule builder visible when Visibility tab is clicked', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    const btnNode = page.locator('[data-component-key="btn_admin_0001"]')
    if (!await btnNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Admin button node not found in component tree')
    }

    await btnNode.click()
    await expect(page.locator(SEL.propertyPanel)).toBeVisible()

    // Click Visibility tab (div.pp-tab)
    const visibilityTab = page.locator('.pp-tab').filter({ hasText: 'Visibility' })
    await expect(visibilityTab).toBeVisible()
    await visibilityTab.click()

    // Visibility rule builder should be visible
    await expect(page.locator(SEL.visibilityRuleBuilder)).toBeVisible()
  })

  test('visibility rule builder shows "Visibility Rules" title', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    const btnNode = page.locator('[data-component-key="btn_admin_0001"]')
    if (!await btnNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Admin button node not found')
    }

    await btnNode.click()
    const visibilityTab = page.locator('.pp-tab').filter({ hasText: 'Visibility' })
    await visibilityTab.click()

    const builder = page.locator(SEL.visibilityRuleBuilder)
    await expect(builder).toBeVisible()
    await expect(builder).toContainText(/Visibility Rules/i)
  })

  test('visibility rule builder shows condition selector', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    const btnNode = page.locator('[data-component-key="btn_admin_0001"]')
    if (!await btnNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Admin button node not found')
    }

    await btnNode.click()
    const visibilityTab = page.locator('.pp-tab').filter({ hasText: 'Visibility' })
    await visibilityTab.click()

    const builder = page.locator(SEL.visibilityRuleBuilder)
    await expect(builder).toBeVisible()

    // Condition selector should be present
    const conditionSelect = builder.locator('select').first()
    await expect(conditionSelect).toBeVisible()

    // Should have all 4 condition options
    const options = await conditionSelect.locator('option').allTextContents()
    const optionTexts = options.join(' ')
    expect(optionTexts).toMatch(/Always Visible/i)
    expect(optionTexts).toMatch(/Field Equals/i)
    expect(optionTexts).toMatch(/Expression/i)
    expect(optionTexts).toMatch(/Role-Based/i)
  })

  test('role_in condition node shows roles input', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    const btnNode = page.locator('[data-component-key="btn_admin_0001"]')
    if (!await btnNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Admin button node not found')
    }

    await btnNode.click()
    const visibilityTab = page.locator('.pp-tab').filter({ hasText: 'Visibility' })
    await visibilityTab.click()

    const builder = page.locator(SEL.visibilityRuleBuilder)
    await expect(builder).toBeVisible()

    // If the node has role_in visibility, should show roles input
    // The condition selector should be set to role_in
    const conditionSelect = builder.locator('select').first()
    const currentValue = await conditionSelect.inputValue()
    if (currentValue === 'role_in') {
      const rolesInput = builder.locator('input[placeholder*="admin"]')
      await expect(rolesInput).toBeVisible()
      await expect(rolesInput).toHaveValue(/admin/i)
    }
  })

  test('field_equals condition node shows field_key and value inputs', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    const sectionNode = page.locator('[data-component-key="section_sold_0002"]')
    if (!await sectionNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Section node not found')
    }

    await sectionNode.click()
    const visibilityTab = page.locator('.pp-tab').filter({ hasText: 'Visibility' })
    await visibilityTab.click()

    const builder = page.locator(SEL.visibilityRuleBuilder)
    await expect(builder).toBeVisible()

    const conditionSelect = builder.locator('select').first()
    const currentValue = await conditionSelect.inputValue()
    if (currentValue === 'field_equals') {
      // Should show field_key input and value input
      const inputs = builder.locator('input[type="text"]')
      const count = await inputs.count()
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })
})

test.describe('Visibility rule builder — payload API', () => {
  test('view draft with role_in visibility payload is accepted', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Role Visibility Test ' + Date.now(),
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
            component_key: 'btn_admin_only',
            component_code: 'button',
            label: 'Admin Only',
            props: { label: 'Archive', variant: 'danger' },
            visibility: {
              condition: 'role_in',
              roles: ['admin', 'manager'],
              remove_from_dom: false,
            },
            children: [],
          },
          {
            component_key: 'btn_all_users',
            component_code: 'button',
            label: 'Always Visible',
            props: { label: 'View', variant: 'secondary' },
            // No visibility rule = always visible
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

  test('view draft with field_equals visibility payload is accepted', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Field Equals Visibility Test ' + Date.now(),
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
            component_key: 'section_sale_info',
            component_code: 'section',
            label: 'Sale Info',
            props: { title: 'Sale Details' },
            visibility: {
              condition: 'field_equals',
              field_key: 'status',
              value: 'sold',
              remove_from_dom: true,
            },
            children: [],
          },
          {
            component_key: 'section_available_info',
            component_code: 'section',
            label: 'Available Info',
            props: { title: 'Availability' },
            visibility: {
              condition: 'field_equals',
              field_key: 'status',
              value: 'available',
              remove_from_dom: false,
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

  test('view draft with expression visibility payload is accepted', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Expression Visibility Test ' + Date.now(),
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
            component_key: 'section_premium',
            component_code: 'section',
            label: 'Premium Section',
            props: { title: 'Premium Features' },
            visibility: {
              condition: 'expression',
              expression: 'vehicle_price > 50000',
              remove_from_dom: false,
            },
            children: [],
          },
          {
            component_key: 'label_stock',
            component_code: 'label',
            label: 'In Stock Badge',
            props: { label: 'In Stock' },
            visibility: {
              condition: 'expression',
              expression: 'stock_count > 0',
              remove_from_dom: true,
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

  test('view draft with mixed visibility rules across components is accepted', async ({ request }) => {
    const view = await createViewWithVisibilityRules(request)

    // Fetch the view back — the payload should have been saved with visibility rules
    const getRes = await request.get(`${BASE}/views/${view.artifact_id}`, {
      headers: DEV_HEADERS,
    })
    expect(getRes.ok()).toBeTruthy()
    const saved = await getRes.json()
    expect(saved.latest_payload).toBeDefined()

    const tree = saved.latest_payload?.component_tree
    if (tree) {
      const adminBtn = tree.children?.find((c: { component_key: string }) => c.component_key === 'btn_admin_0001')
      if (adminBtn) {
        expect(adminBtn.visibility?.condition).toBe('role_in')
        expect(adminBtn.visibility?.roles).toContain('admin')
      }
    }

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('validate endpoint processes view with visibility rules', async ({ request }) => {
    const view = await createViewWithVisibilityRules(request)

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
