// Phase 5 T2.2.1 — resolve cascade: merge Platform→Vertical→Tenant→Org, most-specific-wins [L11]

import type { NodeBase, CascadeLevel } from "@/domain/types/base"
import { CASCADE_LEVEL_ORDER } from "@/domain/types/base"
import type { Issue } from "@/domain/types/validation"
import { applyOverrideOps } from "./applyOverrideOps"

export interface CascadeResult {
  resolved: NodeBase[]
  orphans: Issue[]
}

export function resolveCascade(definitions: Map<CascadeLevel, NodeBase[]>): CascadeResult {
  const merged = new Map<string, NodeBase>()
  const orphans: Issue[] = []

  for (const level of CASCADE_LEVEL_ORDER) {
    const nodes = definitions.get(level)
    if (!nodes) continue

    for (const node of nodes) {
      if (node.overrideOf !== undefined) {
        const parent = merged.get(node.overrideOf)
        if (!parent) {
          orphans.push({
            type: "orphaned-override",
            severity: "error",
            nodeId: node.logicalKey,
            path: "overrideOf",
            message: `Override targets '${node.overrideOf}' which does not exist at a higher cascade level`,
            cascade: level,
          })
          continue
        }

        // Check for remove ops — node is suppressed
        const hasRemove = node.overrideOps?.some((op) => op.op === "remove") === true
        if (hasRemove) {
          merged.delete(node.overrideOf)
          continue
        }

        // Apply override ops to the parent
        const overridden = node.overrideOps?.length
          ? applyOverrideOps(parent, node.overrideOps)
          : { ...parent }

        overridden.cascadeLevel = level
        overridden.overrideOf = node.overrideOf
        overridden.overrideOps = node.overrideOps
        overridden.objectVersion = node.objectVersion
        merged.set(parent.logicalKey, overridden)
      } else {
        // Own node or most-specific-wins replacement
        merged.set(node.logicalKey, { ...node })
      }
    }
  }

  return {
    resolved: Array.from(merged.values()),
    orphans,
  }
}
