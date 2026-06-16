import { useState, useRef, useCallback, type ReactNode } from 'react'
import { Skeleton } from './Spinner'
import { EmptyState } from './EmptyState'
import { ActionMenu } from './ActionMenu'

export interface VirtualGridColumn<T> {
  key: string
  label: string
  width?: number
  render: (row: T) => ReactNode
}

export interface RowAction<T> {
  label: string
  onClick: (row: T) => void
  variant?: 'default' | 'danger'
}

export interface VirtualGridProps<T> {
  columns: VirtualGridColumn<T>[]
  data: T[]
  loading?: boolean
  rowActions?: RowAction<T>[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  getRowId?: (row: T) => string
  'data-testid'?: string
}

const ROW_HEIGHT = 48
const OVERSCAN = 10

export function VirtualGrid<T>({
  columns,
  data,
  loading,
  rowActions,
  onRowClick,
  emptyMessage = 'No data',
  selectable,
  selectedIds = [],
  onSelectionChange,
  getRowId,
  'data-testid': dataTestId,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const containerHeight = 480

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  if (loading) {
    return (
      <div className="ex-table-wrap" data-testid={dataTestId}>
        <table className="ex-table" style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {selectable && <th style={{ width: 40 }} />}
              {columns.map(col => (
                <th key={col.key} style={{ width: col.width }}>{col.label}</th>
              ))}
              {rowActions && rowActions.length > 0 && <th style={{ width: 48 }} />}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                {selectable && <td><Skeleton width={18} height={18} /></td>}
                {columns.map(col => (
                  <td key={col.key}><Skeleton height={14} width={col.width ?? '80%'} /></td>
                ))}
                {rowActions && rowActions.length > 0 && <td><Skeleton width={28} height={28} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="ex-table-wrap" data-testid={dataTestId}>
        <EmptyState title={emptyMessage} />
      </div>
    )
  }

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2
  const endIndex = Math.min(data.length - 1, startIndex + visibleCount)
  const visibleRows = data.slice(startIndex, endIndex + 1)
  const paddingTop = startIndex * ROW_HEIGHT
  const paddingBottom = Math.max(0, (data.length - endIndex - 1) * ROW_HEIGHT)

  const toggleSelect = (id: string) => {
    if (!onSelectionChange) return
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(s => s !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const toggleAll = () => {
    if (!onSelectionChange || !getRowId) return
    const allIds = data.map(getRowId)
    if (selectedIds.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(allIds)
    }
  }

  return (
    <div className="ex-table-wrap" data-testid={dataTestId}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ height: containerHeight, overflowY: 'auto', overflowX: 'auto' }}
      >
        <table className="ex-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              {selectable && getRowId && (
                <th style={{ width: 40 }}>
                  <label className="ex-check">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === data.length && data.length > 0}
                      onChange={toggleAll}
                    />
                    <span />
                  </label>
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} style={{ width: col.width }}>{col.label}</th>
              ))}
              {rowActions && rowActions.length > 0 && <th style={{ width: 48 }} />}
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr style={{ height: paddingTop }}>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions?.length ? 1 : 0)} />
              </tr>
            )}
            {visibleRows.map((row, i) => {
              const rowId = getRowId ? getRowId(row) : String(startIndex + i)
              const isSelected = selectedIds.includes(rowId)
              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    height: ROW_HEIGHT,
                    background: isSelected ? 'var(--brand-50)' : undefined,
                  }}
                >
                  {selectable && getRowId && (
                    <td onClick={e => e.stopPropagation()}>
                      <label className="ex-check">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(rowId)}
                        />
                        <span />
                      </label>
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key}>{col.render(row)}</td>
                  ))}
                  {rowActions && rowActions.length > 0 && (
                    <td onClick={e => e.stopPropagation()} style={{ textAlign: 'right' }}>
                      <ActionMenu
                        items={rowActions.map(action => ({
                          label: action.label,
                          onClick: () => action.onClick(row),
                          variant: action.variant,
                        }))}
                      />
                    </td>
                  )}
                </tr>
              )
            })}
            {paddingBottom > 0 && (
              <tr style={{ height: paddingBottom }}>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions?.length ? 1 : 0)} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="ex-table-foot">
        <span>{data.length} row{data.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
