import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip"
import { Badge } from "./badge"
import { cn } from "@/shared/lib/utils"
import type { OriginState, CascadeLevel } from "@/domain/types"

interface OriginBadgeProps {
  state: OriginState
  sourceLevel?: CascadeLevel
  className?: string
}

const CONFIG: Record<
  OriginState,
  { glyph: string; label: string; ring: string; tooltip: (level?: CascadeLevel) => string }
> = {
  own: {
    glyph: "+",
    label: "Own",
    ring: "ring-1 ring-neutral-400",
    tooltip: () => "Created at this level",
  },
  overridden: {
    glyph: "●",
    label: "Override",
    ring: "ring-2 ring-blue-500",
    tooltip: () => "Inherited, changed here",
  },
  inherited: {
    glyph: "↑",
    label: "Inherited",
    ring: "ring-1 ring-dashed ring-muted-foreground",
    tooltip: (level) => (level ? `From ${level}` : "Inherited from parent level"),
  },
  suppressed: {
    glyph: "⊘",
    label: "Hidden",
    ring: "",
    tooltip: () => "Hidden at this level",
  },
  orphaned: {
    glyph: "!",
    label: "Orphaned",
    ring: "ring-2 ring-destructive",
    tooltip: () => "Source removed",
  },
}

export function OriginBadge({ state, sourceLevel, className }: OriginBadgeProps) {
  const cfg = CONFIG[state]
  const tooltipText = cfg.tooltip(sourceLevel)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          aria-label={`${cfg.label}: ${tooltipText}`}
          className={cn(
            "h-4 min-w-4 cursor-default px-1 text-[10px] font-mono",
            cfg.ring,
            state === "suppressed" && "opacity-40",
            className,
          )}
        >
          {cfg.glyph}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}
