import { http, HttpResponse } from 'msw'
import type { NodeTreeItem } from '../../config/studioApi'
import { seedNodes } from '../data/nodes'

const NODE_KEY = 'msw_nodes'

function loadNodes(): NodeTreeItem[] {
  try {
    const raw = localStorage.getItem(NODE_KEY)
    if (raw) return JSON.parse(raw) as NodeTreeItem[]
  } catch { /* ignore */ }
  return seedNodes.map(n => ({ ...n }))
}

function saveNodes(nodes: NodeTreeItem[]) {
  try { localStorage.setItem(NODE_KEY, JSON.stringify(nodes)) } catch { /* ignore */ }
}

const nodeStore: NodeTreeItem[] = loadNodes()

function now() { return new Date().toISOString() }

function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function buildTree(flat: NodeTreeItem[]): NodeTreeItem[] {
  const map = new Map<string, NodeTreeItem>()
  const roots: NodeTreeItem[] = []
  flat.forEach(n => map.set(n.id, { ...n, children: [] }))
  map.forEach(node => {
    if (node.parent_id) {
      const parent = map.get(node.parent_id)
      if (parent) { parent.children = parent.children ?? []; parent.children.push(node) }
      else roots.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

export const nodeHandlers = [
  http.get('/api/v1/admin/nodes', () => {
    return HttpResponse.json({ items: buildTree(nodeStore) })
  }),

  http.get('/api/v1/nodes', () => {
    return HttpResponse.json({ items: buildTree(nodeStore) })
  }),

  http.post('/api/v1/admin/nodes', async ({ request }) => {
    const body = await request.json() as Omit<NodeTreeItem, 'id' | 'children'>
    const newNode: NodeTreeItem = {
      id: randomId(),
      name: body.name,
      node_type: body.node_type,
      parent_id: body.parent_id,
      metadata: body.metadata ?? {},
      children: [],
    }
    nodeStore.push(newNode)
    saveNodes(nodeStore)
    return HttpResponse.json(newNode, { status: 201 })
  }),

  http.post('/api/v1/nodes', async ({ request }) => {
    const body = await request.json() as Omit<NodeTreeItem, 'id' | 'children'>
    const newNode: NodeTreeItem = {
      id: randomId(),
      name: body.name,
      node_type: body.node_type,
      parent_id: body.parent_id,
      metadata: body.metadata ?? {},
      children: [],
    }
    nodeStore.push(newNode)
    saveNodes(nodeStore)
    return HttpResponse.json(newNode, { status: 201 })
  }),

  http.put('/api/v1/nodes/:id', async ({ params, request }) => {
    const idx = nodeStore.findIndex(n => n.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const body = await request.json() as Partial<NodeTreeItem>
    nodeStore[idx] = { ...nodeStore[idx], ...body, id: nodeStore[idx].id }
    saveNodes(nodeStore)
    return HttpResponse.json(nodeStore[idx])
  }),

  http.delete('/api/v1/nodes/:id', ({ params }) => {
    const idx = nodeStore.findIndex(n => n.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    nodeStore.splice(idx, 1)
    saveNodes(nodeStore)
    return new HttpResponse(null, { status: 204 })
  }),
]

// Suppress unused import warning
void now
