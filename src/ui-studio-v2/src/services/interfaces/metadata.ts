// Phase 4 §5 — MetadataService: registry CRUD + composition tree

import type { CascadeLevel, Env, OriginState, OverrideOp } from "@/domain/types"
import type { MetaNode } from "@/domain/types"

export interface TreeNode {
  id: string
  logicalKey: string
  kind: MetaNode["kind"]
  label: string
  cascadeLevel: CascadeLevel
  originState: OriginState
  parentKey: string | null
  children: TreeNode[]
}

export interface GetTreeParams {
  env: Env
  appId: string
  editingLevel: CascadeLevel
  scopeId: string
}

export interface NodeInput {
  kind: MetaNode["kind"]
  logicalKey: string
  cascadeLevel: CascadeLevel
  parentKey: string
  data: Record<string, unknown>
}

export interface OverrideNodeParams {
  logicalKey: string
  level: CascadeLevel
  ops: OverrideOp[]
}

export interface CreateAppInput {
  name: string
  vertical: string
  description?: string
}

export interface AppSummary {
  id: string
  name: string
  vertical: string
  description: string
  createdAt: string
  modifiedAt: string
}

export interface MetadataService {
  getTree(params: GetTreeParams): Promise<TreeNode[]>
  getNode(id: string): Promise<MetaNode>
  createNode(input: NodeInput): Promise<MetaNode>
  overrideNode(params: OverrideNodeParams): Promise<MetaNode>
  createApp(input: CreateAppInput): Promise<AppSummary>
  listApps(): Promise<AppSummary[]>
}
