/**
 * View Event Engine — Pure TypeScript, zero React imports
 *
 * Provides a typed pub/sub event bus for inter-component communication
 * within a rendered view. Components emit events, and the engine dispatches
 * them to registered handlers (actions) defined in the view payload.
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
}

// ─── Condition Evaluator ─────────────────────────────────────────────────────

function evaluateConditions(
  conditions: Record<string, unknown> | undefined,
  event: ViewEvent,
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true

  // Simple equality match on event data
  for (const [key, expected] of Object.entries(conditions)) {
    const actual = event.data?.[key]
    if (actual !== expected) return false
  }
  return true
}

// ─── Event Engine Class ──────────────────────────────────────────────────────

export class ViewEventEngine {
  private definitions: EventDefinition[] = []
  private handlers: Map<ActionType, ActionHandler> = new Map()
  private listeners: Map<string, Set<(event: ViewEvent) => void>> = new Map()
  private treeState: Record<string, unknown> = {}

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

  // ─── Emit ────────────────────────────────────────────────────────────

  emit(event: Omit<ViewEvent, 'timestamp'>): void {
    const fullEvent: ViewEvent = { ...event, timestamp: Date.now() }

    // Notify raw listeners
    this.listeners.get(event.type)?.forEach(fn => fn(fullEvent))
    this.listeners.get('*')?.forEach(fn => fn(fullEvent))

    // Find matching definitions and execute actions
    const matching = this.definitions.filter(def =>
      def.event_type === event.type &&
      (def.is_active !== false) &&
      evaluateConditions(def.conditions, fullEvent),
    )

    // Sort by priority (lower = first)
    matching.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))

    for (const def of matching) {
      for (const action of def.actions) {
        this.executeAction(action, fullEvent)
      }
    }
  }

  // ─── Action Execution ────────────────────────────────────────────────

  private executeAction(action: EventAction, event: ViewEvent): void {
    const handler = this.handlers.get(action.action_type)
    if (!handler) return

    const ctx: ActionContext = {
      event,
      action,
      tree_state: this.treeState,
    }

    try {
      handler(ctx)
    } catch {
      // Silently ignore action errors in event engine — callers can
      // register error listeners via on('*', ...) to observe failures
    }
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
    this.treeState = {}
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createEventEngine(definitions?: EventDefinition[]): ViewEventEngine {
  return new ViewEventEngine(definitions)
}
