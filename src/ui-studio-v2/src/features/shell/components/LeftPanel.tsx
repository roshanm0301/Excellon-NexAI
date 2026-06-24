import { usePanelsStore } from "@/stores/panels.store"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui"
import { ExplorerPanel } from "@/features/explorer"
import { AssetLibrary } from "@/features/asset-library"
import { VersionHistoryPanel } from "@/features/versioning"
import { ThemeDesigner } from "@/features/theme-designer"

export function LeftPanel() {
  const activeMode = usePanelsStore((s) => s.activeMode)
  const setActiveMode = usePanelsStore((s) => s.setActiveMode)

  if (activeMode === "history") {
    return <VersionHistoryPanel />
  }

  if (activeMode === "settings") {
    return <ThemeDesigner />
  }

  const tab = activeMode === "explorer" ? "explorer" : "assets"

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setActiveMode(v === "explorer" ? "explorer" : "search")}
      className="flex h-full flex-col"
      aria-label="Left panel"
    >
      <TabsList className="m-2 self-start">
        <TabsTrigger value="explorer">Explorer</TabsTrigger>
        <TabsTrigger value="assets">Assets</TabsTrigger>
      </TabsList>
      <TabsContent value="explorer" className="mt-0 flex-1 overflow-hidden">
        <ExplorerPanel />
      </TabsContent>
      <TabsContent value="assets" className="mt-0 flex-1 overflow-hidden">
        <AssetLibrary />
      </TabsContent>
    </Tabs>
  )
}
