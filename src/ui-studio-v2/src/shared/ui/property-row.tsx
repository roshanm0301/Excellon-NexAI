import { useState } from "react"
import { cn } from "@/shared/lib/utils"
import type { PropType, OriginState } from "@/domain/types"
import type { PropValue, Binding } from "@/domain/types"
import { isBinding } from "@/domain/types"
import { OriginBadge } from "./origin-badge"
import { Input } from "./input"
import { Switch } from "./switch"
import { Badge } from "./badge"

export interface PropertyRowProps {
  propKey: string
  label: string
  propType: PropType
  required: boolean
  value: PropValue | undefined
  origin: OriginState
  onChangeValue: (v: PropValue) => void
  onClickBind: () => void
  onRevert: () => void
}

export function PropertyRow({
  propKey,
  label,
  propType,
  required,
  value,
  origin,
  onChangeValue,
  onClickBind,
  onRevert,
}: PropertyRowProps) {
  const currentlyBound = isBinding(value)
  const [mode, setMode] = useState<"value" | "binding">(
    currentlyBound || propType === "binding" ? "binding" : "value",
  )

  const binding = currentlyBound ? (value as Binding) : null

  function renderControl() {
    if (mode === "binding") {
      const bindLabel = binding
        ? `${binding.bind.ref}${binding.bind.path ? "." + binding.bind.path : ""}`
        : "None"
      return (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="max-w-[120px] truncate text-[10px] font-mono">
            {bindLabel}
          </Badge>
          <button
            type="button"
            onClick={onClickBind}
            className="rounded px-1.5 py-0.5 text-[10px] text-primary hover:bg-accent"
          >
            Change
          </button>
        </div>
      )
    }

    if (propType === "boolean") {
      return (
        <Switch
          checked={typeof value === "boolean" ? value : false}
          onCheckedChange={(v) => onChangeValue(v)}
          aria-label={label}
        />
      )
    }

    if (propType === "number") {
      return (
        <Input
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChangeValue(e.target.valueAsNumber)}
          className="h-7 text-xs"
          aria-label={label}
          required={required}
        />
      )
    }

    return (
      <Input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={required ? `${label} (required)` : label}
        className="h-7 text-xs"
        aria-label={label}
        required={required}
      />
    )
  }

  const canToggle = propType !== "binding"

  return (
    <div
      className="flex items-start gap-2 py-1.5"
      data-prop-key={propKey}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className={cn("text-xs font-medium", required && "after:text-destructive after:content-['*']")}>
            {label}
          </span>
          {canToggle && (
            <button
              type="button"
              title={mode === "value" ? "Switch to binding" : "Switch to value"}
              onClick={() => setMode(mode === "value" ? "binding" : "value")}
              className="h-4 w-4 rounded text-[9px] font-bold leading-none text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {mode === "value" ? "B" : "T"}
            </button>
          )}
        </div>
        {renderControl()}
      </div>

      <div className="flex shrink-0 items-center gap-1 pt-5">
        <OriginBadge state={origin} />
        {origin !== "own" && (
          <button
            type="button"
            title="Revert to inherited"
            onClick={onRevert}
            className="flex h-4 w-4 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            ↩
          </button>
        )}
      </div>
    </div>
  )
}
