const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

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
  const url = path.startsWith('/api/') ? `${API_BASE}${path}` : `${API_BASE}/api/v1${path}`
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
  id: string
  tenant_id: string
  entity_type: string
  version: number
  status: 'draft' | 'in-review' | 'published' | 'deprecated'
  payload: Record<string, unknown>
  content_hash?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ArtifactVersion {
  id: string
  artifactId: string
  versionNo: number
  status: 'draft' | 'in-review' | 'published' | 'deprecated'
  payload: Record<string, unknown>
  createdBy: string
  createdAt: string
}

export interface ArtifactListResponse {
  items: Artifact[]
  total: number
  next_cursor?: string
}

export const listArtifacts = (params?: { artifact_type?: string; entity_type?: string; status?: string; cursor?: string }) =>
  studioFetch<ArtifactListResponse>(`/artifacts?${new URLSearchParams(params as Record<string, string>).toString()}`)

export const getArtifact = (id: string) =>
  studioFetch<Artifact>(`/artifacts/${id}`)

export const createArtifact = (body: { entity_type: string; payload?: Record<string, unknown> }) =>
  studioFetch<Artifact>('/artifacts', { method: 'POST', body: JSON.stringify(body) })

export const saveArtifact = (id: string, payload: Record<string, unknown>) =>
  studioFetch<Artifact>(`/artifacts/${id}`, { method: 'PUT', body: JSON.stringify({ payload }) })

export const forkArtifact = (id: string) =>
  studioFetch<Artifact>(`/artifacts/${id}/fork`, { method: 'POST' })

export const publishArtifact = (id: string) =>
  studioFetch<Artifact>(`/artifacts/${id}/versions/latest/publish`, { method: 'POST' })

export const deprecateArtifact = (id: string) =>
  studioFetch<Artifact>(`/artifacts/${id}/deprecate`, { method: 'POST' })

export const deleteArtifact = (id: string) =>
  studioFetch<void>(`/artifacts/${id}`, { method: 'DELETE' })

export async function getArtifactVersions(id: string): Promise<ArtifactVersion[]> {
  return studioFetch<ArtifactVersion[]>(`/artifacts/${id}/versions`)
}

export async function getActiveArtifact(id: string): Promise<ArtifactVersion> {
  return studioFetch<ArtifactVersion>(`/artifacts/${id}/active`)
}

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

// ── Rule Set API ──────────────────────────────────────────────────────────────

export interface Condition {
  type: 'AND' | 'OR' | 'NOT' | 'FIELD'
  field?: string
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'in' | 'notIn' | 'isNull' | 'isNotNull'
  value?: string | number | boolean | string[]
  conditions?: Condition[]
}

export interface RuleAction {
  type: 'BLOCK' | 'WARN' | 'SET_FIELD'
  message?: string
  field?: string
  value?: unknown
}

export interface RuleSet {
  id: string
  tenant_id?: string
  entity_type: string
  name: string
  definition: {
    conditions: Condition
    actions: RuleAction[]
  }
  enabled: boolean
  created_at: string
  updated_at: string
}

export const listRuleSets = (entityType?: string) =>
  studioFetch<{ items: RuleSet[] }>(`/rules${entityType ? `?entity_type=${entityType}` : ''}`)

export const getRuleSet = (id: string) =>
  studioFetch<RuleSet>(`/rules/${id}`)

