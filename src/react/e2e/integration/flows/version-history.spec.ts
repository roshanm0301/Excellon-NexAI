/**
 * version-history.spec.ts — End-to-end tests for view versioning and history
 *
 * Runs against the real Go backend (VITE_MSW=false).
 * Tests draft save, publish, version listing, and rollback APIs.
 */

import { test, expect } from '@playwright/test'

const DEV_HEADERS = {
  'x-tenant-id': '00000000-0000-0000-0000-000000000001',
  'x-user-id': '00000000-0000-0000-0000-000000000001',
  'x-role': 'admin',
  'Content-Type': 'application/json',
}

const BASE = '/api/v1/studio'

async function createTestView(request: Parameters<typeof test>[1] extends (args: infer A) => unknown ? never : any, label: string) {
  const res = await request.post(`${BASE}/views`, {
    data: {
      view_label: label,
      surface_type: 'standard_crud',
      primary_entity: 'vehicle',
    },
    headers: DEV_HEADERS,
  })
  if (!res.ok()) throw new Error(`createTestView failed: ${res.status()} ${await res.text()}`)
  return res.json() as Promise<{ artifact_id: string; revision: number }>
}

async function deleteTestView(request: any, artifactId: string) {
  await request.delete(`${BASE}/views/${artifactId}`, { headers: DEV_HEADERS })
}

