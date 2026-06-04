const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

// Dev-mode headers — no auth in initial build
const DEV_HEADERS: Record<string, string> = {
  'x-tenant-id': import.meta.env.VITE_TENANT_ID ?? '00000000-0000-0000-0000-000000000001',
  'x-user-id': import.meta.env.VITE_USER_ID ?? '00000000-0000-0000-0000-000000000001',
  'x-role': import.meta.env.VITE_ROLE ?? 'admin',
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function studioFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...DEV_HEADERS,
    ...((options.headers as Record<string, string>) ?? {}),
  }

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text()
    }
    throw new ApiError(res.status, `${options.method ?? 'GET'} ${path} → ${res.status}`, body)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ── Artifact API ──────────────────────────────────────────────────────────────

export interface Artifact {
  version_id: string
  artifact_id: string
  version_no: number
  artifact_name: string
  artifact_type: string
  tenant_id: string
  node_id?: string
  payload: Record<string, unknown>
  is_active: boolean
  is_draft: boolean
  created_by: string
  created_at: string
  published_at?: string
  published_by?: string
  // Convenience accessors
  id: string // maps to version_id
  entity_type: string // maps to artifact_name for backwards compat
}

export interface ArtifactListResponse {
  items: Artifact[]
  total: number
  next_cursor?: string
}

export const listArtifacts = (params?: { entity_type?: string; status?: string; cursor?: string }) =>
  studioFetch<ArtifactListResponse>(`/artifacts?${new URLSearchParams(params as Record<string, string>).toString()}`).then(response => ({
    ...response,
    items: response.items.map(artifact => ({
      ...artifact,
      id: artifact.version_id,
      entity_type: artifact.artifact_name,
    })),
  }))

export const getArtifact = (id: string) =>
  studioFetch<Artifact>(`/artifacts/${id}`).then(artifact => ({
    ...artifact,
    id: artifact.version_id,
    entity_type: artifact.artifact_name,
  }))

export const createArtifact = (body: { artifact_name: string; artifact_type: string; payload?: Record<string, unknown> }) =>
  studioFetch<Artifact>('/artifacts', { method: 'POST', body: JSON.stringify(body) }).then(artifact => ({
    ...artifact,
    id: artifact.version_id,
    entity_type: artifact.artifact_name,
  }))

export const saveArtifact = (id: string, payload: Record<string, unknown>) =>
  studioFetch<Artifact>(`/artifacts/${id}`, { method: 'PUT', body: JSON.stringify({ payload }) }).then(artifact => ({
    ...artifact,
    id: artifact.version_id,
    entity_type: artifact.artifact_name,
  }))

export const forkArtifact = (id: string) =>
  studioFetch<Artifact>(`/artifacts/${id}/fork`, { method: 'POST' }).then(artifact => ({
    ...artifact,
    id: artifact.version_id,
    entity_type: artifact.artifact_name,
  }))

export const publishArtifact = (id: string) =>
  studioFetch<Artifact>(`/artifacts/${id}/publish`, { method: 'POST' }).then(artifact => ({
    ...artifact,
    id: artifact.version_id,
    entity_type: artifact.artifact_name,
  }))

export const deprecateArtifact = (id: string) =>
  studioFetch<Artifact>(`/artifacts/${id}/deprecate`, { method: 'POST' }).then(artifact => ({
    ...artifact,
    id: artifact.version_id,
    entity_type: artifact.artifact_name,
  }))

export const deleteArtifact = (id: string) =>
  studioFetch<void>(`/artifacts/${id}`, { method: 'DELETE' })

// ── Entity Record API ─────────────────────────────────────────────────────────

