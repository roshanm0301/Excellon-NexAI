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
  view_label: string
  surface_type: string
  primary_entity: string
  view_code?: string
}

export async function createView(request: APIRequestContext, opts: CreateViewOptions) {
  const res = await request.post(`${BASE}/views`, {
    data: {
      view_label: opts.view_label,
      surface_type: opts.surface_type,
      primary_entity: opts.primary_entity,
      view_code: opts.view_code,
    },
    headers: DEV_HEADERS,
  })
  if (!res.ok()) throw new Error(`createView failed: ${res.status()} ${await res.text()}`)
  return res.json() as Promise<{ artifact_id: string; view_label: string; revision: number }>
}

export async function deleteView(request: APIRequestContext, viewId: string) {
  const res = await request.delete(`${BASE}/views/${viewId}`, { headers: DEV_HEADERS })
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

export async function publishView(request: APIRequestContext, viewId: string, changelog?: string) {
  const res = await request.post(`${BASE}/views/${viewId}/publish`, {
    data: { changelog: changelog ?? 'Published from integration test' },
    headers: DEV_HEADERS,
  })
  return { ok: res.ok(), status: res.status(), body: await res.json() }
}

export async function listViews(request: APIRequestContext) {
  const res = await request.get(`${BASE}/views`, { headers: DEV_HEADERS })
  if (!res.ok()) throw new Error(`listViews failed: ${res.status()}`)
  return res.json() as Promise<{ items: Array<{ artifact_id: string; view_label: string }> }>
}
