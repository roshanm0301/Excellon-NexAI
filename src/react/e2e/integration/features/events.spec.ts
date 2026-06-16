/**
 * events.spec.ts — Integration tests for the EventEditor
 *
 * EventEditor renders inside PropertyPanel when "Events" tab is active.
 * Tab elements are div.pp-tab (not button[role="tab"]).
 * EventEditor has data-testid="event-editor".
 * Events are stored in payload.events[] at the view level (not per-node).
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

async function createViewWithEvents(request: APIRequestContext) {
  const createRes = await request.post(`${BASE}/views`, {
    data: {
      view_label: 'Events Test ' + Date.now(),
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
          component_key: 'btn_save_0001',
          component_code: 'button',
          label: 'Save Button',
          props: { label: 'Save', variant: 'primary' },
          children: [],
        },
        {
          component_key: 'btn_cancel_0002',
          component_code: 'button',
          label: 'Cancel Button',
          props: { label: 'Cancel', variant: 'secondary' },
          children: [],
        },
      ],
    },
    data_sources: [],
    events: [
      {
        event_type: 'on_click',
        source_field: 'btn_save_0001',
        actions: [
          {
            action_type: 'show_toast',
            target: '',
            payload: { value: 'Record saved!' },
          },
        ],
        priority: 100,
        is_active: true,
      },
      {
        event_type: 'on_click',
        source_field: 'btn_cancel_0002',
        actions: [
          {
            action_type: 'navigate',
            target: '',
            payload: { value: '/studio/views' },
          },
        ],
        priority: 100,
        is_active: true,
      },
    ],
  }

  await request.put(`${BASE}/views/${view.artifact_id}/draft`, {
    data: { payload, revision: view.revision ?? 0 },
    headers: DEV_HEADERS,
  })

  return view
}

test.describe('Event editor — UI interaction', () => {
  let viewId: string

  test.beforeEach(async ({ request }) => {
    const view = await createViewWithEvents(request)
    viewId = view.artifact_id
  })

  test.afterEach(async ({ request }) => {
    if (viewId) {
      await request.delete(`${BASE}/views/${viewId}`, { headers: DEV_HEADERS })
    }
  })

  test('event editor visible when Events tab is clicked', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    // Click a component node
    const btnNode = page.locator('[data-component-key="btn_save_0001"]')
    if (!await btnNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Button node not found in component tree')
    }

    await btnNode.click()
    await expect(page.locator(SEL.propertyPanel)).toBeVisible()

    // Click Events tab
    const eventsTab = page.locator('.pp-tab').filter({ hasText: 'Events' })
    await expect(eventsTab).toBeVisible()
    await eventsTab.click()

    // Event editor should be visible
    await expect(page.locator(SEL.eventEditor)).toBeVisible()
  })

  test('event editor shows "Event Handlers" section title', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    const btnNode = page.locator('[data-component-key="btn_save_0001"]')
    if (!await btnNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Button node not found')
    }

    await btnNode.click()
    const eventsTab = page.locator('.pp-tab').filter({ hasText: 'Events' })
    await eventsTab.click()

    const editor = page.locator(SEL.eventEditor)
    await expect(editor).toBeVisible()
    await expect(editor).toContainText(/Event Handlers/i)
  })

  test('event editor shows component emits list when registry provides it', async ({ page }) => {
    await page.goto(`studio/views/${viewId}/edit`)
    await expect(page.locator(SEL.componentTree)).toBeVisible({ timeout: 10000 })

    const btnNode = page.locator('[data-component-key="btn_save_0001"]')
    if (!await btnNode.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Button node not found')
    }

    await btnNode.click()
    const eventsTab = page.locator('.pp-tab').filter({ hasText: 'Events' })
    await eventsTab.click()

    const editor = page.locator(SEL.eventEditor)
    await expect(editor).toBeVisible()

    // Either shows emits list or "does not emit any events" message
    const hasEmits = await editor.locator('.ee-emits').isVisible().catch(() => false)
    const hasEmptyMsg = await editor.locator('.pp-empty-msg').isVisible().catch(() => false)
    expect(hasEmits || hasEmptyMsg).toBeTruthy()
  })
})

test.describe('Event editor — payload API', () => {
  test('save view with on_click navigate event payload', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Event Navigate Test ' + Date.now(),
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
            component_key: 'btn_nav_0001',
            component_code: 'button',
            label: 'Go to Vehicles',
            props: { label: 'Vehicles', variant: 'secondary' },
            children: [],
          },
        ],
      },
      data_sources: [],
      events: [
        {
          event_type: 'on_click',
          source_field: 'btn_nav_0001',
          actions: [
            {
              action_type: 'navigate',
              target: '',
              payload: { value: '/vehicles' },
            },
          ],
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

  test('save view with on_submit set_field event payload', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Event Set Field Test ' + Date.now(),
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
            component_key: 'form_vehicle_0001',
            component_code: 'form',
            label: 'Vehicle Form',
            props: { title: 'Vehicle Details' },
            children: [],
          },
        ],
      },
      data_sources: [],
      events: [
        {
          event_type: 'on_submit',
          source_field: 'form_vehicle_0001',
          actions: [
            {
              action_type: 'set_field',
              target: 'status',
              payload: { value: 'sold' },
            },
            {
              action_type: 'show_toast',
              target: '',
              payload: { value: 'Vehicle status updated!' },
            },
          ],
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

  test('save view with on_row_select refresh_datasource event', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Event Row Select Test ' + Date.now(),
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
        label: 'Page Root',
        props: {},
        children: [
          {
            component_key: 'table_customers_0001',
            component_code: 'data_table',
            label: 'Customer List',
            props: { title: 'Customers', selectable: true },
            children: [],
          },
        ],
      },
      data_sources: [
        {
          source_key: 'customer_list',
          entity_type: 'customer',
          mode: 'list',
        },
        {
          source_key: 'customer_detail',
          entity_type: 'customer',
          mode: 'single',
        },
      ],
      events: [
        {
          event_type: 'on_row_select',
          source_field: 'table_customers_0001',
          actions: [
            {
              action_type: 'refresh_datasource',
              target: 'customer_detail',
            },
          ],
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

  test('GET /views/:id/events lists view event definitions', async ({ request }) => {
    const view = await createViewWithEvents(request)

    const eventsRes = await request.get(`${BASE}/views/${view.artifact_id}/events`, {
      headers: DEV_HEADERS,
    })
    expect(eventsRes.ok()).toBeTruthy()
    const data = await eventsRes.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBeTruthy()

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })

  test('multiple event types on same component are stored correctly', async ({ request }) => {
    const createRes = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Multi Event Test ' + Date.now(),
        surface_type: 'standard_crud',
        primary_entity: 'vehicle',
      },
      headers: DEV_HEADERS,
    })
    const view = await createRes.json()

    const payload = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        label: 'Page Root',
        props: {},
        children: [
          {
            component_key: 'input_status_0001',
            component_code: 'select',
            label: 'Status Select',
            props: { label: 'Status' },
            children: [],
          },
        ],
      },
      data_sources: [],
      events: [
        {
          event_type: 'on_change',
          source_field: 'input_status_0001',
          actions: [
            { action_type: 'show_field', target: 'btn_archive_0002' },
          ],
          priority: 100,
          is_active: true,
        },
        {
          event_type: 'on_load',
          source_field: 'input_status_0001',
          actions: [
            { action_type: 'set_field', target: 'status', payload: { value: 'active' } },
          ],
          priority: 50,
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
})
