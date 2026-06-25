import type { TreeNode } from "@/services/interfaces"

// Depth-first search for the first page-kind node in the tree.
export function findFirstPageNode(nodes: TreeNode[]): TreeNode | null {
  for (const node of nodes) {
    if (node.kind === "page") return node
    const found = findFirstPageNode(node.children)
    if (found) return found
  }
  return null
}
