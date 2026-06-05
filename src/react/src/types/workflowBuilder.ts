/**
 * Workflow Builder — TypeScript Types
 *
 * CRITICAL IDENTIFIERS:
 * - step.id  = Execution ID (camelCase, no spaces) → STATE STORAGE KEY
 *   Backend stores: state[step.id] = taskOutput
 *   Data paths: {$.stepId.data} → state["stepId"].data
 * - step.name = Display label (can have spaces) → shown in canvas/logs
 */

import type { Artifact } from '../config/studioApi'

// ── Task Type ────────────────────────────────────────────────────────────────

export type TaskType =
  // Control flow (canvas start/end)
  | 'start'
  | 'end'
  // Original apt-pranvayu types (PascalCase)
  | 'Rule'
  | 'Document'
  | 'Query'
  | 'Date'
  | 'Request'
  | 'Response'
  | 'Resolver'
  | 'UUID'
  | 'Switch'
  | 'Condition'
  | 'Array'
  | 'Object'
  | 'HTTP'
  | 'Geometry'
  | 'Promise'
  | 'Identifier'
  | 'JSON'
  | 'Transaction'
  | 'Security'
  | 'Loop'
  | 'SMTP'
  | 'Filter'
  | 'Math'
  | 'Iterator'
  | 'String'
  | 'Action'
  | 'Provider'
  | 'Schema'
  | 'Repository'
  | 'RSA'
  | 'Crypto'
  | 'Workflow'
  | 'Subscription'
  | 'Cache'
  | 'Version'
  | 'History'
  | 'Entity'
  | 'ORM'
  | 'MinIO'
  | 'State'
  | 'Trino'
  | 'Azure'
  | 'Variable'
  | 'Sequence'
  | 'Validator'
  | 'ESQuery'
  | 'Export'
  | 'Template'
  | 'UIComponent'
  | 'Keycloak'
  // Enterprise additions
  | 'Parallel'
  | 'Timer'
  | 'Approval'
  | 'SMS'
  | 'Notification'
  | 'Webhook'
  | 'Queue'
  | 'AI'

// ── Branching task type constants ────────────────────────────────────────────

/** Task types that contain nested step sequences / branches */
export const BRANCHING_TASK_TYPES: ReadonlySet<TaskType> = new Set<TaskType>([
  'Condition',
  'Switch',
  'Loop',
  'Iterator',
  'Promise',
  'Sequence',
  'State',
  'Transaction',
  'Parallel',
])

/**
 * Maps branching task type to the names of its child branch keys.
 * - 'Condition'  → onSuccess / onFailure
 * - 'Switch'     → dynamic case keys (open-ended; sentinel shown here)
 * - 'Loop' | 'Iterator' | 'Promise' | 'Sequence' | 'State' → tasks
 * - 'Transaction' → tasks + rollback
 * - 'Parallel'   → dynamic branch keys
 */
export const BRANCH_NAMES: Readonly<Partial<Record<TaskType, readonly string[]>>> = {
  Condition: ['onSuccess', 'onFailure'],
  Loop: ['tasks'],
  Iterator: ['tasks'],
  Promise: ['tasks'],
  Sequence: ['tasks'],
  State: ['tasks'],
  Transaction: ['tasks', 'rollback'],
  // Switch and Parallel have dynamic branch keys — empty sentinel
  Switch: [],
  // 'Parallel' is a logical alias; map it too if callers use the string
} as const

// ── Rule / condition helpers ─────────────────────────────────────────────────

export interface RuleColumn {
  /** Field / variable name */
  name: string
  /** JSONata expression or static value */
  value: string
  /** Comparison operator */
  operator?: string
  /** Data type hint */
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'any'
}

// ── Action settings (per-step options) ──────────────────────────────────────

export interface ActionSettings {
  /** HTTP method for Document / Query / HTTP tasks */
  method?: string
  /** Entity / collection name */
  entity?: string
  /** Operation mode (e.g. FindOne, FindPaging, Create, Update, Delete) */
  operation?: string
  /** JSONata expression for the request body */
  body?: string
  /** JSONata expression for query filter */
  filter?: string
  /** Field projections */
  projection?: string[]
  /** Sort specification */
  sort?: Record<string, 1 | -1>
  /** Pagination */
  limit?: number
  skip?: number
  /** Status code for Response tasks */
  status?: number
  /** Message for Response tasks */
  message?: string
  /** Data expression for Response tasks */
  data?: string
  /** Cache key expression */
  cacheKey?: string
  /** TTL in seconds for Cache tasks */
  ttl?: number
  /** URL for HTTP tasks */
  url?: string
  /** Headers map for HTTP tasks */
  headers?: Record<string, string>
  /** SMTP config */
  smtp?: Record<string, unknown>
  /** Columns / mappings for Rule/Condition tasks */
  columns?: RuleColumn[]
  /** Input expression(s) for transformation tasks */
  input?: string
  /** Output / target field name */
  output?: string
  /** Template body (for Template tasks) */
  template?: string
  /** Variable name (for Variable tasks) */
  variable?: string
  /** Expression result assignment (for Resolver tasks) */
  expression?: string
  [key: string]: unknown
}

// ── Per-step defaults ────────────────────────────────────────────────────────

export const DEFAULT_ACTION_SETTINGS: Readonly<ActionSettings> = {
  method: 'GET',
  status: 200,
}

// ── WorkflowStep ─────────────────────────────────────────────────────────────