export interface EntityRecord {
  id: string
  tenant_id: string
  entity_type: string
  payload: Record<string, unknown>
  status: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface EntityListResponse {
  items: EntityRecord[]
  total: number
  next_cursor?: string
}

export interface TransitionResponse {
  record: EntityRecord
  transition?: { from: string; to: string; command?: string; label?: string }
  action_results?: Array<{ type: string; status: string; output?: Record<string, unknown>; error?: string; skipped?: boolean }>
}

export const listEntityRecords = (type: string, params?: Record<string, string>) =>
  studioFetch<EntityListResponse>(`/entities/${type}?${new URLSearchParams(params).toString()}`)

export const getEntityRecord = (type: string, id: string) =>
  studioFetch<EntityRecord>(`/entities/${type}/${id}`)

export const createEntityRecord = (type: string, payload: Record<string, unknown>) =>
  studioFetch<EntityRecord>(`/entities/${type}`, { method: 'POST', body: JSON.stringify({ payload }) })

export const updateEntityRecord = (type: string, id: string, payload: Record<string, unknown>) =>
  studioFetch<EntityRecord>(`/entities/${type}/${id}`, { method: 'PUT', body: JSON.stringify({ payload }) })

export const transitionEntityRecord = (type: string, id: string, body: { command?: string; to_status?: string; note?: string; payload?: Record<string, unknown> }) =>
  studioFetch<TransitionResponse>(`/entities/${type}/${id}/transition`, { method: 'POST', body: JSON.stringify(body) })

export const deleteEntityRecord = (type: string, id: string) =>
  studioFetch<void>(`/entities/${type}/${id}`, { method: 'DELETE' })

export const restoreEntityRecord = (type: string, id: string) =>
  studioFetch<EntityRecord>(`/entities/${type}/${id}/restore`, { method: 'POST' })

export interface AuditEvent {
  id: string
  entity_type: string
  entity_id: string
  action: string
  actor_id: string
  actor_role?: string
  before_payload?: Record<string, unknown>
  after_payload?: Record<string, unknown>
  created_at: string
}

export const getEntityHistory = (type: string, id: string) =>
  studioFetch<{ items: AuditEvent[] }>(`/entities/${type}/${id}/history`)

// ── Overlay API ───────────────────────────────────────────────────────────────

export interface OverlayDefinition {
  id: string
  tenant_id: string
  entity_type: string
  layer: 'platform' | 'vertical' | 'tenant' | 'node' | 'role'
  scope_key: string
  delta: Record<string, unknown>
  created_at: string
  updated_at: string
}

export const listOverlays = (params?: { entity_type?: string; layer?: string }) =>
  studioFetch<{ items: OverlayDefinition[] }>(`/overlays?${new URLSearchParams(params as Record<string, string>).toString()}`)

export const createOverlay = (body: Omit<OverlayDefinition, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) =>
  studioFetch<OverlayDefinition>('/overlays', { method: 'POST', body: JSON.stringify(body) })

export const deleteOverlay = (id: string) =>
  studioFetch<void>(`/overlays/${id}`, { method: 'DELETE' })

// ── Node Tree API ─────────────────────────────────────────────────────────────

export interface NodeTreeItem {
  id: string
  parent_id?: string
  name: string
  node_type: string
  metadata: Record<string, unknown>
  children?: NodeTreeItem[]
}

export const listNodes = () =>
  studioFetch<{ items: NodeTreeItem[] }>('/nodes')

export const createNode = (body: Omit<NodeTreeItem, 'id' | 'children'>) =>
  studioFetch<NodeTreeItem>('/nodes', { method: 'POST', body: JSON.stringify(body) })

// ── Index Queue API ───────────────────────────────────────────────────────────

export interface IndexQueueItem {
  id: string
  entity_type: string
  index_name: string
  ddl: string
  status: 'pending' | 'applied' | 'failed' | 'discarded'
  created_at: string
  applied_at?: string
}

export const listIndexQueue = (entityKey: string) =>
  studioFetch<{ items: IndexQueueItem[] }>(`/indexes/queue?entity_type=${entityKey}`)

export const applyIndex = (id: string) =>
  studioFetch<IndexQueueItem>(`/indexes/queue/${id}/apply`, { method: 'POST' })

export const discardIndex = (id: string) =>
  studioFetch<IndexQueueItem>(`/indexes/queue/${id}/discard`, { method: 'POST' })

// ── Expression API ────────────────────────────────────────────────────────────

export interface ExpressionEvalResult {
  result: unknown
  error?: string
}

export interface ExpressionValidateResult {
  valid: boolean
  error?: string
}

export const evaluateExpression = (expression: string, sample_data: Record<string, unknown>) =>
  studioFetch<ExpressionEvalResult>('/expressions/evaluate', {
    method: 'POST',
    body: JSON.stringify({ expression, sample_data }),
  })

export const validateExpression = (expression: string) =>
  studioFetch<ExpressionValidateResult>('/expressions/validate', {
    method: 'POST',
    body: JSON.stringify({ expression }),
  })

// ── NLP / AI API ──────────────────────────────────────────────────────────────

export interface NLPChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface NLPChatResponse {
  message: string
  suggestions?: string[]
}

export const nlpChat = (message: string, context: Record<string, unknown>) =>
  studioFetch<NLPChatResponse>('/nlp/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  })

export interface NLPImportedField {
  name: string
  type: string
  required?: boolean
  description?: string
}

export interface NLPImportResponse {
  fields: NLPImportedField[]
}

export const nlpImport = (text: string) =>
  studioFetch<NLPImportResponse>('/nlp/import', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })

// ── View Studio API ───────────────────────────────────────────────────────────

import type {
  View,
  ViewWithPayload,
  ViewVersion,
  ViewListResponse,
  VersionListResponse,
  CreateViewRequest,
  SaveDraftRequest,
  PublishViewRequest,
  RollbackViewRequest,
  ComponentRegistryEntry,
  ComponentListParams,
  ViewListParams,
  Plugin,
  RegisterPluginRequest,
} from '../types/viewStudio'

const STUDIO_PREFIX = '/studio'

// Designer APIs
export const listViews = (params?: ViewListParams) => {
  const qs = new URLSearchParams()
  if (params?.surface) qs.set('surface', params.surface)
  if (params?.entity) qs.set('entity', params.entity)
  if (params?.status) qs.set('status', params.status)
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  return studioFetch<ViewListResponse>(`${STUDIO_PREFIX}/views?${qs.toString()}`)
}

export const createView = (body: CreateViewRequest) =>
  studioFetch<View>(`${STUDIO_PREFIX}/views`, { method: 'POST', body: JSON.stringify(body) })

export const getView = (viewKey: string) =>
  studioFetch<ViewWithPayload>(`${STUDIO_PREFIX}/views/${viewKey}`)

export const saveDraft = (viewKey: string, body: SaveDraftRequest) =>
  studioFetch<ViewVersion>(`${STUDIO_PREFIX}/views/${viewKey}/draft`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })

