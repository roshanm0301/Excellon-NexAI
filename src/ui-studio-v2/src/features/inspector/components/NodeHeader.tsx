import { cn } from "@/shared/lib/utils"
import { OriginBadge, Badge } from "@/shared/ui"
import type { MetaNode, OriginState } from "@/domain/types"

interface NodeHeaderProps {
  node: MetaNode
  origin: OriginState
}

const KIND_GLYPHS: Record<string, string> = {
  application: "⬡",
  module: "□",
  page: "⬜",
  view: "▣",
  section: "▤",
  layout: "▦",
  component: "◈",
  dataSource: "⊕",
  state: "◎",
  action: "▶",
  event: "⚡",
  workflowBinding: "⇆",
  navigation: "≡",
  theme: "◑",
}

const LEVEL_COLORS: Record<string, string> = {
  platform: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  vertical: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  tenant: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  org: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
}

export function NodeHeader({ node, origin }: NodeHeaderProps) {
  const glyph = KIND_GLYPHS[node.kind] ?? "○"
  const displayName = "name" in node && typeof node.name === "string"
    ? node.name
    : node.logicalKey
  const levelColor = LEVEL_COLORS[node.cascadeLevel] ?? ""

  return (
    <div className="flex flex-col gap-1 border-b px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground" aria-hidden>
          {glyph}
        </span>
        <span
          className="min-w-0 flex-1 truncate font-mono text-xs font-semibold"
          title={displayName}
        >
          {displayName}
        </span>
        <OriginBadge state={origin} />
      </div>
      <div className="flex items-center gap-1.5">
        <Badge
          variant="outline"
          className="text-[10px] font-normal text-muted-foreground"
        >
          {node.kind}
        </Badge>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium",
            levelColor,
          )}
        >
          {node.cascadeLevel}
        </span>
      </div>
    </div>
  )
}
