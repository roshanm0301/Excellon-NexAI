/**
 * ViewRuntimeContext — shared runtime state for a rendered view.
 *
 * Wraps a RuntimePreviewCanvas and provides search, filter, sort, pagination,
 * and modal/drawer visibility state to all component renderers without prop drilling.
 * Component renderers (DataTableRenderer, SearchBarRenderer, etc.) consume this
 * context only when isPreviewMode=true.
 */

import { createContext, useContext, useState, type ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ViewRuntimeState {
  primaryEntity: string
  viewLabel: string
  search: string
  setSearch: (v: string) => void
  debouncedSearch: string
  filters: Record<string, string[]>
  setFilters: (f: Record<string, string[]>) => void
  sortBy: string | undefined
  setSortBy: (k: string | undefined) => void
  sortDir: 'asc' | 'desc'
  setSortDir: (d: 'asc' | 'desc') => void
  page: number
  setPage: (p: number) => void
  filterDrawerOpen: boolean
  setFilterDrawerOpen: (v: boolean) => void
  createModalOpen: boolean
  setCreateModalOpen: (v: boolean) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const ViewRuntimeContext = createContext<ViewRuntimeState | null>(null)

/** Returns the runtime view context, or null when rendering in design mode. */
export function useRuntimeViewContext(): ViewRuntimeState | null {
  return useContext(ViewRuntimeContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ViewRuntimeProviderProps {
  primaryEntity: string
  viewLabel: string
  children: ReactNode
}

export function ViewRuntimeProvider({
  primaryEntity,
  viewLabel,
  children,
}: ViewRuntimeProviderProps) {
  const [search, setSearchRaw] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [sortBy, setSortBy] = useState<string | undefined>()
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Debounce search — update debouncedSearch 350ms after typing stops
  const timerRef = { current: 0 as ReturnType<typeof setTimeout> }
  function setSearch(v: string) {
    setSearchRaw(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(v)
      setPage(1)
    }, 350)
  }

  return (
    <ViewRuntimeContext.Provider
      value={{
        primaryEntity,
        viewLabel,
        search,
        setSearch,
        debouncedSearch,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        sortDir,
        setSortDir,
        page,
        setPage,
        filterDrawerOpen,
        setFilterDrawerOpen,
        createModalOpen,
        setCreateModalOpen,
      }}
    >
      {children}
    </ViewRuntimeContext.Provider>
  )
}
