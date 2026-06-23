import { usePanelsStore } from "@/stores/panels.store"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui"

// Phase 3 §2 — Left panel: tabbed between Explorer and Asset Library
// Explorer + AssetLibrary feature components are wired in Prompts 06/07 via their barrels.

function ExplorerStub() {
  return (
    <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
      Explorer (Prompt 06)
    </div>
  )
}

function AssetLibraryStub() {
  return (
    <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
      Asset Library (Prompt 07)
    </div>
  )
}

export function LeftPanel() {
  const activeMode = usePanelsStore((s) => s.activeMode)
  const tab = activeMode === "explorer" ? "explorer" : "assets"

  return (
    <Tabs value={tab} className="flex h-full flex-col" aria-label="Left panel">
      <TabsList className="m-2 self-start">
        <TabsTrigger value="explorer">Explorer</TabsTrigger>
        <TabsTrigger value="assets">Assets</TabsTrigger>
      </TabsList>
      <TabsContent value="explorer" className="mt-0 flex-1 overflow-hidden">
        <ExplorerStub />
      </TabsContent>
      <TabsContent value="assets" className="mt-0 flex-1 overflow-hidden">
        <AssetLibraryStub />
      </TabsContent>
    </Tabs>
  )
}
