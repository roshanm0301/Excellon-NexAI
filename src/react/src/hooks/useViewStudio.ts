import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listViews,
  createView,
  getView,
  saveDraft,
  publishView,
  rollbackView,
  archiveView,
  listViewVersions,
  getRuntimeView,
  getRuntimeViewByCode,
  listComponentRegistry,
  listPlugins,
  registerPlugin,
  removePlugin,
} from '../config/studioApi'
import type {
  ViewListParams,
  CreateViewRequest,
  SaveDraftRequest,
  PublishViewRequest,
  ComponentListParams,
  RegisterPluginRequest,
} from '../types/viewStudio'

// ─── View Queries ────────────────────────────────────────────────────────────

export function useViews(params?: ViewListParams) {
  return useQuery({
    queryKey: ['views', params],
    queryFn: () => listViews(params),
  })
}

export function useView(viewKey: string | undefined) {
  return useQuery({
    queryKey: ['view', viewKey],
    queryFn: () => getView(viewKey!),
    enabled: !!viewKey,
  })
}

export function useViewVersions(viewKey: string | undefined) {
  return useQuery({
    queryKey: ['view-versions', viewKey],
    queryFn: () => listViewVersions(viewKey!),
    enabled: !!viewKey,
  })
}

export function useRuntimeView(viewKey: string | undefined) {
  return useQuery({
    queryKey: ['runtime-view', viewKey],
    queryFn: () => getRuntimeView(viewKey!),
    enabled: !!viewKey,
  })
}

export function useRuntimeViewByCode(viewCode: string | undefined) {
  return useQuery({
    queryKey: ['runtime-view-code', viewCode],
    queryFn: () => getRuntimeViewByCode(viewCode!),
    enabled: !!viewCode,
  })
}

// ─── View Mutations ──────────────────────────────────────────────────────────

export function useCreateView() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateViewRequest) => createView(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['views'] })
    },
  })
}

export function useSaveDraft(viewKey: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SaveDraftRequest) => saveDraft(viewKey, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['view', viewKey] })
      qc.invalidateQueries({ queryKey: ['view-versions', viewKey] })
    },
  })
}

export function usePublishView(viewKey: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body?: PublishViewRequest) => publishView(viewKey, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['view', viewKey] })
      qc.invalidateQueries({ queryKey: ['views'] })
      qc.invalidateQueries({ queryKey: ['view-versions', viewKey] })
    },
  })
}

export function useRollbackView(viewKey: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (versionID: string) => rollbackView(viewKey, versionID),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['view', viewKey] })
      qc.invalidateQueries({ queryKey: ['views'] })
      qc.invalidateQueries({ queryKey: ['view-versions', viewKey] })
    },
  })
}

export function useArchiveView() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (viewKey: string) => archiveView(viewKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['views'] })
    },
  })
}

// ─── Component Registry ──────────────────────────────────────────────────────

export function useComponentRegistry(params?: ComponentListParams) {
  return useQuery({
    queryKey: ['component-registry', params],
    queryFn: () => listComponentRegistry(params),
    staleTime: 5 * 60 * 1000, // components rarely change
  })
}

// ─── Plugin Queries & Mutations ──────────────────────────────────────────────

export function usePlugins() {
  return useQuery({
    queryKey: ['plugins'],
    queryFn: () => listPlugins(),
  })
}

export function useRegisterPlugin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RegisterPluginRequest) => registerPlugin(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plugins'] })
      qc.invalidateQueries({ queryKey: ['component-registry'] })
    },
  })
}

export function useRemovePlugin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pluginId: string) => removePlugin(pluginId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plugins'] })
      qc.invalidateQueries({ queryKey: ['component-registry'] })
    },
  })
}
