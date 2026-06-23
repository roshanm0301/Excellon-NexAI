// Phase 4 §5 — RegistryService HTTP implementation

import { apiFetch } from "./client"
import { SearchResponseSchema, TypeShapeSchema } from "@/services/schemas"
import type { RegistryService } from "@/services/interfaces"

export function createRegistryService(): RegistryService {
  return {
    search: (query) =>
      apiFetch({
        path: `/registry/search?q=${encodeURIComponent(query)}`,
        schema: SearchResponseSchema,
      }),

    shape: (ref) =>
      apiFetch({
        path: `/registry/shape/${encodeURIComponent(ref)}`,
        schema: TypeShapeSchema,
      }),
  }
}
