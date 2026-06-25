// Phase 4 §6 — MSW handler: Metadata (tree, node CRUD)
import { http, HttpResponse } from "msw"
import { API_BASE_URL } from "@/shared/config"
import { deriveOrigin } from "@/domain/cascade"
import type { CascadeLevel, NodeBase, MetaNode } from "@/domain/types"
import type { PageArchetype } from "@/domain/types"
import type { TreeNode } from "@/services/interfaces"
import {
  getStore,
  getNodesForScope,
  getNodeById,
  addNode,
  applyLatency,
  shouldError,
} from "@/mocks/store"
import { buildPageScaffold } from "./page-scaffold"
import { toCamelCase } from "@/shared/lib/utils"

function buildTreeNodes(
  nodes: NodeBase[],
  editingLevel: CascadeLevel,
): TreeNode[] {
  const allNodesMap = new Map<string, NodeBase>()
  for (const n of nodes) {
    allNodesMap.set(n.logicalKey, n)
  }

  const treeNodes: TreeNode[] = []
  for (const node of nodes) {
    if (!("kind" in node)) continue
    const metaNode = node as MetaNode
    const origin = deriveOrigin(node, editingLevel, allNodesMap)

    treeNodes.push({
      id: node.id,
      logicalKey: node.logicalKey,
      kind: metaNode.kind,
      label: "name" in metaNode ? (metaNode as Record<string, unknown>).name as string : node.logicalKey,
      cascadeLevel: node.cascadeLevel,
      originState: origin,
      parentKey: null,
      children: [],
    })
  }

  return buildHierarchy(treeNodes)
}

function buildHierarchy(flat: TreeNode[]): TreeNode[] {
  const byKey = new Map<string, TreeNode>()
  for (const n of flat) byKey.set(n.logicalKey, n)

  const roots: TreeNode[] = []
  for (const node of flat) {
    const parts = node.logicalKey.split(".")
    if (parts.length <= 1) {
      roots.push(node)
      continue
    }

    let placed = false
    for (let i = parts.length - 1; i > 0; i--) {
      const parentKey = parts.slice(0, i).join(".")
      const parent = byKey.get(parentKey)
      if (parent) {
        node.parentKey = parentKey
        parent.children.push(node)
        placed = true
        break
      }
    }
    if (!placed) roots.push(node)
  }

  return roots
}

interface AppRecord {
  id: string
  name: string
  vertical: string
  description: string
  createdAt: string
  modifiedAt: string
}

const apps: AppRecord[] = [
  {
    id: "dms-app",
    name: "DMS Application",
    vertical: "automotive",
    description: "Dealership Management System",
    createdAt: "2025-01-01T00:00:00.000Z",
    modifiedAt: "2025-06-01T00:00:00.000Z",
  },
]

