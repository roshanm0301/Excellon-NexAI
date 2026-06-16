import { test, expect } from '@playwright/test'

const HEADERS = {
  'x-tenant-id': '00000000-0000-0000-0000-000000000001',
  'x-user-id': '00000000-0000-0000-0000-000000000001',
  'x-role': 'admin',
  'Content-Type': 'application/json',
}
const BASE = '/api/v1/studio'

// Creates a minimal view, returns artifact_id. Callers must archive it when done.
async function makeView(request: import('@playwright/test').APIRequestContext, label: string): Promise<string> {
  const res = await request.post(`${BASE}/views`, {
    data: {
      view_label: label,
      surface_type: 'standard_crud',
      primary_entity: 'vehicle',
    },
    headers: HEADERS,
  })
  expect(res.ok(), `createView status ${res.status()}`).toBeTruthy()
  const view = await res.json()
  return view.artifact_id
}

async function validateWithPayload(
  request: import('@playwright/test').APIRequestContext,
  viewId: string,
  payload: object,
) {
  return request.post(`${BASE}/views/${viewId}/validate`, {
    data: { payload },
    headers: HEADERS,
  })
}

async function archiveView(request: import('@playwright/test').APIRequestContext, viewId: string) {
  await request.delete(`${BASE}/views/${viewId}`, { headers: HEADERS })
}

test.describe('Publish validation — V001 through V007', () => {
  let viewId: string

  test.beforeEach(async ({ request }) => {
    viewId = await makeView(request, `Validation Test ${Date.now()}`)
  })

  test.afterEach(async ({ request }) => {
    if (viewId) await archiveView(request, viewId)
  })

  // ── V001: payload must have component_tree ──────────────────────────────────

  test('V001 — null component_tree triggers error', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {})
    expect(res.status()).toBe(422)
    const body = await res.json()
    const codes: string[] = (body.errors ?? []).map((e: { code: string }) => e.code)
    expect(codes).toContain('V001')
  })

  test('V001 — empty root component_code triggers error', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {
      component_tree: { component_key: 'root', component_code: '' },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    const codes: string[] = (body.errors ?? []).map((e: { code: string }) => e.code)
    expect(codes.some(c => c === 'V001' || c === 'V003')).toBeTruthy()
  })

  // ── V002: root must be page_root ────────────────────────────────────────────

  test('V002 — non-page_root root component triggers error', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {
      component_tree: {
        component_key: 'root',
        component_code: 'button',
        children: [],
      },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    const codes: string[] = (body.errors ?? []).map((e: { code: string }) => e.code)
    expect(codes).toContain('V002')
  })

  // ── V003: all nodes need non-empty component_code + unique keys ─────────────

  test('V003 — child node with empty component_code triggers error', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [
          { component_key: 'child1', component_code: '' },
        ],
      },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    const codes: string[] = (body.errors ?? []).map((e: { code: string }) => e.code)
    expect(codes).toContain('V003')
  })

  test('V003 — duplicate component keys trigger error', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [
          { component_key: 'dup', component_code: 'button', props: { label: 'A' } },
          { component_key: 'dup', component_code: 'button', props: { label: 'B' } },
        ],
      },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    const codes: string[] = (body.errors ?? []).map((e: { code: string }) => e.code)
    expect(codes).toContain('V003')
  })

  // ── V004: tree depth <= 20 ──────────────────────────────────────────────────

  test('V004 — tree depth exceeding 20 levels triggers error', async ({ request }) => {
    // Build a 22-level deep chain: root → child → child → ... (21 nestings)
    let node: object = { component_key: 'leaf', component_code: 'button', props: { label: 'Deep' } }
    for (let i = 20; i >= 1; i--) {
      node = { component_key: `level${i}`, component_code: 'toolbar', children: [node] }
    }
    const res = await validateWithPayload(request, viewId, {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [node],
      },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    const codes: string[] = (body.errors ?? []).map((e: { code: string }) => e.code)
    expect(codes).toContain('V004')
  })

  // ── V005: component_code must be snake_case ─────────────────────────────────

  test('V005 — PascalCase component_code triggers error', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [
          { component_key: 'btn1', component_code: 'BadName-Component' },
        ],
      },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    const codes: string[] = (body.errors ?? []).map((e: { code: string }) => e.code)
    expect(codes).toContain('V005')
  })

  // ── V006: input components must have label (warning, not error) ─────────────

  test('V006 — text_input without label triggers warning (200)', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [
          {
            component_key: 'inp1',
            component_code: 'text_input',
            props: { placeholder: 'No label here' },
          },
        ],
      },
    })
    // V006 is a warning — response is 200 with warnings array
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.errors).toHaveLength(0)
    const warnCodes: string[] = (body.warnings ?? []).map((w: { code: string }) => w.code)
    expect(warnCodes).toContain('V006')
  })

  // ── V007: label placeholder text triggers warning ───────────────────────────

  test('V007 — button label with TODO text triggers warning (200)', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [
          {
            component_key: 'btn1',
            component_code: 'button',
            props: { label: 'TODO: fix this label' },
          },
        ],
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const warnCodes: string[] = (body.warnings ?? []).map((w: { code: string }) => w.code)
    expect(warnCodes).toContain('V007')
  })

  test('V007 — button label with TRANSLATE placeholder triggers warning (200)', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [
          {
            component_key: 'btn1',
            component_code: 'button',
            props: { label: '[TRANSLATE] Submit' },
          },
        ],
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    const warnCodes: string[] = (body.warnings ?? []).map((w: { code: string }) => w.code)
    expect(warnCodes).toContain('V007')
  })

  // ── Valid payload — no errors ───────────────────────────────────────────────

  test('valid payload passes validation with no errors', async ({ request }) => {
    const res = await validateWithPayload(request, viewId, {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [
          {
            component_key: 'btn_submit',
            component_code: 'button',
            props: { label: 'Submit Vehicle', variant: 'primary' },
            events: [
              { event_type: 'on_click', action_type: 'navigate', target: '/vehicles' },
            ],
          },
          {
            component_key: 'inp_make',
            component_code: 'text_input',
            props: { label: 'Vehicle Make', placeholder: 'e.g. Toyota' },
          },
        ],
      },
      data_sources: [{ key: 'vehicles', entity: 'vehicle', type: 'list' }],
      events: [],
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.errors).toHaveLength(0)
  })

  // ── Fallback: validate uses current draft if no payload in body ─────────────

  test('validate without body uses the saved draft', async ({ request }) => {
    // Save a valid draft first
    const draftRes = await request.put(`${BASE}/views/${viewId}/draft`, {
      data: {
        payload: {
          component_tree: {
            component_key: 'root',
            component_code: 'page_root',
            children: [],
          },
        },
        revision: 1,
      },
      headers: HEADERS,
    })
    expect(draftRes.ok()).toBeTruthy()

    // Validate without sending a payload body — falls back to the draft
    const res = await request.post(`${BASE}/views/${viewId}/validate`, {
      data: {},
      headers: HEADERS,
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('errors')
  })
})
