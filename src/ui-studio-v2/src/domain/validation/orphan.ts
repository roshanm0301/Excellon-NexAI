// Phase 5 T2.3.1 — detect orphaned overrides [L22]

import type { NodeBase } from "@/domain/types/base"
import { CASCADE_LEVEL_RANK } from "@/domain/types/base"
import type { Issue } from "@/domain/types/validation"

export function validateOrphans(nodes: NodeBase[]): Issue[] {
  const issues: Issue[] = []
  const byLogicalKey = new Map<string, NodeBase[]>()

  for (const node of nodes) {
    const existing = byLogicalKey.get(node.logicalKey)
    if (existing) {
      existing.push(node)
    } else {
      byLogicalKey.set(node.logicalKey, [node])
    }
  }

  for (const node of nodes) {
    if (node.overrideOf === undefined) continue

    const candidates = byLogicalKey.get(node.overrideOf)
    if (!candidates) {
      issues.push({
        type: "orphaned-override",
        severity: "error",
        nodeId: node.logicalKey,
        path: "overrideOf",
        message: `Override targets '${node.overrideOf}' which does not exist`,
        cascade: node.cascadeLevel,
      })
      continue
    }

    // Parent must exist at a less-specific (lower rank) cascade level
    const nodeRank = CASCADE_LEVEL_RANK[node.cascadeLevel]
    const hasHigherLevelParent = candidates.some(
      (c) => CASCADE_LEVEL_RANK[c.cascadeLevel] < nodeRank,
    )

    if (!hasHigherLevelParent) {
      issues.push({
        type: "orphaned-override",
        severity: "error",
        nodeId: node.logicalKey,
        path: "overrideOf",
        message: `Override targets '${node.overrideOf}' but no definition exists at a higher cascade level`,
        cascade: node.cascadeLevel,
      })
    }
  }

  return issues
}
