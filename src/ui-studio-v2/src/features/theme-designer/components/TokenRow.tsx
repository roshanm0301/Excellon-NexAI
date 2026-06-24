import { Input, Button } from "@/shared/ui"
import { OriginBadge } from "@/shared/ui"
import type { OriginState, CascadeLevel } from "@/domain/types"
import { RotateCcw } from "lucide-react"

interface TokenRowProps {
  label: string
  value: string
  isColor: boolean
  originState: OriginState
  sourceLevel?: CascadeLevel
  onChange: (value: string) => void
  onRevert?: () => void
}

export function TokenRow({
  label,
  value,
  isColor,
  originState,
  sourceLevel,
  onChange,
  onRevert,
}: TokenRowProps) {
  return (
    <div className="flex items-center gap-2 py-1.5" aria-label={`Token: ${label}`}>
      <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>

      <OriginBadge state={originState} sourceLevel={sourceLevel} />

      <div className="flex flex-1 items-center gap-1.5">
        {isColor && (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border p-0.5"
            aria-label={`${label} color picker`}
          />
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs"
          aria-label={`${label} value`}
        />
      </div>

      {originState === "overridden" && onRevert && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRevert}
          aria-label={`Revert ${label}`}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
