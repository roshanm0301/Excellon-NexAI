import { useDrag } from "react-dnd"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui"
import { cn } from "@/shared/lib/utils"

interface DraggableCardProps {
  type: string
  label: string
  icon: string
  semanticType: string
  defaultProps: Record<string, unknown>
  isUnavailable?: boolean
  unavailableReason?: string
  /** T12.2.1 — keyboard DnD alternative: fired on Enter/Space to insert this asset. */
  onActivate?: () => void
}

export function DraggableCard({
  type,
  label,
  icon,
  semanticType,
  defaultProps,
  isUnavailable = false,
  unavailableReason,
  onActivate,
}: DraggableCardProps) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type,
      item: { semanticType, kind: type, defaultProps },
      canDrag: !isUnavailable,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [type, semanticType, defaultProps, isUnavailable],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isUnavailable || !onActivate) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onActivate()
    }
  }

  const card = (
    <div
      ref={dragRef}
      role="button"
      tabIndex={isUnavailable ? -1 : 0}
      aria-label={label}
      aria-grabbed={isDragging}
      aria-disabled={isUnavailable}
      onKeyDown={handleKeyDown}
      data-testid={`asset-card-${semanticType}`}
      className={cn(
        "flex flex-col items-center gap-1 rounded-md border border-border p-2 text-center",
        "transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
        isDragging && "opacity-50",
        isUnavailable && "cursor-not-allowed opacity-50",
        !isUnavailable && "cursor-grab",
      )}
    >
      <span className="text-base" aria-hidden>
        {icon}
      </span>
      <span className="text-[10px] leading-tight text-muted-foreground">{label}</span>
    </div>
  )

  if (isUnavailable && unavailableReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent>
          <p>{unavailableReason}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return card
}
