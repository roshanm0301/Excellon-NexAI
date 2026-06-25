import { usePanelsStore } from "@/stores/panels.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  TooltipProvider,
} from "@/shared/ui"
import { CommandPalette, useCommandPalette } from "@/features/command-palette"
import { PreviewHost } from "@/features/preview"
import { usePresence } from "@/features/collaboration"
import { ContextBar } from "./ContextBar"
import { ActivityBar } from "./ActivityBar"
import { LeftPanel } from "./LeftPanel"
import { CanvasHost } from "./CanvasHost"
import { InspectorPanel } from "./InspectorPanel"
import { BottomDock } from "./BottomDock"

export function ShellLayout() {
  const palette = useCommandPalette()
  const explorerVisible = usePanelsStore((s) => s.explorerVisible)
  const inspectorVisible = usePanelsStore((s) => s.inspectorVisible)
  const activeMode = usePanelsStore((s) => s.activeMode)
  const setExplorerWidth = usePanelsStore((s) => s.setExplorerWidth)
  const setInspectorWidth = usePanelsStore((s) => s.setInspectorWidth)
  const appId = useWorkspaceStore((s) => s.appId)
  const { users: presenceUsers } = usePresence(appId)

  const isPreviewMode = activeMode === "preview"

  return (
    <TooltipProvider delayDuration={300}>
      <div
        data-testid="shell-layout"
        className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground"
      >
        <ContextBar onOpenCommandPalette={palette.open} presenceUsers={presenceUsers} />

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
                {isPreviewMode ? <PreviewHost /> : <CanvasHost />}
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
