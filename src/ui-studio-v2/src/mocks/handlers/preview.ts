// Phase 4 §6 — MSW handler: Preview (cascade resolution for preview-as-scope)
// Runs REAL resolveCascade + deriveOrigin from domain.
import { http, HttpResponse } from "msw"
import { API_BASE_URL } from "@/shared/config"
import type { CascadeLevel, MetaNode, NodeBase } from "@/domain/types"
import { resolveCascade, deriveOrigin } from "@/domain/cascade"
import type { ResolvedNode } from "@/services/interfaces"
import { getNodesForScope, applyLatency, shouldError } from "@/mocks/store"

// Walks page→views→sections→components→children and layoutRef refs, collecting
// every logicalKey reachable from pageKey. Used to filter the resolved model to a
// single page so the canvas does not render multiple pages simultaneously.
function collectPageDescendants(
  pageKey: string,
  nodesByKey: Map<string, ResolvedNode>,
): Set<string> {
  const included = new Set<string>()
  const REF_FIELDS = ["views", "sections", "components", "children"]

  function visit(key: string): void {
    if (included.has(key)) return
    const node = nodesByKey.get(key)
    if (!node) return
    included.add(key)
    const data = node.data as Record<string, unknown>
    for (const field of REF_FIELDS) {
      const val = data[field]
      if (Array.isArray(val)) {
        for (const ref of val) {
          if (typeof ref === "string") visit(ref)
        }
      }
    }
    const layoutRef = data.layoutRef
    if (typeof layoutRef === "string") visit(layoutRef)
  }

  visit(pageKey)
  return included
}

export const previewHandlers = [
  http.post(`${API_BASE_URL}/preview/resolve`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as {
      pageId?: string
      previewScopeId?: string
      editingLevel?: CascadeLevel
    }
    const pageId = body.pageId ?? ""
    const previewScopeId = body.previewScopeId ?? "automotive"

    const layeredNodes = getNodesForScope(previewScopeId)
    const { resolved } = resolveCascade(layeredNodes)

    const editingLevel: CascadeLevel = body.editingLevel ?? "vertical"

    const allMap = new Map<string, NodeBase>()
    for (const n of resolved) allMap.set(n.logicalKey, n)

    const allNodes: ResolvedNode[] = resolved
      .filter((n): n is MetaNode => "kind" in n)
      .map((n) => ({
        logicalKey: n.logicalKey,
        kind: n.kind,
        cascadeLevel: n.cascadeLevel,
        originState: deriveOrigin(n, editingLevel, allMap),
        data: { ...n } as Record<string, unknown>,
      }))

    // When a specific page is requested, return only that page's nodes.
    // An empty pageId means "return everything" (used by preview mode with no page filter).
    let nodes = allNodes
    if (pageId) {
      const nodesByKey = new Map(allNodes.map((n) => [n.logicalKey, n]))
      const included = collectPageDescendants(pageId, nodesByKey)
      nodes = allNodes.filter((n) => included.has(n.logicalKey))
    }

    return HttpResponse.json({
      pageId,
      scopeId: previewScopeId,
      nodes,
    })
  }),
]
