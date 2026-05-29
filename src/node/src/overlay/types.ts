export type OverlayLayer = 'platform' | 'vertical' | 'tenant' | 'node' | 'role'

export interface OverlayDefinition {
  id: string
  tenantId: string
  entityType: string
  layer: OverlayLayer
  scopeKey: string
  delta: Record<string, unknown>
}
