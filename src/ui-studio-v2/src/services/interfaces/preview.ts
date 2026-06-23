// Phase 4 §5 — PreviewService: cascade resolution for preview-as-scope

import type { CascadeLevel, Env, OriginState } from "@/domain/types"
import type { MetaNode } from "@/domain/types"

export interface ResolveParams {
  env: Env
  appId: string
  pageId: string
  previewScopeId: string
  role?: string
}

export interface ResolvedNode {
  logicalKey: string
  kind: MetaNode["kind"]
  cascadeLevel: CascadeLevel
  originState: OriginState
  data: Record<string, unknown>
}

export interface ResolvedModel {
  pageId: string
  scopeId: string
  nodes: ResolvedNode[]
}

export interface PreviewService {
  resolve(params: ResolveParams): Promise<ResolvedModel>
}
