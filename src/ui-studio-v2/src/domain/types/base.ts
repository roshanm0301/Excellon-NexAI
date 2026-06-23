// Phase 4 §2 / Doc 01 §1.1 — Foundation types for the Meta Model

// Doc 01 §1.1.2 — cascade hierarchy
export type CascadeLevel = "platform" | "vertical" | "tenant" | "org"

export type Env = "dev" | "staging" | "prod"

// Doc 01 §1.1.2 — origin tracking for UI badging
export type OriginState = "inherited" | "overridden" | "own" | "suppressed" | "orphaned"

// Doc 01 §1.1.2 — cascade level ordering (platform least specific, org most specific)
export const CASCADE_LEVEL_ORDER: readonly CascadeLevel[] = [
  "platform",
  "vertical",
  "tenant",
  "org",
] as const

export const CASCADE_LEVEL_RANK: Record<CascadeLevel, number> = {
  platform: 0,
  vertical: 1,
  tenant: 2,
  org: 3,
}

export function compareCascadeLevels(a: CascadeLevel, b: CascadeLevel): number {
  return CASCADE_LEVEL_RANK[a] - CASCADE_LEVEL_RANK[b]
}

// Doc 01 §1.1.2 — audit trail
export interface Audit {
  createdBy: string
  createdAt: string
  modifiedBy: string
  modifiedAt: string
}

// Doc 01 §1.1.4 — first-class registry reference [L6]
export type BindingKind = "dataSource" | "state" | "rule" | "workflow"

export interface Binding {
  bind: {
    kind: BindingKind
    ref: string
    path?: string
  }
}

export type NodeRef = string

// Recursive literal type for prop values
export type Literal = string | number | boolean | null | Literal[] | { [key: string]: Literal }

export type PropValue = Literal | Binding

// Doc 01 §1.1.3 — override operations (normative) [L10]
export interface SetOp {
  op: "set"
  path: string
  value: unknown
}

export interface MergeOp {
  op: "merge"
  path: string
  value: Record<string, unknown>
}

export interface InsertOp {
  op: "insert"
  path: string
  logicalKey: string
  relativeTo?: string
  position?: "before" | "after"
}

export interface RemoveOp {
  op: "remove"
  logicalKey: string
}

export interface ReplaceOp {
  op: "replace"
  logicalKey: string
  value: Record<string, unknown>
}

export type OverrideOp = SetOp | MergeOp | InsertOp | RemoveOp | ReplaceOp

// Doc 01 §1.1.2 — universal definition fields
export interface NodeBase {
  id: string
  logicalKey: string
  cascadeLevel: CascadeLevel
  overrideOf?: string
  overrideOps?: OverrideOp[]
  objectVersion: number
  audit: Audit
  securityRef?: string
}
