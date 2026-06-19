import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listEntityRecords, createEntityRecord, getDistinctFieldValues } from '../config/studioApi'

export interface EntityRecordParams {
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  filters?: Record<string, string[]>
  page?: number
  pageSize?: number
}

function buildQueryParams(params: EntityRecordParams): Record<string, string> {
  const p: Record<string, string> = {}
  const pageSize = params.pageSize ?? 25
  const page = params.page ?? 1
  p.limit = String(pageSize)
  p.offset = String((page - 1) * pageSize)
  if (params.search) p.search = params.search
  if (params.sortBy) p.sort_by = params.sortBy
  if (params.sortDir) p.sort_dir = params.sortDir
  if (params.filters) {
    for (const [field, values] of Object.entries(params.filters)) {
      if (values.length > 0) {
        p[`filter_${field}`] = values[0]
      }
    }
  }
  return p
}

export function useEntityRecords(entityType: string, params: EntityRecordParams = {}) {
  return useQuery({
    queryKey: ['entity-records', entityType, params],
    queryFn: () => listEntityRecords(entityType, buildQueryParams(params)),
    enabled: !!entityType,
    staleTime: 10_000,
  })
}

export function useCreateEntityRecord(entityType: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createEntityRecord(entityType, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-records', entityType] })
    },
  })
}

export function useDistinctFieldValues(entityType: string, fieldKey: string) {
  return useQuery({
    queryKey: ['distinct-field', entityType, fieldKey],
    queryFn: () => getDistinctFieldValues(entityType, fieldKey),
    enabled: !!entityType && !!fieldKey,
    staleTime: 60_000,
  })
}
