// Phase 4 §5 — CompilerService HTTP implementation

import { apiFetch } from "./client"
import {
  ValidateResponseSchema,
  ImpactResponseSchema,
  PublishResultSchema,
} from "@/services/schemas"
import type { CompilerService } from "@/services/interfaces"

export function createCompilerService(): CompilerService {
  return {
    validate: (params) =>
      apiFetch({
        method: "POST",
        path: "/compiler/validate",
        body: params,
        schema: ValidateResponseSchema,
      }),

    impact: (params) =>
      apiFetch({
        method: "POST",
        path: "/compiler/impact",
        body: params,
        schema: ImpactResponseSchema,
      }),

    publish: (params) =>
      apiFetch({
        method: "POST",
        path: "/compiler/publish",
        body: params,
        schema: PublishResultSchema,
      }),
  }
}