export interface WorkflowStep {
  /**
   * Execution ID — camelCase, no spaces.
   * Becomes the state-storage key: state[id] = taskOutput
   * Referenced in expressions as {$.id.data}
   */
  id: string
  /** Display label shown on the canvas */
  name: string
  /** Task type discriminant */
  type: TaskType
  /** Component class used by the canvas renderer */
  componentType: 'task' | 'switch' | 'container' | string
  /** Per-task settings (taskSettings + derived properties) */
  properties: {
    /** Mirrors the HTTP method / sub-operation for router rendering */
    type?: string
    /** All task-specific config */
    taskSettings: ActionSettings
    [key: string]: unknown
  }
  /**
   * Child branches for branching task types.
   * - Condition:   { onSuccess: WorkflowStep[], onFailure: WorkflowStep[] }
   * - Switch:      { [caseKey]: WorkflowStep[] }
   * - Loop/Iterator/Promise/Sequence/State: { tasks: WorkflowStep[] }
   * - Transaction: { tasks: WorkflowStep[], rollback: WorkflowStep[] }
   * - Parallel:    { [branchKey]: WorkflowStep[] }
   */
  branches?: Record<string, WorkflowStep[]>
  /** Optional annotation shown as tooltip on the canvas node */
  note?: string
}

// ── NodeConfig — discriminated union for well-known task types ───────────────

export type NodeConfig =
  | DocumentNodeConfig
  | QueryNodeConfig
  | ResponseNodeConfig
  | RequestNodeConfig
  | ResolverNodeConfig
  | ConditionNodeConfig
  | SwitchNodeConfig
  | LoopNodeConfig
  | IteratorNodeConfig
  | TransactionNodeConfig
  | HttpNodeConfig
  | RuleNodeConfig
  | ValidatorNodeConfig
  | VariableNodeConfig
  | CacheNodeConfig
  | SequenceNodeConfig

export interface DocumentNodeConfig {
  type: 'Document'
  entity: string
  operation: 'FindOne' | 'FindMany' | 'FindPaging' | 'Create' | 'Update' | 'Delete' | 'Count'
  filter?: string
  body?: string
  projection?: string[]
  sort?: Record<string, 1 | -1>
  limit?: number
  skip?: number
}

export interface QueryNodeConfig {
  type: 'Query'
  entity: string
  operation: 'FindOne' | 'FindMany' | 'FindPaging' | 'Aggregate' | 'Count'
  filter?: string
  projection?: string[]
  sort?: Record<string, 1 | -1>
  limit?: number
  skip?: number
}

export interface ResponseNodeConfig {
  type: 'Response'
  status: number
  message?: string
  data?: string
}

export interface RequestNodeConfig {
  type: 'Request'
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: string
}

export interface ResolverNodeConfig {
  type: 'Resolver'
  expression: string
  output?: string
}

export interface ConditionNodeConfig {
  type: 'Condition'
  columns: RuleColumn[]
  onSuccess: WorkflowStep[]
  onFailure: WorkflowStep[]
}

export interface SwitchNodeConfig {
  type: 'Switch'
  expression: string
  cases: Record<string, WorkflowStep[]>
}

export interface LoopNodeConfig {
  type: 'Loop'
  input: string
  tasks: WorkflowStep[]
}

export interface IteratorNodeConfig {
  type: 'Iterator'
  input: string
  tasks: WorkflowStep[]
}

export interface TransactionNodeConfig {
  type: 'Transaction'
  tasks: WorkflowStep[]
  rollback: WorkflowStep[]
}

export interface HttpNodeConfig {
  type: 'HTTP'
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: string
}

export interface RuleNodeConfig {
  type: 'Rule'
  columns: RuleColumn[]
}

export interface ValidatorNodeConfig {
  type: 'Validator'
  columns: RuleColumn[]
}

export interface VariableNodeConfig {
  type: 'Variable'
  variable: string
  expression: string
}

export interface CacheNodeConfig {
  type: 'Cache'
  operation: 'Get' | 'Set' | 'Delete'
  cacheKey: string
  ttl?: number
  data?: string
}

export interface SequenceNodeConfig {
  type: 'Sequence'
  tasks: WorkflowStep[]
}

// ── WorkflowDefinition ───────────────────────────────────────────────────────

export interface WorkflowDefinition {
  /** Ordered list of steps that form the workflow */
  sequence: WorkflowStep[]
  /** Top-level workflow properties (inputs, outputs, metadata) */
  properties: {
    /** Human-readable description */
    description?: string
    /** JSONata expression for input schema validation */
    inputSchema?: string
    /** Tags for discoverability */
    tags?: string[]
    /** Human-readable workflow name shown in the UI */
    displayName?: string
    /** HTTP method this workflow is exposed on */
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    /** Action category for routing/classification */
    actionType?: 'process' | 'create' | 'read' | 'update' | 'delete' | 'list' | 'validate' | 'report'
    [key: string]: unknown
  }
}

export const DEFAULT_WORKFLOW_DEFINITION: Readonly<WorkflowDefinition> = {
  sequence: [],
  properties: {},
}

// ── WorkflowArtifact ─────────────────────────────────────────────────────────

export interface WorkflowArtifact extends Artifact {
  artifact_type: 'workflow_builder'
  payload: WorkflowDefinition
}

// ── API shapes ───────────────────────────────────────────────────────────────

export interface WorkflowListResponse {
  items: WorkflowArtifact[]
  total: number
  next_cursor?: string
}

export interface CreateWorkflowRequest {
  artifact_name: string
  artifact_type: 'workflow_builder'
  payload?: WorkflowDefinition
}
