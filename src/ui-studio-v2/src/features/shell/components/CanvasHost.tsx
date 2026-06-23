import { usePanelsStore, type Breakpoint } from "@/stores/panels.store"
import { Button } from "@/shared/ui"
import { cn } from "@/shared/lib/utils"

// Phase 3 §4 — Canvas host: toolbar + canvas surface (interpreted renderer in Prompt 08)
const BREAKPOINTS: { value: Breakpoint; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
]

export function CanvasHost() {
  const breakpoint = usePanelsStore((s) => s.breakpoint)
  const setBreakpoint = usePanelsStore((s) => s.setBreakpoint)

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div
        role="toolbar"
        aria-label="Canvas toolbar"
        className="flex h-9 items-center gap-1 border-b border-border bg-background px-2"
      >
        <div role="group" aria-label="Breakpoint" className="flex items-center gap-0.5">
          {BREAKPOINTS.map((bp) => (
            <Button
              key={bp.value}
              variant={breakpoint === bp.value ? "secondary" : "ghost"}
              size="sm"
              aria-label={bp.label}
              aria-pressed={breakpoint === bp.value}
              onClick={() => setBreakpoint(bp.value)}
              className={cn("h-7 px-2 text-xs")}
            >
              {bp.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Canvas (interpreted renderer arrives in Prompt 08).
        </div>
      </div>
    </div>
  )
}