export const saveRuleSet = (id: string, body: Partial<RuleSet>) =>
  studioFetch<RuleSet>(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const createRuleSet = (body: { entity_type: string; name: string }) =>
  studioFetch<RuleSet>('/rules', { method: 'POST', body: JSON.stringify(body) })

export const deleteRuleSet = (id: string) =>
  studioFetch<void>(`/rules/${id}`, { method: 'DELETE' })

// ── Index Queue API ───────────────────────────────────────────────────────────

export interface IndexQueueItem {
  id: string
  tenantId: string
  entityKey: string
  indexName: string
  ddl: string
  status: 'pending' | 'applied' | 'failed' | 'discarded'
  errorMessage?: string
  createdAt: string
  appliedAt?: string
}

export async function listIndexQueue(entityKey: string): Promise<IndexQueueItem[]> {
  return studioFetch<IndexQueueItem[]>(`/admin/indexes?entity_key=${encodeURIComponent(entityKey)}`)
}

export async function applyIndex(id: string): Promise<void> {
  return studioFetch<void>(`/admin/indexes/${id}/apply`, { method: 'POST' })
}

export async function discardIndex(id: string): Promise<void> {
  return studioFetch<void>(`/admin/indexes/${id}/discard`, { method: 'POST' })
}

// ── Node Tree API ─────────────────────────────────────────────────────────────

export interface StudioNode {
  nodeId: string
  tenantId: string
  name: string
  nodeType: string
  parentId?: string
  metadata: Record<string, unknown>
}

export interface NodeTreeItem {
  id: string
  parent_id?: string
  name: string
  node_type: string
  metadata: Record<string, unknown>
  children?: NodeTreeItem[]
}

export async function listNodes(): Promise<StudioNode[]> {
  return studioFetch<StudioNode[]>('/admin/nodes')
}

export async function getNodeTree(): Promise<StudioNode[]> {
  return studioFetch<StudioNode[]>('/admin/nodes/tree')
}

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

export interface OverlayDelta {
  id: string
  tenantId: string
  artifactType: string
  artifactKey: string
  layer: 'platform' | 'vertical' | 'tenant' | 'node' | 'role'
  scopeRef: string
  deltaJson: Record<string, unknown>
  createdAt: string
}

export async function listOverlays(artifactType: string, artifactKey: string): Promise<OverlayDelta[]> {
  return studioFetch<OverlayDelta[]>(
    `/admin/overlay-deltas?artifact_type=${encodeURIComponent(artifactType)}&artifact_key=${encodeURIComponent(artifactKey)}`,
  )
}

export async function createOverlayDelta(delta: Partial<OverlayDelta>): Promise<OverlayDelta> {
  return studioFetch<OverlayDelta>('/admin/overlay-deltas', { method: 'POST', body: JSON.stringify(delta) })
}

export async function deleteOverlayDelta(id: string): Promise<void> {
  return studioFetch<void>(`/admin/overlay-deltas/${id}`, { method: 'DELETE' })
}

export const createOverlay = (body: Omit<OverlayDefinition, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) =>
  studioFetch<OverlayDefinition>('/overlays', { method: 'POST', body: JSON.stringify(body) })

export const deleteOverlay = (id: string) =>
  studioFetch<void>(`/overlays/${id}`, { method: 'DELETE' })

// ── NLP API ───────────────────────────────────────────────────────────────────

export interface FieldDef {
  name: string
  label: string
  fieldType: string
  required?: boolean
  storageType?: 'physical' | 'computed'
  expression?: string
}

export async function nlpChat(message: string, context: unknown): Promise<{ reply: string }> {
  return studioFetch<{ reply: string }>('/api/nlp/chat', { method: 'POST', body: JSON.stringify({ message, context }) })
}

export async function nlpImport(description: string): Promise<{ fields: FieldDef[] }> {
  return studioFetch<{ fields: FieldDef[] }>('/api/nlp/import', { method: 'POST', body: JSON.stringify({ description }) })
}

// ── Expression API ────────────────────────────────────────────────────────────

export async function evaluateExpression(
  expr: string,
  data: Record<string, unknown>,
): Promise<{ result: unknown }> {
  return studioFetch<{ result: unknown }>('/expressions/evaluate', {
    method: 'POST',
    body: JSON.stringify({ expression: expr, data }),
  })
}

export async function validateExpression(expr: string): Promise<{ valid: boolean; error?: string }> {
  return studioFetch<{ valid: boolean; error?: string }>('/expressions/validate', {
    method: 'POST',
    body: JSON.stringify({ expression: expr }),
  })
}
