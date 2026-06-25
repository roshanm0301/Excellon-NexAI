// Phase 6 §3 / T12.2.1 + T12.4.1 — transforms flat TreeNode[] from the API into
// DisplayNode[] for rendering. Honors per-node expand/collapse state (keyboard nav)
// and memoizes the flatten + origin pass (perf on large trees).
import { useMemo } from "react"
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

const NO_COLLAPSE: ReadonlySet<string> = new Set<string>()

function flattenTree(
  nodes: TreeNode[],
  collapsed: ReadonlySet<string>,
  depth = 0,
): DisplayNode[] {
  const result: DisplayNode[] = []
  for (const node of nodes) {
    const hasChildren = node.children.length > 0
    const isExpanded = hasChildren && !collapsed.has(node.logicalKey)
    result.push({
      id: node.id,
      logicalKey: node.logicalKey,
      kind: node.kind,
      label: node.label,
      depth,
      origin: node.originState,
      cascadeLevel: node.cascadeLevel,
      hasChildren,
      isExpanded,
      parentKey: node.parentKey,
    })
    // Only descend into expanded subtrees — collapsed branches drop their children.
    if (isExpanded) {
      result.push(...flattenTree(node.children, collapsed, depth + 1))
    }
  }
  return result
}

export type ExplorerFilter = "all" | "mine" | "orphans"

export function useExplorerTree(
  nodes: TreeNode[],
  filter: ExplorerFilter,
  collapsed: ReadonlySet<string> = NO_COLLAPSE,
): DisplayNode[] {
  return useMemo(() => {
    // Filtered views are flat lists and ignore collapse so every match is visible.
    if (filter === "mine") {
      return flattenTree(nodes, NO_COLLAPSE).filter((n) => n.origin === "own")
    }
    if (filter === "orphans") {
      const flat = flattenTree(nodes, NO_COLLAPSE)
      const orphans = flat.filter((n) => n.origin === "orphaned")
      const rest = flat.filter((n) => n.origin !== "orphaned")
      return [...orphans, ...rest]
    }
    return flattenTree(nodes, collapsed)
  }, [nodes, filter, collapsed])
}
