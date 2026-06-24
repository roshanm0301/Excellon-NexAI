import { usePanelsStore } from "@/stores/panels.store"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  TooltipProvider,
} from "@/shared/ui"
import { CommandPalette, useCommandPalette } from "@/features/command-palette"
import { ContextBar } from "./ContextBar"
import { ActivityBar } from "./ActivityBar"
import { LeftPanel } from "./LeftPanel"
import { CanvasHost } from "./CanvasHost"
import { InspectorPanel } from "./InspectorPanel"
import { BottomDock } from "./BottomDock"

// Phase 3 §2 — Editor Workspace master shell.
// Top row: ContextBar (full width).
// Middle row: ActivityBar | ResizablePanelGroup(Left | Canvas | Inspector).
// Bottom row: BottomDock (collapsible).

export function ShellLayout() {
  const palette = useCommandPalette()
  const explorerVisible = usePanelsStore((s) => s.explorerVisible)
  const inspectorVisible = usePanelsStore((s) => s.inspectorVisible)
  const setExplorerWidth = usePanelsStore((s) => s.setExplorerWidth)
  const setInspectorWidth = usePanelsStore((s) => s.setInspectorWidth)

  return (
    <TooltipProvider delayDuration={300}>
      <div
        data-testid="shell-layout"
        className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground"
      >
        <ContextBar onOpenCommandPalette={palette.open} />

        <div className="flex flex-1 overflow-hidden">
          <ActivityBar />

          <div className="flex flex-1 flex-col overflow-hidden">
            <ResizablePanelGroup orientation="horizontal" className="flex-1">
              {explorerVisible && (
                <>
                  <ResizablePanel
                    id="left-panel"
                    defaultSize="20%"
                    minSize="12%"
                    maxSize="40%"
                    onResize={(size) => setExplorerWidth(size.asPercentage)}
                  >
                    <LeftPanel />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                </>
              )}

              <ResizablePanel id="canvas" defaultSize={inspectorVisible ? "55%" : "80%"}>
                <CanvasHost />
              </ResizablePanel>

              {inspectorVisible && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel
                    id="inspector"
                    defaultSize="25%"
                    minSize="15%"
                    maxSize="45%"
                    onResize={(size) => setInspectorWidth(size.asPercentage)}
                  >
                    <InspectorPanel />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>

            <BottomDock />
          </div>
        </div>

        <CommandPalette open={palette.isOpen} onOpenChange={palette.setIsOpen} />
      </div>
    </TooltipProvider>
  )
}
