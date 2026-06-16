import { APIRequestContext } from '@playwright/test'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const BASE = '/api/v1/studio'

const DEV_HEADERS = {
  'x-tenant-id': TENANT_ID,
  'x-user-id': '00000000-0000-0000-0000-000000000001',
  'x-role': 'admin',
  'Content-Type': 'application/json',
}

export interface CreateViewOptions {
  name: string
  surface_type: string
  description?: string
}

export async function createView(request: APIRequestContext, opts: CreateViewOptions) {
  const res = await request.post(`${BASE}/views`, {
    data: { name: opts.name, surface_type: opts.surface_type, description: opts.description ?? '' },
    headers: DEV_HEADERS,
  })
  if (!res.ok()) throw new Error(`createView failed: ${res.status()} ${await res.text()}`)
  return res.json() as Promise<{ id: string; name: string }>
}

export async function deleteView(request: APIRequestContext, viewId: string) {
  const res = await request.delete(`${BASE}/views/${viewId}`, { headers: DEV_HEADERS })
  // 404 is fine — may already be gone
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`deleteView failed: ${res.status()}`)
  }
}

export async function saveDraft(request: APIRequestContext, viewId: string, payload: object, revision: number) {
  const res = await request.put(`${BASE}/views/${viewId}/draft`, {
    data: { payload, revision },
    headers: DEV_HEADERS,
  })
  if (!res.ok()) throw new Error(`saveDraft failed: ${res.status()} ${await res.text()}`)
  return res.json()
}

export async function publishView(request: APIRequestContext, viewId: string, revision: number) {
  const res = await request.post(`${BASE}/views/${viewId}/publish`, {
    data: { revision },
    headers: DEV_HEADERS,
  })
  return { ok: res.ok(), status: res.status(), body: await res.json() }
}

export async function listViews(request: APIRequestContext) {
  const res = await request.get(`${BASE}/views`, { headers: DEV_HEADERS })
  if (!res.ok()) throw new Error(`listViews failed: ${res.status()}`)
  return res.json() as Promise<{ items: Array<{ id: string; name: string }> }>
}
