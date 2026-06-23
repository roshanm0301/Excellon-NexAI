// Phase 4 §6 — MSW handler: Preview (cascade resolution for preview-as-scope)
// Runs REAL resolveCascade + deriveOrigin from domain.
import { http, HttpResponse } from "msw"
import { API_BASE_URL } from "@/shared/config"
import type { CascadeLevel, MetaNode, NodeBase } from "@/domain/types"
import { resolveCascade, deriveOrigin } from "@/domain/cascade"
import type { ResolvedNode } from "@/services/interfaces"
import { getNodesForScope, applyLatency, shouldError } from "@/mocks/store"

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

    const nodes: ResolvedNode[] = resolved
      .filter((n): n is MetaNode => "kind" in n)
      .map((n) => ({
        logicalKey: n.logicalKey,
        kind: n.kind,
        cascadeLevel: n.cascadeLevel,
        originState: deriveOrigin(n, editingLevel, allMap),
        data: { ...n } as Record<string, unknown>,
      }))

    return HttpResponse.json({
      pageId,
      scopeId: previewScopeId,
      nodes,
    })
  }),
]
