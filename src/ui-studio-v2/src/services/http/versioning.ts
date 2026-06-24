import { apiFetch } from "./client"
import {
  VersionsResponseSchema,
  VersionDiffSchema,
  PromoteResultSchema,
} from "@/services/schemas"
import type { VersioningService } from "@/services/interfaces"

export function createVersioningService(): VersioningService {
  return {
    getVersions: (appId) =>
      apiFetch({
        path: `/versioning/${encodeURIComponent(appId)}/versions`,
        schema: VersionsResponseSchema,
      }),

    getDiff: (appId, v1, v2) =>
      apiFetch({
        method: "POST",
        path: `/versioning/${encodeURIComponent(appId)}/diff`,
        body: { v1, v2 },
        schema: VersionDiffSchema,
      }),

    promote: (params) =>
      apiFetch({
        method: "POST",
        path: `/versioning/${encodeURIComponent(params.appId)}/promote`,
        body: params,
        schema: PromoteResultSchema,
      }),

    rollback: (params) =>
      apiFetch({
        method: "POST",
        path: `/versioning/${encodeURIComponent(params.appId)}/rollback`,
        body: params,
        schema: PromoteResultSchema,
      }),
  }
}
