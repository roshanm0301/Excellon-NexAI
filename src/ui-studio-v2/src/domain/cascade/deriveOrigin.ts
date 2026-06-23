// Phase 5 T2.2.1 — derive the OriginState of a node relative to the editing level

import type { NodeBase, CascadeLevel, OriginState } from "@/domain/types/base"
import { CASCADE_LEVEL_RANK } from "@/domain/types/base"

export function deriveOrigin(
  node: NodeBase,
  editingLevel: CascadeLevel,
  allNodes?: ReadonlyMap<string, NodeBase>,
): OriginState {
  // [L22] orphan: overrideOf points to a non-existent parent
  if (node.overrideOf !== undefined && allNodes !== undefined) {
    const parent = allNodes.get(node.overrideOf)
    if (!parent) return "orphaned"
  }

  // suppressed: node carries a remove op targeting itself
  if (
    node.overrideOps?.some((op) => op.op === "remove") === true
  ) {
    return "suppressed"
  }

  const nodeRank = CASCADE_LEVEL_RANK[node.cascadeLevel]
  const editRank = CASCADE_LEVEL_RANK[editingLevel]

  // overridden: node overrides a higher-level definition at the editing level
  if (node.overrideOf !== undefined && node.cascadeLevel === editingLevel) {
    return "overridden"
  }

  // own: authored at this level (no override)
  if (node.cascadeLevel === editingLevel) {
    return "own"
  }

  // inherited: from a less specific (or more specific) level
  if (nodeRank < editRank) {
    return "inherited"
  }

  // node is from a more specific level than editing — still inherited from perspective
  return "inherited"
}
