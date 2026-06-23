// Phase 4 §5 — PreviewService HTTP implementation

import { apiFetch } from "./client"
import { ResolvedModelSchema } from "@/services/schemas"
import type { PreviewService } from "@/services/interfaces"

export function createPreviewService(): PreviewService {
  return {
    resolve: (params) =>
      apiFetch({
        method: "POST",
        path: "/preview/resolve",
        body: params,
        schema: ResolvedModelSchema,
      }),
  }
}
