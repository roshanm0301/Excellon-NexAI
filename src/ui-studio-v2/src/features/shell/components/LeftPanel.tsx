import { usePanelsStore } from "@/stores/panels.store"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui"
import { ExplorerPanel } from "@/features/explorer"

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
        <ExplorerPanel />
      </TabsContent>
      <TabsContent value="assets" className="mt-0 flex-1 overflow-hidden">
        <AssetLibraryStub />
      </TabsContent>
    </Tabs>
  )
}