export const publishView = (viewKey: string, body?: PublishViewRequest) =>
  studioFetch<ViewVersion>(`${STUDIO_PREFIX}/views/${viewKey}/publish`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })

export const rollbackView = (viewKey: string, versionID: string, body?: RollbackViewRequest) =>
  studioFetch<ViewVersion>(`${STUDIO_PREFIX}/views/${viewKey}/rollback/${versionID}`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })

export const archiveView = (viewKey: string) =>
  studioFetch<void>(`${STUDIO_PREFIX}/views/${viewKey}`, { method: 'DELETE' })

export const listViewVersions = (viewKey: string) =>
  studioFetch<VersionListResponse>(`${STUDIO_PREFIX}/views/${viewKey}/versions`)

// Runtime APIs (only returns published/active views)
export const getRuntimeView = (viewKey: string) =>
  studioFetch<ViewVersion>(`${STUDIO_PREFIX}/runtime/views/${viewKey}`)

export const getRuntimeViewByCode = (viewCode: string) =>
  studioFetch<ViewVersion>(`${STUDIO_PREFIX}/runtime/views/by-code/${viewCode}`)

// Component Registry
export const listComponentRegistry = (params?: ComponentListParams) => {
  const qs = new URLSearchParams()
  if (params?.surface) qs.set('surface', params.surface)
  if (params?.category) qs.set('category', params.category)
  return studioFetch<ComponentRegistryEntry[]>(`${STUDIO_PREFIX}/component-registry?${qs.toString()}`)
}

export const getComponentEntry = (code: string) =>
  studioFetch<ComponentRegistryEntry>(`${STUDIO_PREFIX}/component-registry/${code}`)

// Plugins
export const listPlugins = () =>
  studioFetch<Plugin[]>(`${STUDIO_PREFIX}/plugins`)

export const registerPlugin = (body: RegisterPluginRequest) =>
  studioFetch<Plugin>(`${STUDIO_PREFIX}/plugins`, { method: 'POST', body: JSON.stringify(body) })

export const removePlugin = (pluginID: string) =>
  studioFetch<void>(`${STUDIO_PREFIX}/plugins/${pluginID}`, { method: 'DELETE' })