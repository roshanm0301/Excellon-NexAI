import { http, HttpResponse } from 'msw'

const OVERLAY_KEY = 'msw_overlays'

interface OverlayRecord {
  id: string
  layer: string
  artifact_type: string
  artifact_key: string
  scope_key: string
  delta: Record<string, unknown>
  created_at: string
  created_by: string
}

function loadOverlays(): OverlayRecord[] {
  try {
    const raw = localStorage.getItem(OVERLAY_KEY)
    if (raw) return JSON.parse(raw) as OverlayRecord[]
  } catch { /* ignore */ }
  return []
}

function saveOverlays(overlays: OverlayRecord[]) {
  try { localStorage.setItem(OVERLAY_KEY, JSON.stringify(overlays)) } catch { /* ignore */ }
}

const overlayStore: OverlayRecord[] = loadOverlays()

function now() { return new Date().toISOString() }
function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export const overlayHandlers = [
  http.get('/api/v1/overlays', ({ request }) => {
    const url = new URL(request.url)
    const artifactKey = url.searchParams.get('artifact_key')
    let items = overlayStore
    if (artifactKey) items = items.filter(o => o.artifact_key === artifactKey)
    return HttpResponse.json({ items, total: items.length })
  }),

  http.post('/api/v1/overlays', async ({ request }) => {
    const body = await request.json() as Omit<OverlayRecord, 'id' | 'created_at' | 'created_by'>
    const newOverlay: OverlayRecord = {
      id: randomId(),
      layer: body.layer,
      artifact_type: body.artifact_type,
      artifact_key: body.artifact_key,
      scope_key: body.scope_key ?? 'global',
      delta: body.delta ?? {},
      created_at: now(),
      created_by: 'user',
    }
    overlayStore.push(newOverlay)
    saveOverlays(overlayStore)
    return HttpResponse.json(newOverlay, { status: 201 })
  }),

  http.delete('/api/v1/overlays/:id', ({ params }) => {
    const idx = overlayStore.findIndex(o => o.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    overlayStore.splice(idx, 1)
    saveOverlays(overlayStore)
    return new HttpResponse(null, { status: 204 })
  }),
]
