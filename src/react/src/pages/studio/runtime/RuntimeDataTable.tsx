import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Spinner, EmptyState, Button } from '../../../design-system'
import type { EntityRecord } from '../../../config/studioApi'

interface ColDef {
  key: string
  label: string
  sortable?: boolean
  type?: string
}

interface RuntimeDataTableProps {
  columns: ColDef[]
  records: EntityRecord[]
  loading: boolean
  sortBy: string | undefined
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

function BoolPill({ value }: { value: unknown }) {
  const active = value === true || value === 'true'
  return (
    <span className={`rv-bool-pill rv-bool-pill--${active}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function RuntimeDataTable({
  columns, records, loading, sortBy, sortDir, onSort,
  page, pageSize, total, onPageChange,
}: RuntimeDataTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (loading) {
    return (
      <div className="rv-table-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <Spinner />
      </div>
    )
  }

  if (!records.length) {
    return (
      <div className="rv-table-wrap">
        <EmptyState title="No products found" description="Try adjusting your search or filters." />
      </div>
    )
  }

  return (
    <div className="rv-table-wrap" data-testid="rv-data-table">
      <table className="ex-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            {columns.map(col => {
              const isActive = sortBy === col.key
              return (
                <th
                  key={col.key}
                  className={col.sortable ? 'rv-th' : undefined}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                  data-testid={`rv-col-${col.key}`}
                >
                  <div className="rv-th-inner">
                    {col.label}
                    {col.sortable && (
                      isActive
                        ? sortDir === 'asc'
                          ? <ChevronUp size={13} className="rv-sort-icon rv-sort-icon--active" />
                          : <ChevronDown size={13} className="rv-sort-icon rv-sort-icon--active" />
                        : <ChevronsUpDown size={13} className="rv-sort-icon" />
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id} data-testid="rv-row">
              {columns.map(col => {
                const rawVal = record.payload[col.key]
                return (
                  <td key={col.key}>
                    {col.type === 'boolean'
                      ? <BoolPill value={rawVal} />
                      : rawVal == null ? <span style={{ color: 'var(--fg-tertiary)' }}>—</span>
                      : String(rawVal)
                    }
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="rv-pagination" data-testid="rv-pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ← Prev
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  )
}
