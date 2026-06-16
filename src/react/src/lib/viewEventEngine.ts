/**
 * View Event Engine — Pure TypeScript, zero React imports
 *
 * Provides a typed pub/sub event bus for inter-component communication
 * within a rendered view. Components emit events, and the engine dispatches
 * them to registered handlers (actions) defined in the view payload.
 *
 * Phase 4 hardening:
 *  - Async sequential queue: handlers are awaited in order, no fire-and-forget
 *  - Result model: each action returns { ok: boolean; error?: string }
 *  - All ActionTypes from types/viewStudio.ts are handled
 *  - Compound condition evaluation: and / or / leaf nodes
 *  - EventEngineError custom error type emitted on failures
 */

import type { EventDefinition, EventAction, EventType, ActionType } from '../types/viewStudio'

// ─── Event Payload ───────────────────────────────────────────────────────────

export interface ViewEvent {
  type: EventType
  source_key: string
  source_field?: string
  data?: Record<string, unknown>
  timestamp: number
}

export interface ActionContext {
  event: ViewEvent
  action: EventAction
  tree_state: Record<string, unknown>
}

// ─── Result Model ────────────────────────────────────────────────────────────

export interface ActionResult {
  ok: boolean
  error?: string
}

// ─── Custom Error ─────────────────────────────────────────────────────────────

export class EventEngineError extends Error {
  readonly action_type: ActionType
  readonly cause_message: string

  constructor(actionType: ActionType, cause: unknown) {
    const msg = cause instanceof Error ? cause.message : String(cause)
    super(`EventEngine: action "${actionType}" failed — ${msg}`)
    this.name = 'EventEngineError'
    this.action_type = actionType
    this.cause_message = msg
  }
}

// ─── Compound Condition Types ────────────────────────────────────────────────
//
// Conditions stored in EventDefinition.conditions may be a compound node:
//   { type: 'and', conditions: [...] }
//   { type: 'or',  conditions: [...] }
// or a leaf node:
//   { type: 'field_equals', field: string, value: unknown }
//   { type: 'role_in',      roles: string[] }
// Legacy flat-equality records (Record<string, unknown>) remain supported
// for backward-compatibility with definitions written before Phase 4.

export type LeafCondition =
  | { type: 'field_equals'; field: string; value: unknown }
  | { type: 'role_in'; roles: string[] }

export type CompoundCondition =
  | { type: 'and'; conditions: ConditionNode[] }
  | { type: 'or';  conditions: ConditionNode[] }

export type ConditionNode = LeafCondition | CompoundCondition

// ─── Action Handler Registry ─────────────────────────────────────────────────

export type ActionHandler = (ctx: ActionContext) => void | Promise<void>

const DEFAULT_HANDLERS: Partial<Record<ActionType, ActionHandler>> = {
  set_field: (ctx) => {
    ctx.tree_state[ctx.action.target ?? ''] = ctx.action.payload?.value
  },
  show_field: (ctx) => {
    ctx.tree_state[`__visibility_${ctx.action.target}`] = true
  },
  hide_field: (ctx) => {
    ctx.tree_state[`__visibility_${ctx.action.target}`] = false
  },
  enable_field: (ctx) => {
    ctx.tree_state[`__enabled_${ctx.action.target}`] = true
  },
  disable_field: (ctx) => {
    ctx.tree_state[`__enabled_${ctx.action.target}`] = false
  },
  set_required: (ctx) => {
    ctx.tree_state[`__required_${ctx.action.target}`] = true
  },
  clear_required: (ctx) => {
    ctx.tree_state[`__required_${ctx.action.target}`] = false
  },
  navigate: (ctx) => {
    // Navigation target is in payload.url or payload.route
    const url = ctx.action.payload?.url ?? ctx.action.payload?.route
    ctx.tree_state[`__navigate`] = url
  },
  open_modal: (ctx) => {
    ctx.tree_state[`__modal_open_${ctx.action.target}`] = true
  },
  close_modal: (ctx) => {
    ctx.tree_state[`__modal_open_${ctx.action.target}`] = false
  },
  refresh_datasource: (ctx) => {
    // Increment a refresh counter; datasource listeners observe the counter
    const key = `__refresh_${ctx.action.target}`
    const current = (ctx.tree_state[key] as number | undefined) ?? 0
    ctx.tree_state[key] = current + 1
  },
  show_toast: (ctx) => {
    // Queue a toast descriptor; the hosting React component drains it
    const toasts = (ctx.tree_state['__toasts'] as unknown[]) ?? []
    ctx.tree_state['__toasts'] = [
      ...toasts,
      {
        variant: ctx.action.payload?.variant ?? 'info',
        title: ctx.action.payload?.title ?? 'Notification',
        message: ctx.action.payload?.message,
      },
    ]
  },
  trigger_validation: (ctx) => {
    ctx.tree_state[`__validate_${ctx.action.target}`] = Date.now()
  },
  call_api: (ctx) => {
    // Record the pending call descriptor; callers resolve it externally
    const pending = (ctx.tree_state['__pending_calls'] as unknown[]) ?? []
    ctx.tree_state['__pending_calls'] = [
      ...pending,
      { endpoint: ctx.action.payload?.endpoint, method: ctx.action.payload?.method ?? 'GET' },
    ]
  },
  set_filter: (ctx) => {
    const key = `__filter_${ctx.action.target}`
    ctx.tree_state[key] = ctx.action.payload?.filter
  },
  reset_form: (ctx) => {
    ctx.tree_state[`__reset_${ctx.action.target ?? 'form'}`] = Date.now()
  },
}

