import type { ReactNode } from 'react'
import {
  DataGridPro,
  type GridColDef,
  type GridRowParams,
  type GridRenderCellParams,
  GridActionsCellItem,
} from '@mui/x-data-grid-pro'
import Box from '@mui/material/Box'
import MoreVertIcon from '@mui/icons-material/MoreVert'

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

export function VirtualGrid<T extends object>({
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
  const gridColumns: GridColDef[] = columns.map(col => {
    const colDef: GridColDef = {
      field: col.key,
      headerName: col.label,
      minWidth: 80,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => col.render(params.row as T),
    }
    if (col.width) {
      colDef.width = col.width
    } else {
      colDef.flex = 1
    }
    return colDef
  })

  if (rowActions && rowActions.length > 0) {
    gridColumns.push({
      field: '__actions__',
      type: 'actions',
      headerName: '',
      width: 52,
      getActions: (params: GridRowParams) =>
        rowActions.map(action => (
          <GridActionsCellItem
            key={action.label}
            label={action.label}
            icon={<MoreVertIcon fontSize="small" />}
            onClick={() => action.onClick(params.row as T)}
            showInMenu
          />
        )),
    })
  }

  return (
    <Box data-testid={dataTestId} sx={{ width: '100%' }}>
      <DataGridPro
        rows={data}
        columns={gridColumns}
        loading={loading}
        getRowId={getRowId
          ? row => getRowId(row as T)
          : row => String((row as Record<string, unknown>).id ?? (row as Record<string, unknown>).artifact_id ?? JSON.stringify(row))
        }
        onRowClick={onRowClick ? (params: GridRowParams) => onRowClick(params.row as T) : undefined}
        checkboxSelection={selectable}
        rowSelectionModel={selectedIds as unknown as import('@mui/x-data-grid-pro').GridRowSelectionModel}
        onRowSelectionModelChange={model => {
          const rawIds = Array.isArray(model)
            ? (model as string[])
            : Array.from(((model as { ids?: Set<string> }).ids) ?? [])
          onSelectionChange?.(rawIds as string[])
        }}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        localeText={{ noRowsLabel: emptyMessage }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-row': { cursor: onRowClick ? 'pointer' : 'default' },
        }}
      />
    </Box>
  )
}
