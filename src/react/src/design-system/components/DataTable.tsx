import type { ReactNode } from 'react'
import { DataGridPro, type GridColDef, type GridRowParams, type GridRenderCellParams } from '@mui/x-data-grid-pro'
import Box from '@mui/material/Box'

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

export function DataTable<T extends object>({
  columns, rows, loading, emptyTitle = 'No data', onRowClick, keyField = 'id' as keyof T,
}: DataTableProps<T>) {
  const safeRows = rows ?? []

  const gridColumns: GridColDef[] = columns.map(col => {
    const colDef: GridColDef = {
      field: col.key,
      headerName: col.label,
      minWidth: 80,
      sortable: col.sortable ?? true,
      align: col.align ?? 'left',
      headerAlign: col.align ?? 'left',
    }
    if (typeof col.width === 'number') {
      colDef.width = col.width
    } else {
      colDef.flex = 1
    }
    if (col.render) {
      colDef.renderCell = (params: GridRenderCellParams) => col.render!(params.row as T)
    }
    return colDef
  })

  return (
    <Box sx={{ width: '100%' }}>
      <DataGridPro
        rows={safeRows}
        columns={gridColumns}
        loading={loading}
        getRowId={row => String((row as Record<string, unknown>)[keyField as string] ?? (row as Record<string, unknown>).id ?? JSON.stringify(row))}
        onRowClick={onRowClick ? (params: GridRowParams) => onRowClick(params.row as T) : undefined}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        localeText={{ noRowsLabel: emptyTitle }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-row': { cursor: onRowClick ? 'pointer' : 'default' },
        }}
      />
    </Box>
  )
}
