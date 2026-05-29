import { useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Spinner } from './Spinner'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  label: string
  width?: number | string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  keyField?: keyof T
}

export function DataTable<T extends Record<string, unknown>>({
  columns, rows, loading, emptyTitle = 'No data', emptyDescription, onRowClick, keyField = 'id' as keyof T,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const sorted = sort
    ? [...rows].sort((a, b) => {
        const av = a[sort.key]; const bv = b[sort.key]
        if (av < bv) return sort.dir === 'asc' ? -1 : 1
        if (av > bv) return sort.dir === 'asc' ? 1 : -1
        return 0
      })
    : rows

  const toggleSort = (key: string) => {
    setSort(s => s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  return (
    <div className="ex-table-wrap">
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner />
        </div>
      )}
      {!loading && rows.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
      {!loading && rows.length > 0 && (
        <table className="ex-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align ?? 'left', cursor: col.sortable ? 'pointer' : 'default' }}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && sort?.key === col.key && (
                    <span className="sort">
                      {sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={String(row[keyField])} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
