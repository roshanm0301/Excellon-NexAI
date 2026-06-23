// Phase 4 §3.2 — query-key factory
// Critical: tree keyed by editingLevel (NOT previewScopeId).
// preview keyed by previewScopeId (NOT editingLevel).
// This ensures cascade-context independence.

import type { CascadeLevel, Env } from "@/domain/types"

export const qk = {
  tree: (env: Env, appId: string, editingLevel: CascadeLevel, scopeId: string) =>
    ["tree", env, appId, editingLevel, scopeId] as const,

  node: (id: string) => ["node", id] as const,

  preview: (
    env: Env,
    appId: string,
    pageId: string,
    previewScopeId: string,
    role?: string,
  ) => ["preview", env, appId, pageId, previewScopeId, role] as const,

  validate: (env: Env, appId: string) => ["validate", env, appId] as const,

  impact: (env: Env, appId: string, level: CascadeLevel, scopeId: string) =>
    ["impact", env, appId, level, scopeId] as const,
}
