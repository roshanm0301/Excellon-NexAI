import type { OverlayDefinition, OverlayLayer } from './types.js'
import { deepMerge } from './merge.js'

const LAYER_ORDER: OverlayLayer[] = ['platform', 'vertical', 'tenant', 'node', 'role']

export class OverlayResolver {
  resolve(
    overlays: OverlayDefinition[],
    tenantId: string,
    entityType: string,
    nodeId: string,
    role: string,
  ): Record<string, unknown> {
    const filtered = overlays.filter(
      (o) => o.tenantId === tenantId && o.entityType === entityType,
    )

    filtered.sort(
      (a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer),
    )

    return filtered.reduce<Record<string, unknown>>(
      (acc, overlay) => deepMerge(acc, overlay.delta),
      {},
    )
  }
}
