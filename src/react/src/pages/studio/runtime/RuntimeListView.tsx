import { useState, useCallback } from 'react'
import { Search, SlidersHorizontal, Plus } from 'lucide-react'
import { Button } from '../../../design-system'
import type { ViewWithPayload, ComponentNode } from '../../../types/viewStudio'
import { useEntityRecords } from '../../../hooks/useEntityRecords'
import { RuntimeDataTable } from './RuntimeDataTable'
import { RuntimeFilterDrawer } from './RuntimeFilterDrawer'
import { RuntimeCreateModal } from './RuntimeCreateModal'

interface ColDef {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  type?: string
}

interface RuntimeListViewProps {
  view: ViewWithPayload
  entityType: string
}

function findNode(node: ComponentNode, code: string): ComponentNode | null {
  if (node.component_code === code) return node
  for (const child of node.children ?? []) {
    const found = findNode(child, code)
    if (found) return found
  }
  return null
}

function findAllNodes(node: ComponentNode, code: string): ComponentNode[] {
  const results: ComponentNode[] = []
  if (node.component_code === code) results.push(node)
  for (const child of node.children ?? []) {
    results.push(...findAllNodes(child, code))
  }
  return results
}

export function RuntimeListView({ view, entityType }: RuntimeListViewProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<string | undefined>()
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [page, setPage] = useState(1)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const tree = view.latest_payload?.component_tree
  const dataTableNode = tree ? findNode(tree, 'data_table') : null
  const filterDrawerNode = tree
    ? (findNode(tree, 'drawer_panel') ?? findNode(tree, 'drawer_container'))
    : null

  const columns: ColDef[] = Array.isArray(dataTableNode?.props?.columns)
    ? (dataTableNode!.props!.columns as ColDef[])
    : []

  const pageSize = (dataTableNode?.props?.page_size as number) ?? 25

  const { data, isLoading } = useEntityRecords(entityType, {
    search: debouncedSearch,
    sortBy,
    sortDir,
    filters,
    page,
    pageSize,
  })

  const total = data?.total ?? 0
  const records = data?.items ?? []

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
    clearTimeout((handleSearchChange as { _t?: ReturnType<typeof setTimeout> })._t)
    const t = setTimeout(() => setDebouncedSearch(value), 350);
    (handleSearchChange as { _t?: ReturnType<typeof setTimeout> })._t = t
  }, [])

  const handleSort = useCallback((key: string) => {
    setSortBy(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return key
      }
      setSortDir('asc')
      return key
    })
    setPage(1)
  }, [])

  const handleApplyFilters = useCallback((newFilters: Record<string, string[]>) => {
    setFilters(newFilters)
    setPage(1)
    setFilterDrawerOpen(false)
  }, [])

  const activeFilterCount = Object.values(filters).filter(v => v.length > 0).length

  const viewTitle = view.view_label ?? view.view_code ?? entityType

  return (
    <div className="rv-page">
      {/* Page header */}
      <div className="rv-header">
        <h1 className="rv-header__title">{viewTitle}</h1>
        <span className="rv-header__entity">{entityType}</span>
      </div>

      {/* Toolbar */}
      <div className="rv-toolbar">
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={15} />}
          onClick={() => setCreateModalOpen(true)}
          data-testid="rv-btn-new"
        >
          New Product
        </Button>

        <div className="rv-toolbar__search">
          <Search size={15} className="rv-toolbar__search-icon" />
          <input
            type="text"
            placeholder="Search item code or name…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            data-testid="rv-search"
          />
        </div>

        <Button
          variant={activeFilterCount > 0 ? 'primary' : 'secondary'}
          size="sm"
          icon={<SlidersHorizontal size={15} />}
          onClick={() => setFilterDrawerOpen(true)}
          data-testid="rv-btn-filter"
        >
          Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>

        <span className="rv-toolbar__count" data-testid="rv-record-count">
          <strong>{total}</strong> product{total !== 1 ? 's' : ''}
          {debouncedSearch && ` matching "${debouncedSearch}"`}
        </span>
      </div>

      {/* Table */}
      <div className="rv-body">
        <RuntimeDataTable
          columns={columns}
          records={records}
          loading={isLoading}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* Filter drawer */}
      {filterDrawerNode && (
        <RuntimeFilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          entityType={entityType}
          drawerNode={filterDrawerNode}
          filters={filters}
          onApply={handleApplyFilters}
        />
      )}

      {/* Create modal */}
      <RuntimeCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        entityType={entityType}
      />
    </div>
  )
}
