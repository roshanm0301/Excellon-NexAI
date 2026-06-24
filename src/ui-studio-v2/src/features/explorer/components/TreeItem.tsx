import { ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
  OriginBadge,
} from "@/shared/ui"
import { useSelectionStore } from "@/stores/selection.store"
import { useOverrideNode } from "@/shared/query/mutations"
import { cn } from "@/shared/lib/utils"
// eslint-disable-next-line no-restricted-imports -- intra-feature hook import; same-feature deep imports allowed by convention
import type { DisplayNode } from "@/features/explorer/hooks/useExplorerTree"

interface TreeItemProps {
  node: DisplayNode
}

const KIND_ICONS: Record<string, string> = {
  application: "◈",
  module: "◻",
  page: "▭",
  view: "⊡",
  section: "▤",
  layout: "▦",
  component: "◇",
  dataSource: "⊕",
  state: "◉",
  action: "▷",
  event: "⌁",
  workflowBinding: "⟳",
  navigation: "↗",
  theme: "✦",
}

export function TreeItem({ node }: TreeItemProps) {
  const selectedKeys = useSelectionStore((s) => s.selectedKeys)
  const setSelected = useSelectionStore((s) => s.setSelected)
  const overrideMutation = useOverrideNode()

  const isSelected = selectedKeys.includes(node.logicalKey)
  const icon = KIND_ICONS[node.kind] ?? "○"

  return (
    <div
      role="treeitem"
      aria-selected={isSelected}
      data-testid={`tree-item-${node.logicalKey}`}
      style={{ paddingLeft: `${node.depth * 12 + 8}px` }}
      className={cn(
        "group flex cursor-pointer items-center gap-1.5 py-0.5 pr-2 text-sm",
        "hover:bg-accent/50",
        isSelected && "bg-accent text-accent-foreground",
      )}
      onClick={() => setSelected([node.logicalKey])}
    >
      {node.hasChildren ? (
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
      ) : (
        <span className="h-3 w-3 shrink-0" />
      )}

      <span className="shrink-0 text-[11px] text-muted-foreground" aria-hidden>
        {icon}
      </span>

      <span className="flex-1 truncate text-xs">{node.label}</span>

      <OriginBadge state={node.origin} sourceLevel={node.cascadeLevel} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100"
            aria-label={`Actions for ${node.label}`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px]">···</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {node.origin === "inherited" && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  overrideMutation.mutate({
                    logicalKey: node.logicalKey,
                    level: node.cascadeLevel,
                    ops: [],
                  })
                }}
              >
                Override here
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              setSelected([node.logicalKey])
            }}
          >
            Reveal in canvas
          </DropdownMenuItem>
          {node.origin === "own" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