// ─── Condition Evaluator ─────────────────────────────────────────────────────

/**
 * Evaluate a ConditionNode (compound or leaf) against the current event and
 * optional runtime context (role, field values).
 */
export function evaluateConditionNode(
  node: ConditionNode,
  event: ViewEvent,
  role?: string,
  fieldValues?: Record<string, unknown>,
): boolean {
  if (node.type === 'and') {
    return node.conditions.every(c => evaluateConditionNode(c, event, role, fieldValues))
  }
  if (node.type === 'or') {
    return node.conditions.some(c => evaluateConditionNode(c, event, role, fieldValues))
  }
  if (node.type === 'field_equals') {
    // Check event data first, then fieldValues
    const fromEvent = event.data?.[node.field]
    const fromFields = fieldValues?.[node.field]
    const actual = fromEvent !== undefined ? fromEvent : fromFields
    return actual === node.value
  }
  if (node.type === 'role_in') {
    if (!node.roles || node.roles.length === 0) return true
    return node.roles.includes(role ?? '')
  }
  return true
}

/**
 * Evaluate the raw conditions stored in an EventDefinition.conditions field.
 *
 * Supports:
 *  1. Compound node: { type: 'and'|'or', conditions: [...] }
 *  2. Leaf node:     { type: 'field_equals'|'role_in', ... }
 *  3. Legacy flat record: { fieldKey: value, ... } — all entries must match event.data
 */
export function evaluateConditions(
  conditions: Record<string, unknown> | undefined,
  event: ViewEvent,
  role?: string,
  fieldValues?: Record<string, unknown>,
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true

  const condType = conditions['type']

  // Compound or leaf condition node
  if (condType === 'and' || condType === 'or' || condType === 'field_equals' || condType === 'role_in') {
    return evaluateConditionNode(conditions as unknown as ConditionNode, event, role, fieldValues)
  }

  // Legacy flat equality: all keys in conditions must match event.data
  for (const [key, expected] of Object.entries(conditions)) {
    const actual = event.data?.[key]
    if (actual !== expected) return false
  }
  return true
}

// ─── Async Action Queue ──────────────────────────────────────────────────────

/**
 * Execute a list of actions in sequence, awaiting each one.
 * Returns one ActionResult per action; an error in one action does NOT abort
 * subsequent actions — all actions run even if earlier ones fail.
 */
async function executeActionsSequentially(
  actions: EventAction[],
  event: ViewEvent,
  treeState: Record<string, unknown>,
  handlers: Map<ActionType, ActionHandler>,
  onError?: (err: EventEngineError) => void,
): Promise<ActionResult[]> {
  const results: ActionResult[] = []

  for (const action of actions) {
    const handler = handlers.get(action.action_type)
    if (!handler) {
      results.push({ ok: false, error: `No handler for action_type: ${action.action_type}` })
      continue
    }

    const ctx: ActionContext = { event, action, tree_state: treeState }

    try {
      await handler(ctx)
      results.push({ ok: true })
    } catch (err) {
      const engineErr = new EventEngineError(action.action_type, err)
      onError?.(engineErr)
      results.push({ ok: false, error: engineErr.cause_message })
    }
  }

  return results
}

// ─── Event Engine Class ──────────────────────────────────────────────────────

export class ViewEventEngine {
  private definitions: EventDefinition[] = []
  private handlers: Map<ActionType, ActionHandler> = new Map()
  private listeners: Map<string, Set<(event: ViewEvent) => void>> = new Map()
  private errorListeners: Set<(err: EventEngineError) => void> = new Set()
  private treeState: Record<string, unknown> = {}
  private role: string | undefined = undefined
  private fieldValues: Record<string, unknown> = {}

  // Serialise concurrent emits: each emit appends to the queue
  private queue: Promise<void> = Promise.resolve()

  constructor(definitions?: EventDefinition[]) {
    if (definitions) this.definitions = [...definitions]
    // Register default handlers
    for (const [type, handler] of Object.entries(DEFAULT_HANDLERS)) {
      this.handlers.set(type as ActionType, handler!)
    }
  }

