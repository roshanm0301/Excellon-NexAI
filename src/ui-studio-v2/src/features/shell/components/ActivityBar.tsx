import {
  LayoutGrid,
  Search,
  AlertTriangle,
  History,
  Play,
  Settings,
} from "lucide-react"
import { usePanelsStore, type ActivityMode } from "@/stores/panels.store"
import { Button } from "@/shared/ui"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui"
import { cn } from "@/shared/lib/utils"

// Phase 3 §2 / Phase 2 §B1 — Activity Bar: 48px-wide vertical icon strip
interface ActivityEntry {
  mode: ActivityMode
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const ENTRIES: ActivityEntry[] = [
  { mode: "explorer", icon: LayoutGrid, label: "Explorer" },
  { mode: "search", icon: Search, label: "Search" },
  { mode: "problems", icon: AlertTriangle, label: "Problems" },
  { mode: "history", icon: History, label: "Version History" },
  { mode: "preview", icon: Play, label: "Preview" },
  { mode: "settings", icon: Settings, label: "Settings" },
]

export function ActivityBar() {
  const activeMode = usePanelsStore((s) => s.activeMode)
  const setActiveMode = usePanelsStore((s) => s.setActiveMode)
  const toggleExplorer = usePanelsStore((s) => s.toggleExplorer)
  const toggleBottomDock = usePanelsStore((s) => s.toggleBottomDock)
  const explorerVisible = usePanelsStore((s) => s.explorerVisible)

  function handleClick(entry: ActivityEntry) {
    // Phase 2 §B1 — Activity Bar toggles left/bottom panels
    if (entry.mode === "problems" || entry.mode === "preview") {
      toggleBottomDock()
    } else if (entry.mode === activeMode) {
      toggleExplorer()
    } else if (!explorerVisible) {
      toggleExplorer()
    }
    setActiveMode(entry.mode)
  }

  return (
    <nav
      aria-label="Activity Bar"
      className="flex h-full w-12 flex-col items-center gap-1 border-r border-border bg-muted/40 py-2"
    >
      {ENTRIES.map((entry) => {
        const Icon = entry.icon
        const isActive = entry.mode === activeMode
        return (
          <Tooltip key={entry.mode}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={entry.label}
                aria-pressed={isActive}
                onClick={() => handleClick(entry)}
                className={cn(
                  "h-9 w-9 rounded-md",
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{entry.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
