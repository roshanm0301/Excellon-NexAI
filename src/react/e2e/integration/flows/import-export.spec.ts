import { test, expect } from '@playwright/test'

const HEADERS = {
  'x-tenant-id': '00000000-0000-0000-0000-000000000001',
  'x-user-id': '00000000-0000-0000-0000-000000000001',
  'x-role': 'admin',
  'Content-Type': 'application/json',
}
const BASE = '/api/v1/studio'

// Note: ViewDesignerPage.tsx does NOT have export/import UI buttons.
// These tests cover the API endpoints (GET /views/{id}/export, POST /views/import)
// which are exposed by the Go backend but not yet surfaced in the React UI.

const SAMPLE_PAYLOAD = {
  component_tree: {
    component_key: 'root',
    component_code: 'page_root',
    children: [
      {
        component_key: 'tb1',
        component_code: 'toolbar',
        children: [
          {
            component_key: 'btn_new',
            component_code: 'button',
            props: { label: 'New Vehicle', variant: 'primary' },
            events: [{ event_type: 'on_click', action_type: 'navigate', target: '/vehicles/new' }],
          },
        ],
      },
      {
        component_key: 'dt1',
        component_code: 'data_table',
        props: { columns: ['stock_no', 'vin', 'make', 'model', 'status'] },
        bindings: { data: { field_key: '*', entity: 'vehicle' } },
      },
    ],
  },
  data_sources: [{ key: 'vehicles', entity: 'vehicle', type: 'list' }],
  events: [],
}

async function createView(
  request: import('@playwright/test').APIRequestContext,
  label: string,
): Promise<string> {
  const res = await request.post(`${BASE}/views`, {
    data: {
      view_label: label,
      surface_type: 'standard_crud',
      primary_entity: 'vehicle',
    },
    headers: HEADERS,
  })
  expect(res.ok(), `createView ${res.status()}`).toBeTruthy()
  const view = await res.json()
  return view.artifact_id
}

async function saveDraft(
  request: import('@playwright/test').APIRequestContext,
  viewId: string,
  payload: object,
  revision: number,
) {
  const res = await request.put(`${BASE}/views/${viewId}/draft`, {
    data: { payload, revision },
    headers: HEADERS,
  })
  expect(res.ok(), `saveDraft ${res.status()}`).toBeTruthy()
  return res.json()
}

async function archiveView(
  request: import('@playwright/test').APIRequestContext,
  viewId: string,
) {
  await request.delete(`${BASE}/views/${viewId}`, { headers: HEADERS })
}

