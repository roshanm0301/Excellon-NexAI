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
  studioFetch<{ items: RuleSet[] }>(`/admin/rules${entityType ? `?entity_type=${entityType}` : ''}`)

export const getRuleSet = (id: string) =>
  studioFetch<RuleSet>(`/admin/rules/${id}`)

export const saveRuleSet = (id: string, body: Partial<RuleSet>) =>
  studioFetch<RuleSet>(`/admin/rules/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const createRuleSet = (body: { entity_type: string; name: string }) =>
  studioFetch<RuleSet>('/admin/rules', { method: 'POST', body: JSON.stringify(body) })

export const deleteRuleSet = (id: string) =>
  studioFetch<void>(`/admin/rules/${id}`, { method: 'DELETE' })

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

// ── Rule Engine V2 API ────────────────────────────────────────────────────────

export type HitPolicy = 'FIRST' | 'UNIQUE' | 'ANY' | 'COLLECT' | 'PRIORITY' | 'RULE_ORDER'
export type RuleClassification = 'VALIDATION' | 'DERIVATION' | 'APPROVAL' | 'FIELD_CONTROL' | 'ELIGIBILITY' | 'EXTENSION'
export type ContentType = 'condition_tree' | 'decision_table'
export type ActionTypeV2 = 'BLOCK' | 'WARN' | 'SET_FIELD' | 'REQUIRE_APPROVAL' | 'FIELD_BEHAVIOR' | 'INVOKE_SERVICE' | 'REQUIRE_FIELD' | 'NOTIFY' | 'ESCALATE'
export type FieldBehaviorType = 'HIDDEN' | 'READONLY' | 'REQUIRED' | 'OPTIONAL' | 'DISABLED'

export interface DTColumn {
  id: string
  name: string
  fieldPath: string
  direction: 'input' | 'output'
  dataType?: string
}

export interface DTCell {
  columnId: string
  expression: string
}

export interface DTRow {
  id: string
  cells: DTCell[]
  enabled: boolean
  priority?: number
}

export interface DecisionTable {
  columns: DTColumn[]
  rows: DTRow[]
  hitPolicy: HitPolicy
}

export interface ActionV2 {
  type: ActionTypeV2
  message?: string
  field?: string
  value?: unknown
  behavior?: FieldBehaviorType
  category?: string
  approverRole?: string
  serviceKey?: string
  serviceMethod?: string
  priority?: number
}

export interface RuleSetV2 {
  id: string
  tenant_id?: string
  entity_type: string
  name: string
  content_type: ContentType
  classifications: RuleClassification[]
  priority: number
  hit_policy?: HitPolicy
  decision_table?: DecisionTable
  conditions?: Condition
  actions: ActionV2[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ConflictMatrixEntry {
  field: string
  resolution_type: 'last_writer' | 'first_writer' | 'most_restrictive' | 'custom_rule'
  custom_expr?: string
}

export interface SimulationTrace {
  ruleKey: string
  rowId?: string
  matched: boolean
  conditionOk: boolean
  error?: string
}

export interface SimulationResult {
  blocked: boolean
  blockMessage?: string
  warnings: string[]
  mutations: Record<string, unknown>
  fieldBehaviors: Record<string, FieldBehaviorType>
  approvalRequests: Array<{ category: string; reason: string; approverRole: string }>
  firedRules: Array<{ ruleKey: string; rowId?: string; priority: number }>
  conflictLog: Array<{ field: string; resolution: string; winner: string }>
  trace: SimulationTrace[]
}

export interface ExecutionLogEntry {
  id: string
  tenant_id: string
  rule_set_key: string
  entity_type: string
  entity_id: string
  trigger_type: string
  fired_rules: string[]
  blocked: boolean
  duration_ms: number
  created_at: string
}

// Rule Sets V2
export const listRuleSetsV2 = (entityType?: string, classification?: RuleClassification) => {
  const params = new URLSearchParams()
  if (entityType) params.set('entity_type', entityType)
  if (classification) params.set('classification', classification)
  return studioFetch<{ items: RuleSetV2[] }>(`/admin/rules/v2/classified?${params.toString()}`)
}

export const getRuleSetV2 = (id: string) =>
  studioFetch<RuleSetV2>(`/admin/rules/${id}`)

export const saveRuleSetV2 = (id: string, body: Partial<RuleSetV2>) =>
  studioFetch<RuleSetV2>(`/admin/rules/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const createRuleSetV2 = (body: {
  entity_type: string
  name: string
  content_type: ContentType
  classifications?: RuleClassification[]
  hit_policy?: HitPolicy
}) =>
  studioFetch<RuleSetV2>('/admin/rules', { method: 'POST', body: JSON.stringify(body) })

// Simulation
export const simulateRules = (body: {
  entity_type: string
  trigger_type?: string
  payload: Record<string, unknown>
}) =>
  studioFetch<SimulationResult>('/admin/rules/v2/simulate', { method: 'POST', body: JSON.stringify(body) })

// Conflict Matrix
export const getConflictMatrix = (ruleSetKey: string) =>
  studioFetch<{ items: ConflictMatrixEntry[] }>(`/admin/rules/v2/${ruleSetKey}/conflict-matrix`)

export const saveConflictMatrixEntry = (ruleSetKey: string, entry: ConflictMatrixEntry) =>
  studioFetch<ConflictMatrixEntry>(`/admin/rules/v2/${ruleSetKey}/conflict-matrix/${entry.field}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  })

export const deleteConflictMatrixEntry = (ruleSetKey: string, field: string) =>
  studioFetch<void>(`/admin/rules/v2/${ruleSetKey}/conflict-matrix/${field}`, { method: 'DELETE' })

// Execution Log
export const getExecutionLog = (params?: { entity_type?: string; limit?: number }) => {
  const qs = new URLSearchParams()
  if (params?.entity_type) qs.set('entity_type', params.entity_type)
  if (params?.limit) qs.set('limit', String(params.limit))
  return studioFetch<{ items: ExecutionLogEntry[] }>(`/admin/rules/v2/execution-log?${qs.toString()}`)
}

// ── Workflow Engine V2 API ────────────────────────────────────────────────────

export type GatewayType = 'parallel' | 'exclusive' | 'inclusive'
export type StepType = 'approval' | 'service_call' | 'rule_evaluation' | 'wait' | 'sub_workflow' | 'script' | 'gateway'
export type NodeStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting'
export type ApprovalMode = 'sequential' | 'parallel'
export type ApprovalPolicy = 'unanimous' | 'majority' | 'any'
export type WorkflowInstanceStatus = 'running' | 'completed' | 'failed' | 'aborted' | 'waiting'
export type TriggerEvent = 'on_create' | 'on_update' | 'on_status_change' | 'on_field_change' | 'manual'

export interface DAGNode {
  id: string
  name: string
  type: StepType
  config?: Record<string, unknown>
  timeoutMins?: number
  retryCount?: number
  metadata?: Record<string, string> // UI positioning: x, y
}

export interface DAGEdge {
  id: string
  source: string
  target: string
  condition?: string
  label?: string
  priority?: number
}

export interface DAGGateway {
  id: string
  name: string
  type: GatewayType
  isJoin: boolean
  joinPolicy?: string
}

export interface DAGDefinition {
  startNodeId: string
  endNodeId?: string
  nodes: DAGNode[]
  edges: DAGEdge[]
  gateways?: DAGGateway[]
}

export interface ApproverDef {
  type: 'role' | 'user' | 'expression'
  value: string
  order?: number
}

export interface EscalationConfig {
  timeoutMins: number
  escalateTo: string
  autoDecision?: 'approve' | 'reject'
}

export interface ApprovalConfig {
  mode: ApprovalMode
  policy: ApprovalPolicy
  approvers: ApproverDef[]
  escalation?: EscalationConfig
}

export interface ServiceCallConfig {
  serviceKey: string
  method: string
  input?: Record<string, unknown>
  inputExpr?: string
  outputMap?: Record<string, string>
}

export interface ScriptConfig {
  expression: string
  outputVar: string
}

export interface WaitConfig {
  durationMins?: number
  untilEvent?: string
  untilExpr?: string
}

export interface SubWorkflowConfig {
  definitionId: string
  inputMap?: Record<string, unknown>
}

export interface RuleEvalConfig {
  entityType: string
  triggerType?: string
}

export interface NodeState {
  nodeId: string
  status: NodeStatus
  startedAt?: number
  completedAt?: number
  output?: Record<string, unknown>
  error?: string
  retryLeft?: number
}

export interface DAGState {
  nodeStates: Record<string, NodeState>
  activeNodes: string[]
  completedNodes: string[]
  variables: Record<string, unknown>
}

export interface ProcessDefinitionV2 {
  id: string
  tenantId?: string
  name: string
  entityType: string
  version: number
  triggerEvent?: TriggerEvent
  dag?: DAGDefinition
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface ProcessInstanceV2 {
  id: string
  tenantId?: string
  definitionId: string
  entityType: string
  entityId: string
  status: WorkflowInstanceStatus
  dagState?: DAGState
  context?: Record<string, unknown>
  errorMessage?: string
  abortReason?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface WorkflowBinding {
  id: string
  tenantId?: string
  entityType: string
  triggerEvent: TriggerEvent
  definitionId: string
  priority: number
  condition?: string
  enabled: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface ApprovalRecord {
  id: string
  instanceId: string
  stepId: string
  approverId?: string
  approverRole: string
  decision: 'pending' | 'approved' | 'rejected'
  comment?: string
  decidedAt?: string
  createdAt: string
}

export interface WorkflowExecutionLog {
  id: string
  instanceId: string
  stepId: string
  stepType: StepType
  status: string
  inputData?: unknown
  outputData?: unknown
  errorMessage?: string
  startedAt: string
  completedAt?: string
  durationMs?: number
}

// Workflow Definitions
export const listWorkflowDefinitions = (entityType?: string) => {
  const qs = entityType ? `?entity_type=${entityType}` : ''
  return studioFetch<{ items: ProcessDefinitionV2[] }>(`/workflows/v2/definitions${qs}`)
}

export const getWorkflowDefinition = (id: string) =>
  studioFetch<ProcessDefinitionV2>(`/workflows/v2/definitions/${id}`)

export const createWorkflowDefinition = (body: {
  name: string
  entityType: string
  triggerEvent?: TriggerEvent
  dag?: DAGDefinition
}) =>
  studioFetch<ProcessDefinitionV2>('/workflows/v2/definitions', { method: 'POST', body: JSON.stringify(body) })

export const saveWorkflowDefinition = (id: string, body: Partial<ProcessDefinitionV2>) =>
  studioFetch<ProcessDefinitionV2>(`/workflows/v2/definitions/${id}`, { method: 'PUT', body: JSON.stringify(body) })

// Workflow Instances
export const listWorkflowInstances = (definitionId?: string) => {
  const qs = definitionId ? `?definition_id=${definitionId}` : ''
  return studioFetch<{ items: ProcessInstanceV2[] }>(`/workflows/v2/instances${qs}`)
}

export const getWorkflowInstance = (id: string) =>
  studioFetch<ProcessInstanceV2>(`/workflows/v2/instances/${id}`)

export const startWorkflowInstance = (body: { definitionId: string; entityType: string; entityId: string; context?: Record<string, unknown> }) =>
  studioFetch<ProcessInstanceV2>('/workflows/v2/instances', { method: 'POST', body: JSON.stringify(body) })

export const resumeWorkflowInstance = (id: string, body?: { data?: Record<string, unknown> }) =>
  studioFetch<ProcessInstanceV2>(`/workflows/v2/instances/${id}/resume`, { method: 'POST', body: JSON.stringify(body ?? {}) })

export const abortWorkflowInstance = (id: string, reason?: string) =>
  studioFetch<void>(`/workflows/v2/instances/${id}/abort`, { method: 'POST', body: JSON.stringify({ reason }) })

export const getDAGState = (instanceId: string) =>
  studioFetch<DAGState>(`/workflows/v2/instances/${instanceId}/state`)

export const getWorkflowLogs = (instanceId: string) =>
  studioFetch<{ items: WorkflowExecutionLog[] }>(`/workflows/v2/instances/${instanceId}/logs`)

// Approvals
export const getPendingApprovals = () =>
  studioFetch<{ items: ApprovalRecord[] }>('/workflows/v2/approvals/pending')

export const decideApproval = (id: string, body: { decision: 'approved' | 'rejected'; comment?: string }) =>
  studioFetch<ApprovalRecord>(`/workflows/v2/approvals/${id}/decide`, { method: 'POST', body: JSON.stringify(body) })

// Bindings
export const listWorkflowBindings = (entityType?: string) => {
  const qs = entityType ? `?entity_type=${entityType}` : ''
  return studioFetch<{ items: WorkflowBinding[] }>(`/workflows/v2/bindings${qs}`)
}

export const createWorkflowBinding = (body: Omit<WorkflowBinding, 'id' | 'tenantId' | 'createdBy' | 'createdAt' | 'updatedAt'>) =>
  studioFetch<WorkflowBinding>('/workflows/v2/bindings', { method: 'POST', body: JSON.stringify(body) })

export const updateWorkflowBinding = (id: string, body: Partial<WorkflowBinding>) =>
  studioFetch<WorkflowBinding>(`/workflows/v2/bindings/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const deleteWorkflowBinding = (id: string) =>
  studioFetch<void>(`/workflows/v2/bindings/${id}`, { method: 'DELETE' })

// Events
export const publishWorkflowEvent = (body: { eventType: string; entityType: string; entityId: string; payload?: Record<string, unknown> }) =>
  studioFetch<{ triggered: number }>('/workflows/v2/events', { method: 'POST', body: JSON.stringify(body) })

// ── Monitoring & Coverage API ─────────────────────────────────────────────────

export interface RuleCoverageRow {
  entity_type: string
  total_rule_sets: number
  total_executions: number
  avg_execution_ms: number
  blocked_count: number
  fired_rule_count: number
}

export interface TopFiredRule {
  rule_key: string
  entity_type: string
  fire_count: number
  last_fired: string
}

export interface DeadRule {
  rule_key: string
  entity_type: string
}

export interface RuleLogEntry {
  id: string
  rule_set_key: string
  entity_type: string
  entity_id: string
  trigger_type: string
  fired_rules: Array<{ rule_key: string; row_id?: string; priority: number }>
  blocked: boolean
  execution_ms: number
  is_simulation: boolean
  created_at: string
}

export interface RuleExecStatBucket {
  bucket: string
  total: number
  blocked: number
  avg_ms: number
}

export interface WorkflowHealthMetrics {
  active_instances: number
  completed_instances: number
  failed_instances: number
  aborted_instances: number
  waiting_instances: number
  total_instances: number
  avg_duration_ms: number
  failure_rate: number
}

export interface WorkflowStepMetric {
  step_type: string
  total_executions: number
  completed: number
  failed: number
  avg_duration_ms: number
  max_duration_ms: number
  p95_duration_ms: number
}

export interface WorkflowLogEntry {
  id: string
  instance_id: string
  step_id: string
  step_type: string
  status: string
  error_message?: string
  started_at: string
  completed_at?: string
  duration_ms: number
}

export interface SLABreach {
  instance_id: string
  definition_id: string
  entity_type: string
  entity_id: string
  status: string
  started_at?: string
  elapsed_ms: number
}

// Rule Coverage
export const getRuleCoverage = (params?: { entity_type?: string; days?: number }) => {
  const qs = new URLSearchParams()
  if (params?.entity_type) qs.set('entity_type', params.entity_type)
  if (params?.days) qs.set('days', String(params.days))
  return studioFetch<{ items: RuleCoverageRow[]; days: number }>(`/monitoring/rules/coverage?${qs}`)
}

export const getTopFiredRules = (params?: { limit?: number; days?: number }) => {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.days) qs.set('days', String(params.days))
  return studioFetch<{ items: TopFiredRule[] }>(`/monitoring/rules/top-fired?${qs}`)
}

export const getDeadRules = (params?: { days?: number }) => {
  const qs = new URLSearchParams()
  if (params?.days) qs.set('days', String(params.days))
  return studioFetch<{ items: DeadRule[]; window_days: number }>(`/monitoring/rules/dead-rules?${qs}`)
}

export const getRuleExecutionLog = (params?: { entity_type?: string; rule_set_key?: string; include_simulations?: boolean; limit?: number; offset?: number }) => {
  const qs = new URLSearchParams()
  if (params?.entity_type) qs.set('entity_type', params.entity_type)
  if (params?.rule_set_key) qs.set('rule_set_key', params.rule_set_key)
  if (params?.include_simulations) qs.set('include_simulations', 'true')
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  return studioFetch<{ items: RuleLogEntry[] }>(`/monitoring/rules/execution-log?${qs}`)
}

export const getRuleExecutionStats = (params?: { days?: number }) => {
  const qs = new URLSearchParams()
  if (params?.days) qs.set('days', String(params.days))
  return studioFetch<{ items: RuleExecStatBucket[] }>(`/monitoring/rules/execution-stats?${qs}`)
}

// Workflow Health
export const getWorkflowHealth = (params?: { days?: number }) => {
  const qs = new URLSearchParams()
  if (params?.days) qs.set('days', String(params.days))
  return studioFetch<WorkflowHealthMetrics>(`/monitoring/workflow/health?${qs}`)
}

export const getWorkflowStepMetrics = (params?: { days?: number }) => {
  const qs = new URLSearchParams()
  if (params?.days) qs.set('days', String(params.days))
  return studioFetch<{ items: WorkflowStepMetric[] }>(`/monitoring/workflow/step-metrics?${qs}`)
}

export const getWorkflowExecutionLog = (params?: { instance_id?: string; step_type?: string; status?: string; limit?: number; offset?: number }) => {
  const qs = new URLSearchParams()
  if (params?.instance_id) qs.set('instance_id', params.instance_id)
  if (params?.step_type) qs.set('step_type', params.step_type)
  if (params?.status) qs.set('status', params.status)
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  return studioFetch<{ items: WorkflowLogEntry[] }>(`/monitoring/workflow/execution-log?${qs}`)
}

export const getWorkflowSLABreaches = (params?: { limit?: number }) => {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  return studioFetch<{ items: SLABreach[] }>(`/monitoring/workflow/sla-breaches?${qs}`)
}
