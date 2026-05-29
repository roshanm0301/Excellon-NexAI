const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

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

export interface ArtifactListResponse {
  items: Artifact[]
  total: number
  next_cursor?: string
}

export const listArtifacts = (params?: { entity_type?: string; status?: string; cursor?: string }) =>
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
  studioFetch<Artifact>(`/artifacts/${id}/publish`, { method: 'POST' })

export const deprecateArtifact = (id: string) =>
  studioFetch<Artifact>(`/artifacts/${id}/deprecate`, { method: 'POST' })

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
