import { ScrollArea } from "@/shared/ui"
import { TreeItem } from "./TreeItem"
// eslint-disable-next-line no-restricted-imports -- intra-feature hook import; same-feature deep imports allowed by convention
import { useExplorerTree, type ExplorerFilter } from "@/features/explorer/hooks/useExplorerTree"
import type { TreeNode } from "@/services/interfaces"

interface ExplorerTreeProps {
  nodes: TreeNode[]
  filter: ExplorerFilter
}

export function ExplorerTree({ nodes, filter }: ExplorerTreeProps) {
  const displayNodes = useExplorerTree(nodes, filter)

  if (displayNodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
        No nodes match the current filter.
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div role="tree" aria-label="Composition tree">
        {displayNodes.map((node) => (
          <TreeItem key={`${node.logicalKey}:${node.depth}`} node={node} />
        ))}
      </div>
    </ScrollArea>
  )
}