export const metadataHandlers = [
  http.get(`${API_BASE_URL}/metadata/apps`, async () => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
    return HttpResponse.json(apps)
  }),

  http.post(`${API_BASE_URL}/metadata/apps`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as { name: string; vertical: string; description?: string }
    const now = new Date().toISOString()
    const id = `app-${Date.now()}`
    const record: AppRecord = {
      id,
      name: body.name,
      vertical: body.vertical,
      description: body.description ?? "",
      createdAt: now,
      modifiedAt: now,
    }
    apps.push(record)

    const appNode: MetaNode = {
      id,
      logicalKey: id,
      cascadeLevel: "vertical",
      objectVersion: 1,
      audit: { createdBy: "mock-user", createdAt: now, modifiedBy: "mock-user", modifiedAt: now },
      kind: "application",
      name: body.name,
      children: [],
    } as MetaNode
    addNode(appNode)

    return HttpResponse.json(record, { status: 201 })
  }),

  http.get(`${API_BASE_URL}/metadata/tree`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const url = new URL(request.url)
    const scopeId = url.searchParams.get("scopeId") ?? ""
    const editingLevel = (url.searchParams.get("editingLevel") ?? "vertical") as CascadeLevel

    const layeredNodes = getNodesForScope(scopeId)
    const allNodes: NodeBase[] = []
    for (const [, nodes] of layeredNodes) {
      allNodes.push(...nodes)
    }

    const tree = buildTreeNodes(allNodes, editingLevel)
    return HttpResponse.json(tree)
  }),

  http.get(`${API_BASE_URL}/metadata/nodes/:id`, async ({ params }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const id = params.id as string
    const node = getNodeById(id)
    if (!node) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 })
    }
    return HttpResponse.json(node)
  }),

  http.post(`${API_BASE_URL}/metadata/nodes`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const now = new Date().toISOString()
    const newNode: MetaNode = {
      id: `uuid-gen-${Date.now()}`,
      logicalKey: body.logicalKey as string,
      cascadeLevel: body.cascadeLevel as CascadeLevel,
      objectVersion: 1,
      audit: {
        createdBy: "mock-user",
        createdAt: now,
        modifiedBy: "mock-user",
        modifiedAt: now,
      },
      kind: body.kind as MetaNode["kind"],
      ...(body.data as Record<string, unknown>),
    } as MetaNode

    addNode(newNode)
    return HttpResponse.json(newNode, { status: 201 })
  }),

  http.post(`${API_BASE_URL}/metadata/pages`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as {
      appId?: string
      moduleKey?: string
      title?: string
      archetype?: PageArchetype
      entityRef?: string
      cascadeLevel?: CascadeLevel
    }

    const title = body.title ?? "Untitled Page"
    const archetype = body.archetype ?? "list-report"
    const moduleKey = body.moduleKey ?? ""
    const cascadeLevel: CascadeLevel = body.cascadeLevel ?? "vertical"
    const entityRef = body.entityRef
    const slug = toCamelCase(title)

    const now = new Date().toISOString()
    const audit = {
      createdBy: "mock-user",
      createdAt: now,
      modifiedBy: "mock-user",
      modifiedAt: now,
    }

    const scaffoldNodes = buildPageScaffold(slug, title, archetype, entityRef, cascadeLevel, audit)
    for (const n of scaffoldNodes) {
      addNode(n)
    }

    // Link the new page into the parent module's pages array
    if (moduleKey) {
      const moduleNode = getStore().nodes.get(`${moduleKey}:vertical`)
        ?? getStore().nodes.get(`${moduleKey}:${cascadeLevel}`)
      if (moduleNode && "kind" in moduleNode && (moduleNode as MetaNode & { kind: string }).kind === "module") {
        const mod = moduleNode as MetaNode & { pages?: string[] }
        const updatedModule = {
          ...mod,
          pages: [...(mod.pages ?? []), `page.${slug}`],
        }
        addNode(updatedModule as NodeBase)
      }
    }

    const pageNode = scaffoldNodes[scaffoldNodes.length - 1] as MetaNode
    return HttpResponse.json(pageNode, { status: 201 })
  }),

  http.post(`${API_BASE_URL}/metadata/nodes/:logicalKey/override`, async ({ params, request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const logicalKey = params.logicalKey as string
    const body = (await request.json()) as { level: CascadeLevel; ops: unknown[] }
    const now = new Date().toISOString()

    const overrideNode: NodeBase = {
      id: `uuid-ovr-${Date.now()}`,
      logicalKey: `${logicalKey}.override`,
      cascadeLevel: body.level,
      overrideOf: logicalKey,
      overrideOps: body.ops as NodeBase["overrideOps"],
      objectVersion: 1,
      audit: {
        createdBy: "mock-user",
        createdAt: now,
        modifiedBy: "mock-user",
        modifiedAt: now,
      },
    }

    addNode(overrideNode)

    const existing = getNodeById(logicalKey) ?? getStore().nodes.get(`${logicalKey}:vertical`)
    const result = existing ? { ...existing, ...overrideNode } : overrideNode
    return HttpResponse.json(result, { status: 201 })
  }),
]
