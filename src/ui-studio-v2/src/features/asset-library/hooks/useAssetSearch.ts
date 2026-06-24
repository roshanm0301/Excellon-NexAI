import { useState, useMemo } from "react"
import { ARCHETYPES, COMPONENTS, type ArchetypeEntry, type CatalogueEntry } from "@/features/asset-library/catalogue"

export function useAssetSearch() {
  const [query, setQuery] = useState("")

  const filteredArchetypes = useMemo<ArchetypeEntry[]>(() => {
    if (!query) return ARCHETYPES
    const q = query.toLowerCase()
    return ARCHETYPES.filter((a) => a.label.toLowerCase().includes(q))
  }, [query])

  const filteredComponents = useMemo<CatalogueEntry[]>(() => {
    if (!query) return COMPONENTS
    const q = query.toLowerCase()
    return COMPONENTS.filter((c) => c.label.toLowerCase().includes(q))
  }, [query])

  return { query, setQuery, filteredArchetypes, filteredComponents }
}
