import { http, HttpResponse } from 'msw'
import { seedNodes } from '../data/nodes'

export const nodeHandlers = [
  http.get('/api/v1/admin/nodes', () => {
    return HttpResponse.json({ items: seedNodes })
  }),

  // Also handle the path studioApi uses (/api/v1/nodes)
  http.get('/api/v1/nodes', () => {
    return HttpResponse.json({ items: seedNodes })
  }),
]