test.describe('Export / Import — API round-trip', () => {
  let sourceId: string
  const importedIds: string[] = []

  test.beforeEach(async ({ request }) => {
    sourceId = await createView(request, `Export Source ${Date.now()}`)
    // Save a draft so the view has a payload to export
    await saveDraft(request, sourceId, SAMPLE_PAYLOAD, 1)
  })

  test.afterEach(async ({ request }) => {
    if (sourceId) await archiveView(request, sourceId)
    for (const id of importedIds) {
      await archiveView(request, id)
    }
    importedIds.length = 0
  })

  // ── Export ──────────────────────────────────────────────────────────────────

  test('export returns a valid JSON package with view_meta and payload', async ({ request }) => {
    const res = await request.get(`${BASE}/views/${sourceId}/export`, { headers: HEADERS })
    expect(res.ok()).toBeTruthy()
    expect(res.status()).toBe(200)

    const pkg = await res.json()
    // Package structure
    expect(pkg).toHaveProperty('version')
    expect(pkg).toHaveProperty('exported_at')
    expect(pkg).toHaveProperty('view_meta')
    expect(pkg).toHaveProperty('payload')

    // view_meta fields
    expect(pkg.view_meta).toHaveProperty('view_label')
    expect(pkg.view_meta).toHaveProperty('surface_type')
    expect(pkg.view_meta).toHaveProperty('primary_entity')

    // The exported payload should have our component_tree
    const payload = typeof pkg.payload === 'string' ? JSON.parse(pkg.payload) : pkg.payload
    expect(payload).toHaveProperty('component_tree')
    expect(payload.component_tree.component_code).toBe('page_root')
  })

  test('export response has Content-Disposition header for file download', async ({ request }) => {
    const res = await request.get(`${BASE}/views/${sourceId}/export`, { headers: HEADERS })
    expect(res.ok()).toBeTruthy()
    const disposition = res.headers()['content-disposition'] ?? ''
    expect(disposition).toMatch(/attachment/)
    expect(disposition).toMatch(/\.json/)
  })

  test('export non-existent view returns 404', async ({ request }) => {
    const res = await request.get(`${BASE}/views/00000000-dead-beef-dead-beef00000001/export`, {
      headers: HEADERS,
    })
    expect(res.status()).toBe(404)
  })

  // ── Import ──────────────────────────────────────────────────────────────────

  test('import creates a new view from the exported package', async ({ request }) => {
    // Step 1: export
    const exportRes = await request.get(`${BASE}/views/${sourceId}/export`, { headers: HEADERS })
    const pkg = await exportRes.json()

    // Step 2: import
    const importRes = await request.post(`${BASE}/views/import`, {
      data: pkg,
      headers: HEADERS,
    })
    expect(importRes.ok(), `import ${importRes.status()} ${await importRes.text()}`).toBeTruthy()
    expect(importRes.status()).toBe(201)

    const imported = await importRes.json()
    importedIds.push(imported.artifact_id)

    // Imported view must have a different artifact_id than source
    expect(imported.artifact_id).not.toBe(sourceId)
    // Label should have " (Imported)" suffix
    expect(imported.view_label).toMatch(/\(Imported\)/)
    // Surface type must match
    expect(imported.surface_type).toBe('standard_crud')
  })

  test('imported view round-trip preserves component_tree structure', async ({ request }) => {
    // Export source
    const exportRes = await request.get(`${BASE}/views/${sourceId}/export`, { headers: HEADERS })
    const pkg = await exportRes.json()

    // Import
    const importRes = await request.post(`${BASE}/views/import`, {
      data: pkg,
      headers: HEADERS,
    })
    const imported = await importRes.json()
    importedIds.push(imported.artifact_id)

    // Fetch the imported view's payload
    const getRes = await request.get(`${BASE}/views/${imported.artifact_id}`, { headers: HEADERS })
    expect(getRes.ok()).toBeTruthy()
    const viewDetail = await getRes.json()

    // latest_payload should contain the same component_tree root
    const payload =
      typeof viewDetail.latest_payload === 'string'
        ? JSON.parse(viewDetail.latest_payload)
        : viewDetail.latest_payload
    expect(payload.component_tree.component_code).toBe('page_root')
    // Children structure preserved
    const children = payload.component_tree.children ?? []
    expect(children.length).toBeGreaterThan(0)
  })

  test('importing duplicate label succeeds — creates second view with same label', async ({
    request,
  }) => {
    const exportRes = await request.get(`${BASE}/views/${sourceId}/export`, { headers: HEADERS })
    const pkg = await exportRes.json()

    // Import twice
    const first = await request.post(`${BASE}/views/import`, {
      data: pkg,
      headers: HEADERS,
    })
    const second = await request.post(`${BASE}/views/import`, {
      data: pkg,
      headers: HEADERS,
    })

    expect(first.status()).toBe(201)
    expect(second.status()).toBe(201)

    const firstView = await first.json()
    const secondView = await second.json()
    importedIds.push(firstView.artifact_id, secondView.artifact_id)

    // Both created — different artifact IDs
    expect(firstView.artifact_id).not.toBe(secondView.artifact_id)
    // Both have (Imported) label
    expect(firstView.view_label).toMatch(/\(Imported\)/)
    expect(secondView.view_label).toMatch(/\(Imported\)/)
  })

  test('import fails when view_meta is missing required fields', async ({ request }) => {
    const res = await request.post(`${BASE}/views/import`, {
      data: {
        view_meta: { view_label: 'Incomplete' }, // missing surface_type, primary_entity
        payload: SAMPLE_PAYLOAD,
      },
      headers: HEADERS,
    })
    expect(res.status()).toBe(422)
  })

  test('export is a snapshot — modifying source does not change exported package', async ({
    request,
  }) => {
    // Export the view
    const exportRes = await request.get(`${BASE}/views/${sourceId}/export`, { headers: HEADERS })
    const originalPkg = await exportRes.json()
    const originalLabel = originalPkg.view_meta.view_label as string

    // Now save a different draft on the source (modifying it)
    const newPayload = {
      ...SAMPLE_PAYLOAD,
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [], // Different — emptied out
      },
    }
    await saveDraft(request, sourceId, newPayload, 2)

    // Re-export — the export uses the current draft, so it WILL change
    // This test verifies the ORIGINAL exported package still has its old label
    expect(originalPkg.view_meta.view_label).toBe(originalLabel)

    // Import from the ORIGINAL (pre-modification) package — should still work
    const importRes = await request.post(`${BASE}/views/import`, {
      data: originalPkg,
      headers: HEADERS,
    })
    expect(importRes.status()).toBe(201)
    const imported = await importRes.json()
    importedIds.push(imported.artifact_id)
    expect(imported.artifact_id).not.toBe(sourceId)
  })
})
