import { featureFlags } from './featureFlags'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN

// Dev-mode headers â€” no auth in initial build
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
    ...(featureFlags.devAuthHeaders ? DEV_HEADERS : {}),
    ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
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
    throw new ApiError(res.status, `${options.method ?? 'GET'} ${path} â†’ ${res.status}`, body)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// â”€â”€ Artifact API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Entity Record API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

export const listEntityRecords = (type: string, params?: Record<string, string>) =>
  studioFetch<EntityListResponse>(`/entities/${type}?${new URLSearchParams(params).toString()}`)

export const getEntityRecord = (type: string, id: string) =>
  studioFetch<EntityRecord>(`/entities/${type}/${id}`)

export const createEntityRecord = (type: string, payload: Record<string, unknown>) =>
  studioFetch<EntityRecord>(`/entities/${type}`, { method: 'POST', body: JSON.stringify({ payload }) })

export const updateEntityRecord = (type: string, id: string, payload: Record<string, unknown>) =>
  studioFetch<EntityRecord>(`/entities/${type}/${id}`, { method: 'PUT', body: JSON.stringify({ payload }) })

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

// â”€â”€ Overlay API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

interface OverlayApiRecord {
  id: string
  tenant_id: string
  artifact_type: string
  artifact_key: string
  layer: OverlayDefinition['layer']
  scope_ref: string
  delta_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

function toOverlayDefinition(record: OverlayApiRecord): OverlayDefinition {
  return {
    id: record.id,
    tenant_id: record.tenant_id,
    entity_type: record.artifact_key || record.artifact_type,
    layer: record.layer,
    scope_key: record.scope_ref,
    delta: record.delta_json ?? {},
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

function featureDisabled(feature: string): Promise<never> {
  return Promise.reject(new ApiError(404, `${feature} is disabled`, {
    error: {
      code: 'FEATURE_DISABLED',
      message: `${feature} is disabled`,
    },
  }))
}

export const listOverlays = (params?: { entity_type?: string; layer?: string }) => {
  const qs = new URLSearchParams()
  if (params?.entity_type) qs.set('artifact_type', params.entity_type)
  if (params?.layer) qs.set('layer', params.layer)
  return studioFetch<OverlayApiRecord[]>(`/admin/overlay-deltas?${qs.toString()}`).then(items => ({
    items: items.map(toOverlayDefinition),
  }))
}

export const createOverlay = (body: Omit<OverlayDefinition, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) =>
  studioFetch<OverlayApiRecord>('/admin/overlay-deltas', {
    method: 'POST',
    body: JSON.stringify({
      artifact_type: 'entity_schema',
      artifact_key: body.entity_type,
      layer: body.layer,
      scope_ref: body.scope_key,
      delta_json: body.delta,
    }),
  }).then(toOverlayDefinition)

export const deleteOverlay = (id: string) =>
  studioFetch<void>(`/admin/overlay-deltas/${id}`, { method: 'DELETE' })

// â”€â”€ Node Tree API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface NodeTreeItem {
  id: string
  parent_id?: string
  name: string
  node_type: string
  metadata: Record<string, unknown>
  children?: NodeTreeItem[]
}

export const listNodes = () =>
  studioFetch<{ items: NodeTreeItem[] }>('/admin/nodes')

export const createNode = (body: Omit<NodeTreeItem, 'id' | 'children'>) =>
  studioFetch<NodeTreeItem>('/admin/nodes', { method: 'POST', body: JSON.stringify(body) })

// â”€â”€ Index Queue API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  studioFetch<IndexQueueItem[]>(`/admin/indexes?entity_key=${entityKey}`).then(items => ({ items }))

export const applyIndex = (id: string) =>
  studioFetch<IndexQueueItem>(`/admin/indexes/${id}/apply`, { method: 'POST' })

export const discardIndex = (id: string) =>
  studioFetch<IndexQueueItem>(`/admin/indexes/${id}/discard`, { method: 'POST' })

// â”€â”€ Expression API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ NLP / AI API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface NLPChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface NLPChatResponse {
  message: string
  suggestions?: string[]
}

export const nlpChat = (message: string, context: Record<string, unknown>) =>
  featureFlags.aiAssistant
    ? studioFetch<NLPChatResponse>('/nlp/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
      })
    : featureDisabled('AI Assistant')

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
  featureFlags.aiAssistant
    ? studioFetch<NLPImportResponse>('/nlp/import', {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    : featureDisabled('AI Assistant')


// â”€â”€ View Studio API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  EntityTypeSummary,
  EntityFieldDef,
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

export const getRuntimeViewByCode = (viewCode: string, entity: string, surface: string) =>
  studioFetch<ViewVersion>(`${STUDIO_PREFIX}/runtime/views/by-code/${viewCode}?${new URLSearchParams({ entity, surface }).toString()}`)

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
  featureFlags.studioPlugins
    ? studioFetch<Plugin[]>(`${STUDIO_PREFIX}/plugins`)
    : Promise.resolve([])

export const registerPlugin = (body: RegisterPluginRequest) =>
  featureFlags.studioPlugins
    ? studioFetch<Plugin>(`${STUDIO_PREFIX}/plugins`, { method: 'POST', body: JSON.stringify(body) })
    : featureDisabled('Studio plugins')

export const removePlugin = (pluginID: string) =>
  featureFlags.studioPlugins
    ? studioFetch<void>(`${STUDIO_PREFIX}/plugins/${pluginID}`, { method: 'DELETE' })
    : featureDisabled('Studio plugins')

// ── Entity Schema APIs (M3.2) ────────────────────────────────────────────────

export const listEntityTypes = () =>
  studioFetch<{ items: EntityTypeSummary[] }>(`${STUDIO_PREFIX}/entities`)

export const getEntityFields = (entityType: string) =>
  studioFetch<{ items: EntityFieldDef[] }>(`${STUDIO_PREFIX}/entities/${encodeURIComponent(entityType)}/fields`)


