// Phase 4 §5 — MetadataService HTTP implementation

import { apiFetch } from "./client"
import { GetTreeResponseSchema, MetaNodeResponseSchema } from "@/services/schemas"
import type { MetadataService } from "@/services/interfaces"

export function createMetadataService(): MetadataService {
  return {
    getTree: (params) =>
      apiFetch({
        path: `/metadata/tree?env=${encodeURIComponent(params.env)}&appId=${encodeURIComponent(params.appId)}&editingLevel=${encodeURIComponent(params.editingLevel)}&scopeId=${encodeURIComponent(params.scopeId)}`,
        schema: GetTreeResponseSchema,
      }),

    getNode: (id) =>
      apiFetch({
        path: `/metadata/nodes/${encodeURIComponent(id)}`,
        schema: MetaNodeResponseSchema,
      }),

    createNode: (input) =>
      apiFetch({
        method: "POST",
        path: "/metadata/nodes",
        body: input,
        schema: MetaNodeResponseSchema,
      }),

    overrideNode: (params) =>
      apiFetch({
        method: "POST",
        path: `/metadata/nodes/${encodeURIComponent(params.logicalKey)}/override`,
        body: { level: params.level, ops: params.ops },
        schema: MetaNodeResponseSchema,
      }),
  }
}
