import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent, ScrollArea } from "@/shared/ui"
// eslint-disable-next-line no-restricted-imports -- intra-feature hook import; same-feature deep imports allowed by convention
import { useAssetSearch } from "@/features/asset-library/hooks/useAssetSearch"
import { useInsertComponent } from "@/features/canvas"
import { useSelectionStore } from "@/stores/selection.store"
import { ArchetypeList } from "./ArchetypeList"
import { ComponentsTab } from "./ComponentsTab"

// T12.2.1 — the minimal shape needed to insert an asset via the keyboard path.
export interface InsertableAsset {
  semanticType: string
  defaultProps: Record<string, unknown>
  label: string
}

export function AssetLibrary() {
  const { query, setQuery, filteredArchetypes, filteredComponents } = useAssetSearch()
  const insertComponent = useInsertComponent()
  const selectedKey = useSelectionStore((s) => s.selectedKeys[0])
  const [announcement, setAnnouncement] = useState("")

  // Keyboard DnD alternative: insert into the selected container, or prompt to pick one.
  const handleInsert = (asset: InsertableAsset) => {
    if (!selectedKey) {
      setAnnouncement(`Select a container in the canvas before inserting ${asset.label}`)
      return
    }
    insertComponent({ semanticType: asset.semanticType, defaultProps: asset.defaultProps }, selectedKey)
    setAnnouncement(`Inserted ${asset.label}`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <input
          type="search"
          placeholder="Search components..."
          aria-label="Search assets"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <Tabs defaultValue="archetypes" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-2 mt-2 self-start">
          <TabsTrigger value="archetypes">Archetypes</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>

        <TabsContent value="archetypes" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <ArchetypeList archetypes={filteredArchetypes} onInsert={handleInsert} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="components" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <ComponentsTab components={filteredComponents} onInsert={handleInsert} />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div aria-live="polite" className="sr-only" data-testid="asset-insert-announcer">
        {announcement}
      </div>
    </div>
  )
}
