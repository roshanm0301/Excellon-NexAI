import { http, HttpResponse } from 'msw'
import { seedArtifacts } from '../data/artifacts'
import type { Artifact } from '../../config/studioApi'

const STORE_KEY = 'msw_artifacts'
const TENANT = '00000000-0000-0000-0000-000000000001'

function loadStore(): Artifact[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as Artifact[]
  } catch { /* ignore */ }
  return seedArtifacts.map(a => ({ ...a }))
}

function saveStore(s: Artifact[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

const store: Artifact[] = loadStore()

function now() { return new Date().toISOString() }

function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Lookup by version_id (primary) or artifact_id (secondary)
function findArtifact(id: string): Artifact | undefined {
  return store.find(a => a.version_id === id || a.artifact_id === id)
}

function findIndex(id: string): number {
  return store.findIndex(a => a.version_id === id || a.artifact_id === id)
}

export const artifactHandlers = [
  http.get('/api/v1/artifacts', ({ request }) => {
    const url = new URL(request.url)
    const artifactType = url.searchParams.get('artifact_type') ?? url.searchParams.get('entity_type')
    const items = artifactType ? store.filter(a => a.artifact_name === artifactType || a.artifact_type === artifactType) : store
    return HttpResponse.json({ items, total: items.length })
  }),

  http.get('/api/v1/artifacts/:id', ({ params }) => {
    const artifact = findArtifact(params.id as string)
    if (!artifact) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(artifact)
  }),

  http.get('/api/v1/artifacts/:id/versions/latest', ({ params }) => {
    const artifact = findArtifact(params.id as string)
    if (!artifact) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(artifact)
  }),

  http.post('/api/v1/artifacts', async ({ request }) => {
    const body = await request.json() as {
      artifact_name?: string
      artifact_type?: string
      payload?: Record<string, unknown>
    }
    const versionId = randomId()
    const artifactId = randomId()
    const newArtifact: Artifact = {
      version_id: versionId,
      artifact_id: artifactId,
      version_no: 1,
      artifact_name: body.artifact_name ?? '',
      artifact_type: body.artifact_type ?? 'entity_schema',
      tenant_id: TENANT,
      payload: body.payload ?? {},
      is_active: false,
      is_draft: true,
      created_by: TENANT,
      created_at: now(),
      // Convenience accessors
      id: versionId,
      entity_type: body.artifact_name ?? '',
    }
    store.push(newArtifact)
    saveStore(store)
    return HttpResponse.json(newArtifact, { status: 201 })
  }),

  http.put('/api/v1/artifacts/:id', async ({ params, request }) => {
    const idx = findIndex(params.id as string)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const body = await request.json() as { payload: Record<string, unknown> }
    store[idx] = { ...store[idx], payload: body.payload }
    saveStore(store)
    return HttpResponse.json(store[idx])
  }),

  http.post('/api/v1/artifacts/:id/publish', ({ params }) => {
    const idx = findIndex(params.id as string)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store[idx] = { ...store[idx], is_draft: false, is_active: true, published_at: now(), published_by: TENANT }
    saveStore(store)
    return HttpResponse.json(store[idx])
  }),

  http.post('/api/v1/artifacts/:id/versions/:versionNo/publish', ({ params }) => {
    const idx = findIndex(params.id as string)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store[idx] = { ...store[idx], is_draft: false, is_active: true, published_at: now(), published_by: TENANT }
    saveStore(store)
    return HttpResponse.json(store[idx])
  }),

  http.post('/api/v1/artifacts/:id/deprecate', ({ params }) => {
    const idx = findIndex(params.id as string)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store[idx] = { ...store[idx], is_active: false, is_draft: false }
    saveStore(store)
    return HttpResponse.json(store[idx])
  }),

  http.post('/api/v1/artifacts/:id/fork', ({ params }) => {
    const src = findArtifact(params.id as string)
    if (!src) return new HttpResponse(null, { status: 404 })
    const newVersionId = randomId()
    const forked: Artifact = {
      ...src,
      version_id: newVersionId,
      version_no: (src.version_no ?? 1) + 1,
      is_draft: true,
      is_active: false,
      published_at: undefined,
      published_by: undefined,
      created_at: now(),
      id: newVersionId,
    }
    store.push(forked)
    saveStore(store)
    return HttpResponse.json(forked, { status: 201 })
  }),

  http.delete('/api/v1/artifacts/:id', ({ params }) => {
    const idx = findIndex(params.id as string)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.splice(idx, 1)
    saveStore(store)
    return new HttpResponse(null, { status: 204 })
  }),
]
