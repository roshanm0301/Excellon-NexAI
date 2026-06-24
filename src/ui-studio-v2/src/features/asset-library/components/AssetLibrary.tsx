import { Tabs, TabsList, TabsTrigger, TabsContent, ScrollArea } from "@/shared/ui"
// eslint-disable-next-line no-restricted-imports -- intra-feature hook import; same-feature deep imports allowed by convention
import { useAssetSearch } from "@/features/asset-library/hooks/useAssetSearch"
import { ArchetypeList } from "./ArchetypeList"
import { ComponentsTab } from "./ComponentsTab"

export function AssetLibrary() {
  const { query, setQuery, filteredArchetypes, filteredComponents } = useAssetSearch()

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
            <ArchetypeList archetypes={filteredArchetypes} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="components" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <ComponentsTab components={filteredComponents} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
