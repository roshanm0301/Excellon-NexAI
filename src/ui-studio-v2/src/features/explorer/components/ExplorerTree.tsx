import { useCallback, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useVirtualizer } from "@tanstack/react-virtual"
import { TreeItem } from "./TreeItem"
// eslint-disable-next-line no-restricted-imports -- intra-feature hook import; same-feature deep imports allowed by convention
import { useExplorerTree, type ExplorerFilter, type DisplayNode } from "@/features/explorer/hooks/useExplorerTree"
import { useSelectionStore } from "@/stores/selection.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import type { TreeNode } from "@/services/interfaces"

interface ExplorerTreeProps {
  nodes: TreeNode[]
  filter: ExplorerFilter
}

const ROW_HEIGHT = 28

// Walks the parentKey chain of displayNodes to find the nearest page ancestor.
function findPageAncestor(node: DisplayNode, allNodes: DisplayNode[]): DisplayNode | null {
  if (node.kind === "page") return node
  if (!node.parentKey) return null
  const parent = allNodes.find((n) => n.logicalKey === node.parentKey)
  if (!parent) return null
  return findPageAncestor(parent, allNodes)
}

export function ExplorerTree({ nodes, filter }: ExplorerTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const displayNodes = useExplorerTree(nodes, filter, collapsed)
  const setSelected = useSelectionStore((s) => s.setSelected)
  const clearSelection = useSelectionStore((s) => s.clearSelection)
  const appId = useWorkspaceStore((s) => s.appId)
  const activePageId = useWorkspaceStore((s) => s.pageId)
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: displayNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  const toggleCollapse = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const clampedActive = Math.min(activeIndex, Math.max(0, displayNodes.length - 1))
  const activeNode = displayNodes[clampedActive]

  const moveActive = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, displayNodes.length - 1))
      setActiveIndex(clamped)
      virtualizer.scrollToIndex(clamped)
    },
    [displayNodes.length, virtualizer],
  )

  // Navigate to a page route or select a non-page node (switching pages first if needed).
  const handleNodeActivate = useCallback(
    (node: DisplayNode) => {
      if (node.kind === "page") {
        void navigate({
          to: "/editor/$appId/$pageId",
          params: { appId, pageId: node.logicalKey },
        })
        clearSelection()
      } else {
        const pageAncestor = findPageAncestor(node, displayNodes)
        if (pageAncestor && pageAncestor.logicalKey !== activePageId) {
          void navigate({
            to: "/editor/$appId/$pageId",
            params: { appId, pageId: pageAncestor.logicalKey },
            search: (prev) => ({ ...prev, selection: [node.logicalKey] }),
          })
        } else {
          setSelected([node.logicalKey])
        }
      }
    },
    [navigate, appId, activePageId, displayNodes, clearSelection, setSelected],
  )

  // WAI-ARIA tree keyboard model (aria-activedescendant variant — works with virtualization).
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (displayNodes.length === 0) return
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        moveActive(clampedActive + 1)
        break
      case "ArrowUp":
        e.preventDefault()
        moveActive(clampedActive - 1)
        break
      case "ArrowRight":
        e.preventDefault()
        if (activeNode?.hasChildren && !activeNode.isExpanded) {
          toggleCollapse(activeNode.logicalKey)
        } else {
          moveActive(clampedActive + 1)
        }
        break
      case "ArrowLeft":
        e.preventDefault()
        if (activeNode?.hasChildren && activeNode.isExpanded) {
          toggleCollapse(activeNode.logicalKey)
        } else if (activeNode?.parentKey) {
          const parentIdx = displayNodes.findIndex((n) => n.logicalKey === activeNode.parentKey)
          if (parentIdx >= 0) moveActive(parentIdx)
        }
        break
      case "Home":
        e.preventDefault()
        moveActive(0)
        break
      case "End":
        e.preventDefault()
        moveActive(displayNodes.length - 1)
        break
      case "Enter":
      case " ":
        e.preventDefault()
        if (activeNode) handleNodeActivate(activeNode)
        break
      default:
        break
    }
  }

  if (displayNodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
        No nodes match the current filter.
      </div>
    )
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        role="tree"
        aria-label="Composition tree"
        tabIndex={0}
        aria-activedescendant={activeNode ? `treeitem-${activeNode.logicalKey}` : undefined}
        onKeyDown={handleKeyDown}
        className="relative focus:outline-none"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const node = displayNodes[vi.index]
          return (
            <div
              key={`${node.logicalKey}:${node.depth}`}
              role="presentation"
              className="absolute left-0 top-0 w-full"
              style={{ height: `${vi.size}px`, transform: `translateY(${vi.start}px)` }}
            >
              <TreeItem
                node={node}
                isActive={vi.index === clampedActive}
                onToggleCollapse={() => toggleCollapse(node.logicalKey)}
                onActivate={() => {
                  setActiveIndex(vi.index)
                  handleNodeActivate(node)
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
