import { http, HttpResponse } from 'msw'
import { seedArtifacts } from '../data/artifacts'
import type { Artifact } from '../../config/studioApi'

// In-memory store (clone seed data so mutations don't affect the original)
const store: Artifact[] = seedArtifacts.map(a => ({ ...a }))

function now() {
  return new Date().toISOString()
}

function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export const artifactHandlers = [
  // GET /api/v1/artifacts
  http.get('/api/v1/artifacts', () => {
    return HttpResponse.json({ items: store, total: store.length })
  }),

  // GET /api/v1/artifacts/:id
  http.get('/api/v1/artifacts/:id', ({ params }) => {
    const artifact = store.find(a => a.id === params.id)
    if (!artifact) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(artifact)
  }),

  // GET /api/v1/artifacts/:id/versions/latest
  http.get('/api/v1/artifacts/:id/versions/latest', ({ params }) => {
    const artifact = store.find(a => a.id === params.id)
    if (!artifact) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(artifact)
  }),

  // POST /api/v1/artifacts
  http.post('/api/v1/artifacts', async ({ request }) => {
    const body = await request.json() as { entity_type: string; payload?: Record<string, unknown> }
    const newArtifact: Artifact = {
      id: randomId(),
      tenant_id: '00000000-0000-0000-0000-000000000001',
      entity_type: body.entity_type,
      version: 1,
      status: 'draft',
      payload: body.payload ?? {},
      created_by: '00000000-0000-0000-0000-000000000001',
      created_at: now(),
      updated_at: now(),
    }
    store.push(newArtifact)
    return HttpResponse.json(newArtifact, { status: 201 })
  }),

  // PUT /api/v1/artifacts/:id
  http.put('/api/v1/artifacts/:id', async ({ params, request }) => {
    const idx = store.findIndex(a => a.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const body = await request.json() as { payload: Record<string, unknown> }
    store[idx] = { ...store[idx], payload: body.payload, updated_at: now() }
    return HttpResponse.json(store[idx])
  }),

  // POST /api/v1/artifacts/:id/versions/:versionNo/publish
  http.post('/api/v1/artifacts/:id/versions/:versionNo/publish', ({ params }) => {
    const idx = store.findIndex(a => a.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store[idx] = { ...store[idx], status: 'published', updated_at: now() }
    return HttpResponse.json(store[idx])
  }),

  // POST /api/v1/artifacts/:id/publish (shorthand used by studioApi)
  http.post('/api/v1/artifacts/:id/publish', ({ params }) => {
    const idx = store.findIndex(a => a.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store[idx] = { ...store[idx], status: 'published', updated_at: now() }
    return HttpResponse.json(store[idx])
  }),

  // DELETE /api/v1/artifacts/:id
  http.delete('/api/v1/artifacts/:id', ({ params }) => {
    const idx = store.findIndex(a => a.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