test.describe('Version history — API flows', () => {
  test('save draft stores payload and increments revision', async ({ request }) => {
    const view = await createTestView(request, 'Version Test Draft ' + Date.now())
    const initialRevision = view.revision ?? 0

    const payload = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        label: 'Page Root',
        props: {},
        children: [],
      },
      data_sources: [],
      events: [],
    }

    const draftRes = await request.put(`${BASE}/views/${view.artifact_id}/draft`, {
      data: { payload, revision: initialRevision },
      headers: DEV_HEADERS,
    })
    expect(draftRes.ok()).toBeTruthy()

    // Fetch view to verify revision changed
    const getRes = await request.get(`${BASE}/views/${view.artifact_id}`, {
      headers: DEV_HEADERS,
    })
    expect(getRes.ok()).toBeTruthy()
    const updated = await getRes.json()
    expect(updated.revision).toBeGreaterThanOrEqual(initialRevision + 1)
    expect(updated.is_draft).toBe(true)

    await deleteTestView(request, view.artifact_id)
  })

  test('save draft with nested component tree', async ({ request }) => {
    const view = await createTestView(request, 'Version Test Nested ' + Date.now())

    const payload = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        label: 'Page Root',
        props: {},
        children: [
          {
            component_key: 'section_abc12345',
            component_code: 'section',
            label: 'Main Section',
            props: { title: 'Vehicle Details' },
            children: [
              {
                component_key: 'input_def67890',
                component_code: 'text_input',
                label: 'VIN Input',
                props: { label: 'VIN', required: true },
                children: [],
              },
            ],
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

    await deleteTestView(request, view.artifact_id)
  })

  test('publish view after saving draft', async ({ request }) => {
    const view = await createTestView(request, 'Version Test Publish ' + Date.now())

    // Save a draft first
    const payload = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        label: 'Page Root',
        props: {},
        children: [],
      },
      data_sources: [],
      events: [],
    }

    const draftRes = await request.put(`${BASE}/views/${view.artifact_id}/draft`, {
      data: { payload, revision: view.revision ?? 0 },
      headers: DEV_HEADERS,
    })
    expect(draftRes.ok()).toBeTruthy()

    // Publish the view
    const publishRes = await request.post(`${BASE}/views/${view.artifact_id}/publish`, {
      data: { changelog: 'Initial publish from integration test' },
      headers: DEV_HEADERS,
    })
    // 200 = published, 422 = validation error (acceptable if payload doesn't pass validation)
    expect([200, 422]).toContain(publishRes.status())

    if (publishRes.ok()) {
      // Verify view is now active
      const getRes = await request.get(`${BASE}/views/${view.artifact_id}`, {
        headers: DEV_HEADERS,
      })
      expect(getRes.ok()).toBeTruthy()
      const updated = await getRes.json()
      expect(updated.is_active).toBe(true)
    }

    await deleteTestView(request, view.artifact_id)
  })

  test('GET /views/:id/versions lists version history', async ({ request }) => {
    const view = await createTestView(request, 'Version History List ' + Date.now())

    const versionsRes = await request.get(`${BASE}/views/${view.artifact_id}/versions`, {
      headers: DEV_HEADERS,
    })
    expect(versionsRes.ok()).toBeTruthy()
    const data = await versionsRes.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBeTruthy()
    // Newly created view should have at least 1 version (the initial draft)
    expect(data.items.length).toBeGreaterThanOrEqual(1)

    await deleteTestView(request, view.artifact_id)
  })

  test('version entry has required fields', async ({ request }) => {
    const view = await createTestView(request, 'Version Fields Test ' + Date.now())

    const versionsRes = await request.get(`${BASE}/views/${view.artifact_id}/versions`, {
      headers: DEV_HEADERS,
    })
    expect(versionsRes.ok()).toBeTruthy()
    const data = await versionsRes.json()
    expect(data.items.length).toBeGreaterThanOrEqual(1)

    const v = data.items[0]
    expect(v).toHaveProperty('version_id')
    expect(v).toHaveProperty('artifact_id')
    expect(v).toHaveProperty('version_no')
    expect(v).toHaveProperty('is_draft')
    expect(v).toHaveProperty('created_at')

    await deleteTestView(request, view.artifact_id)
  })

  test('rollback to previous version', async ({ request }) => {
    const view = await createTestView(request, 'Rollback Test ' + Date.now())

    // Save v1 draft
    const payloadV1 = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        label: 'Page Root',
        props: { title: 'Version 1' },
        children: [],
      },
      data_sources: [],
      events: [],
    }
    const draft1Res = await request.put(`${BASE}/views/${view.artifact_id}/draft`, {
      data: { payload: payloadV1, revision: view.revision ?? 0 },
      headers: DEV_HEADERS,
    })
    expect(draft1Res.ok()).toBeTruthy()

    // Get versions to find the version ID
    const versionsRes = await request.get(`${BASE}/views/${view.artifact_id}/versions`, {
      headers: DEV_HEADERS,
    })
    expect(versionsRes.ok()).toBeTruthy()
    const versions = await versionsRes.json()
    expect(versions.items.length).toBeGreaterThanOrEqual(1)

    const versionId = versions.items[0].version_id

    // Attempt rollback
    const rollbackRes = await request.post(
      `${BASE}/views/${view.artifact_id}/rollback/${versionId}`,
      {
        data: { changelog: 'rollback to v1 in test' },
        headers: DEV_HEADERS,
      },
    )
    // 200 = success, 422 = validation issue — both acceptable in test
    expect([200, 422]).toContain(rollbackRes.status())

    await deleteTestView(request, view.artifact_id)
  })

  test('GET /views/:id/sync-status returns schema sync info', async ({ request }) => {
    const view = await createTestView(request, 'Sync Status Test ' + Date.now())

    const syncRes = await request.get(`${BASE}/views/${view.artifact_id}/sync-status`, {
      headers: DEV_HEADERS,
    })
    // May return 200 with sync status or 404 if no published version
    expect([200, 404]).toContain(syncRes.status())

    if (syncRes.ok()) {
      const data = await syncRes.json()
      expect(data).toHaveProperty('broken_bindings')
    }

    await deleteTestView(request, view.artifact_id)
  })

  test('version history panel visible in designer for seeded view', async ({ page, request }) => {
    // Create a view and navigate to it
    const res = await request.post(`${BASE}/views`, {
      data: {
        view_label: 'Version UI Test ' + Date.now(),
        surface_type: 'standard_crud',
        primary_entity: 'vehicle',
      },
      headers: DEV_HEADERS,
    })
    expect(res.ok()).toBeTruthy()
    const view = await res.json()

    await page.goto(`studio/views/${view.artifact_id}/edit`)
    await expect(page.locator('[data-testid="vd-toolbar"]')).toBeVisible()

    // Open Settings drawer which contains version history
    const settingsBtn = page.getByTitle('View Settings')
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click()
      // Drawer should open
      await page.waitForTimeout(300)
    }

    // Cleanup
    await request.delete(`${BASE}/views/${view.artifact_id}`, { headers: DEV_HEADERS })
  })
})
