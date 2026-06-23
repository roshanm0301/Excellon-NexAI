// Phase 4 §5 — RegistryService: external engine reference search + shape

export type RegistryKind = "entity" | "relationship" | "rule" | "workflow" | "connector"

export interface RegistryHit {
  ref: string
  kind: RegistryKind
  name: string
  description?: string
}

export interface TypeShapeField {
  name: string
  type: string
  required: boolean
  description?: string
}

export interface TypeShape {
  ref: string
  fields: TypeShapeField[]
}

export interface RegistryService {
  search(query: string): Promise<RegistryHit[]>
  shape(ref: string): Promise<TypeShape>
}
