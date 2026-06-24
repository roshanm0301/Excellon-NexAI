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
}

export function DraggableCard({
  type,
  label,
  icon,
  semanticType,
  defaultProps,
  isUnavailable = false,
  unavailableReason,
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

  const card = (
    <div
      ref={dragRef}
      role="button"
      aria-label={label}
      aria-grabbed={isDragging}
      aria-disabled={isUnavailable}
      data-testid={`asset-card-${semanticType}`}
      className={cn(
        "flex flex-col items-center gap-1 rounded-md border border-border p-2 text-center",
        "transition-colors hover:bg-accent/50",
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
