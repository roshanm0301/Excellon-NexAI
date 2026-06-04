import { http, HttpResponse } from 'msw'
import { seedWorkflows } from '../data/workflowBuilderData'
import type { WorkflowArtifact } from '../../types/workflowBuilder'

const STORE_KEY = 'msw_workflows'
const TENANT = '00000000-0000-0000-0000-000000000001'

function loadStore(): WorkflowArtifact[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as WorkflowArtifact[]
  } catch { /* ignore */ }
  return seedWorkflows.map(w => ({ ...w }))
}

function saveStore(s: WorkflowArtifact[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

const store: WorkflowArtifact[] = loadStore()

function now() { return new Date().toISOString() }

function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function findWorkflow(id: string): WorkflowArtifact | undefined {
  return store.find(w => w.version_id === id || w.artifact_id === id)
}

function findIndex(id: string): number {
  return store.findIndex(w => w.version_id === id || w.artifact_id === id)
}

export const workflowHandlers = [
  // GET /api/v1/workflows — list with optional ?status= and ?entity= filters
  http.get('/api/v1/workflows', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const entity = url.searchParams.get('entity')

    let items = store.filter(w => w.artifact_type === 'workflow_builder')

    if (status === 'draft') {
      items = items.filter(w => w.is_draft)
    } else if (status === 'published') {
      items = items.filter(w => !w.is_draft && w.is_active)
    }

    if (entity) {
      items = items.filter(w => w.artifact_name === entity)
    }

    return HttpResponse.json({ items, total: items.length })
  }),

  // POST /api/v1/workflows — create new workflow artifact
  http.post('/api/v1/workflows', async ({ request }) => {
    const body = await request.json() as {
      artifact_name?: string
      artifact_type?: string
      payload?: WorkflowArtifact['payload']
    }

    const versionId = randomId()
    const artifactId = randomId()

    const newWorkflow: WorkflowArtifact = {
      version_id: versionId,
      artifact_id: artifactId,
      version_no: 1,
      artifact_name: body.artifact_name ?? '',
      artifact_type: 'workflow_builder',
      tenant_id: TENANT,
      payload: body.payload ?? { sequence: [], properties: {} },
      is_active: false,
      is_draft: true,
      created_by: TENANT,
      created_at: now(),
      id: versionId,
      entity_type: body.artifact_name ?? '',
    }

    store.push(newWorkflow)
    saveStore(store)
    return HttpResponse.json(newWorkflow, { status: 201 })
  }),

  // GET /api/v1/workflows/:id — get by id
  http.get('/api/v1/workflows/:id', ({ params }) => {
    const workflow = findWorkflow(params.id as string)
    if (!workflow) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(workflow)
  }),

  // PUT /api/v1/workflows/:id/draft — save draft (update payload)
  http.put('/api/v1/workflows/:id/draft', async ({ params, request }) => {
    const idx = findIndex(params.id as string)
    if (idx === -1) return new HttpResponse(null, { status: 404 })

    const body = await request.json() as { payload: WorkflowArtifact['payload'] }
    store[idx] = { ...store[idx], payload: body.payload, is_draft: true }
    saveStore(store)
    return HttpResponse.json(store[idx])
  }),

  // POST /api/v1/workflows/:id/publish — mark as published
  http.post('/api/v1/workflows/:id/publish', ({ params }) => {
    const idx = findIndex(params.id as string)
    if (idx === -1) return new HttpResponse(null, { status: 404 })

    store[idx] = {
      ...store[idx],
      is_draft: false,
      is_active: true,
      published_at: now(),
      published_by: TENANT,
    }
    saveStore(store)
    return HttpResponse.json(store[idx])
  }),

  // DELETE /api/v1/workflows/:id — delete
  http.delete('/api/v1/workflows/:id', ({ params }) => {
    const idx = findIndex(params.id as string)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    store.splice(idx, 1)
    saveStore(store)
    return new HttpResponse(null, { status: 204 })
  }),
]
