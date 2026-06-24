// Phase 6 §3 — transforms flat TreeNode[] from the API into DisplayNode[] for rendering
import type { TreeNode } from "@/services/interfaces"
import type { OriginState } from "@/domain/types"

export interface DisplayNode {
  id: string
  logicalKey: string
  kind: TreeNode["kind"]
  label: string
  depth: number
  origin: OriginState
  cascadeLevel: TreeNode["cascadeLevel"]
  hasChildren: boolean
  isExpanded: boolean
  parentKey: string | null
}

function flattenTree(nodes: TreeNode[], depth = 0): DisplayNode[] {
  const result: DisplayNode[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      logicalKey: node.logicalKey,
      kind: node.kind,
      label: node.label,
      depth,
      origin: node.originState,
      cascadeLevel: node.cascadeLevel,
      hasChildren: node.children.length > 0,
      isExpanded: true,
      parentKey: node.parentKey,
    })
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1))
    }
  }
  return result
}

export type ExplorerFilter = "all" | "mine" | "orphans"

export function useExplorerTree(
  nodes: TreeNode[],
  filter: ExplorerFilter,
): DisplayNode[] {
  const flat = flattenTree(nodes)

  if (filter === "mine") {
    return flat.filter((n) => n.origin === "own")
  }
  if (filter === "orphans") {
    const orphans = flat.filter((n) => n.origin === "orphaned")
    const rest = flat.filter((n) => n.origin !== "orphaned")
    return [...orphans, ...rest]
  }
  return flat
}
