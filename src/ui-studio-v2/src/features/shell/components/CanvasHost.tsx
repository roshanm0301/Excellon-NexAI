import { usePanelsStore, type Breakpoint, type ZoomLevel } from "@/stores/panels.store"
import { Button } from "@/shared/ui"
import { cn } from "@/shared/lib/utils"
import { CanvasSurface } from "@/features/canvas"

// Phase 3 §4 — Canvas host: toolbar + canvas surface
const BREAKPOINTS: { value: Breakpoint; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
]

const ZOOM_LEVELS: { value: ZoomLevel; label: string }[] = [
  { value: 0.5, label: "50%" },
  { value: 0.75, label: "75%" },
  { value: 1, label: "100%" },
  { value: 1.5, label: "150%" },
  { value: 2, label: "200%" },
]

export function CanvasHost() {
  const breakpoint = usePanelsStore((s) => s.breakpoint)
  const setBreakpoint = usePanelsStore((s) => s.setBreakpoint)
  const zoomScale = usePanelsStore((s) => s.zoomScale)
  const setZoomScale = usePanelsStore((s) => s.setZoomScale)

  const handleFit = () => {
    setZoomScale(1)
  }

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

        <div className="mx-1 h-4 w-px bg-border" />

        <div role="group" aria-label="Zoom" className="flex items-center gap-0.5">
          <select
            value={zoomScale}
            onChange={(e) => setZoomScale(Number(e.target.value))}
            aria-label="Zoom level"
            className="h-7 rounded border border-border bg-background px-1 text-xs"
          >
            {ZOOM_LEVELS.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Fit to view"
            onClick={handleFit}
            className={cn("h-7 px-2 text-xs")}
          >
            Fit
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <CanvasSurface />
      </div>
    </div>
  )
}
