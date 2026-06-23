// Phase 4 §6 — fixtures barrel + seedAll
import { verticalNodes, tenantNodes, orgNodes, SCOPE_MAP } from "./dms-app"
import { registryHits, typeShapes, allRegistryKeys } from "./registry"

export { verticalNodes, tenantNodes, orgNodes, SCOPE_MAP } from "./dms-app"
export type { ScopeEntry } from "./dms-app"
export { registryHits, typeShapes, allRegistryKeys } from "./registry"

export function seedAll() {
  return {
    verticalNodes,
    tenantNodes,
    orgNodes,
    registryHits,
    typeShapes,
    allRegistryKeys,
    scopeMap: SCOPE_MAP,
  }
}