  // ─── Configuration ───────────────────────────────────────────────────

  setDefinitions(definitions: EventDefinition[]): void {
    this.definitions = [...definitions]
  }

  getDefinitions(): EventDefinition[] {
    return [...this.definitions]
  }

  registerHandler(actionType: ActionType, handler: ActionHandler): void {
    this.handlers.set(actionType, handler)
  }

  setTreeState(state: Record<string, unknown>): void {
    this.treeState = state
  }

  getTreeState(): Record<string, unknown> {
    return { ...this.treeState }
  }

  /** Set the current user role for condition evaluation */
  setRole(role: string | undefined): void {
    this.role = role
  }

  /** Set current field values for condition evaluation */
  setFieldValues(values: Record<string, unknown>): void {
    this.fieldValues = { ...values }
  }

  // ─── Subscriptions ───────────────────────────────────────────────────

  on(eventType: string, listener: (event: ViewEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(listener)
    return () => {
      this.listeners.get(eventType)?.delete(listener)
    }
  }

  off(eventType: string, listener: (event: ViewEvent) => void): void {
    this.listeners.get(eventType)?.delete(listener)
  }

  /** Subscribe to EventEngineError notifications */
  onError(listener: (err: EventEngineError) => void): () => void {
    this.errorListeners.add(listener)
    return () => { this.errorListeners.delete(listener) }
  }

  // ─── Emit (sync entrypoint, async under the hood) ────────────────────

  /**
   * Emit an event. Matching definitions are queued for sequential async
   * execution. Handlers are awaited; errors produce EventEngineError and
   * do NOT block subsequent actions or definitions.
   *
   * Returns a promise that resolves when all actions for this event have run.
   */
  emit(event: Omit<ViewEvent, 'timestamp'>): Promise<void> {
    const fullEvent: ViewEvent = { ...event, timestamp: Date.now() }

    // Notify raw listeners synchronously (observers, not actions)
    this.listeners.get(event.type)?.forEach(fn => fn(fullEvent))
    this.listeners.get('*')?.forEach(fn => fn(fullEvent))

    // Find matching definitions and sort by priority
    const matching = this.definitions.filter(def =>
      def.event_type === event.type &&
      (def.is_active !== false) &&
      evaluateConditions(def.conditions, fullEvent, this.role, this.fieldValues),
    )
    matching.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))

    if (matching.length === 0) return this.queue

    // Serialise: chain onto the existing queue so concurrent emits don't race
    this.queue = this.queue.then(async () => {
      for (const def of matching) {
        await executeActionsSequentially(
          def.actions,
          fullEvent,
          this.treeState,
          this.handlers,
          (err) => {
            this.errorListeners.forEach(fn => fn(err))
            console.warn(err.message)
          },
        )
      }
    })

    return this.queue
  }

  // ─── Utilities ───────────────────────────────────────────────────────

  /** Find all definitions that handle events from a specific component */
  getDefinitionsForSource(sourceKey: string): EventDefinition[] {
    return this.definitions.filter(def => def.source_field === sourceKey)
  }

  /** Find all definitions that target a specific component via actions */
  getDefinitionsTargeting(targetKey: string): EventDefinition[] {
    return this.definitions.filter(def =>
      def.actions.some(a => a.target === targetKey),
    )
  }

  /** Validate all definitions: ensure referenced actions have handlers */
  validate(): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    for (const def of this.definitions) {
      if (!def.event_type) {
        issues.push(`Event definition missing event_type`)
      }
      if (!def.actions || def.actions.length === 0) {
        issues.push(`Event ${def.event_type} has no actions`)
      }
      for (const action of def.actions ?? []) {
        if (!this.handlers.has(action.action_type)) {
          issues.push(`Unknown action_type: ${action.action_type}`)
        }
      }
    }

    return { valid: issues.length === 0, issues }
  }

  /** Reset all state */
  destroy(): void {
    this.definitions = []
    this.listeners.clear()
    this.errorListeners.clear()
    this.treeState = {}
    this.queue = Promise.resolve()
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createEventEngine(definitions?: EventDefinition[]): ViewEventEngine {
  return new ViewEventEngine(definitions)
}

// ─── Module-level singleton dispatch helper ───────────────────────────────────
// Allows callers (e.g., PreviewCanvas) to dispatch events via a shared engine
// instance without prop-drilling the full engine object.

let _sharedEngine: ViewEventEngine | null = null

export function getSharedEngine(): ViewEventEngine {
  if (!_sharedEngine) {
    _sharedEngine = new ViewEventEngine()
  }
  return _sharedEngine
}

export function replaceSharedEngine(engine: ViewEventEngine): void {
  _sharedEngine = engine
}

export function dispatchViewEvent(event: Omit<ViewEvent, 'timestamp'>): Promise<void> {
  return getSharedEngine().emit(event)
}
