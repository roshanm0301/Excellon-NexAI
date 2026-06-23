// Doc 01 §1.3–§1.12 — Meta Model node kinds (discriminated on `kind`)

import type { NodeBase, Binding, PropValue, NodeRef, Literal } from "./base"
import type { SemanticType } from "./semantic-types"

// ── Enums ────────────────────────────────────────────────────────────────────

// Doc 01 §1.4
export type PageArchetype =
  | "list-report"
  | "transaction-entry"
  | "master-detail"
  | "object-detail"
  | "dashboard"
  | "workspace"
  | "wizard"

// Doc 01 §1.6
export type LayoutType = "stack" | "flex" | "grid" | "split" | "form-grid" | "responsive-grid"
export type LayoutDirection = "row" | "column"

// Doc 01 §1.8
export type ActionKind =
  | "mutate-entity"
  | "invoke-rule"
  | "trigger-workflow-transition"
  | "navigate"
  | "set-state"
  | "call-api"
  | "composite"

// Doc 01 §1.9
export type EventTrigger =
  | "onClick"
  | "onChange"
  | "onLoad"
  | "onSelect"
  | "onSubmit"
  | "onWorkflowEvent"
  | "onTimer"

// Doc 01 §1.10
export type StateScope = "page" | "view" | "component"
export type StatePersistence = "none" | "session"

// Doc 01 §1.11
export type WorkflowBindingKind =
  | "show-current-state"
  | "available-transitions"
  | "trigger-transition"
  | "task-inbox"
  | "timeline"

// Doc 01 §1.12
export type DataSourceType =
  | "entity"
  | "relationship"
  | "aggregation"
  | "query"
  | "search"
  | "api"
  | "context"

// ── Supporting types ─────────────────────────────────────────────────────────

export interface Region {
  name: string
  slot: string
}

export interface BreakpointRule {
  breakpoint: string
  layout?: {
    type?: LayoutType
    direction?: LayoutDirection
    gap?: string
  }
}

export interface Constraint {
  minWidth?: string
  maxWidth?: string
  grow?: number
  shrink?: number
}

export interface Confirmation {
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

export interface NavigationEntry {
  logicalKey: string
  label: string
  pageRef?: string
  icon?: string
  children?: NavigationEntry[]
}

// ── Composition nodes ────────────────────────────────────────────────────────

// Doc 01 §1.3
export interface ApplicationNode extends NodeBase {
  kind: "application"
  name: string
  description?: string
  verticalScope: string
  targetProfiles: ("web" | "pwa" | "native")[]
  modules: NodeRef[]
  navigationRef: string
  themeRef: string
  defaultEntryRef: string
  featureFlags?: Record<string, Literal>
}

// Doc 01 §1.12
export interface ModuleNode extends NodeBase {
  kind: "module"
  name?: string
  pages: NodeRef[]
  featureFlag?: string
}

// Doc 01 §1.4
export interface PageNode extends NodeBase {
  kind: "page"
  archetype: PageArchetype
  route: string
  title: string | Binding
  primaryDataSourceRef?: string
  views: NodeRef[]
  layoutRef: string
  pageState?: NodeRef[]
  pageActions?: NodeRef[]
  accessibilityRef?: string
  responsiveRef?: string
}

// Doc 01 §1.5
export interface ViewNode extends NodeBase {
  kind: "view"
  dataSourceRef?: string
  sections: NodeRef[]
  viewState?: NodeRef[]
  events?: NodeRef[]
  layoutRef: string
}

// Doc 01 §1.12
export interface SectionNode extends NodeBase {
  kind: "section"
  label?: string
  components: NodeRef[]
  layoutRef?: string
}

// Doc 01 §1.6 [L34]
export interface LayoutNode extends NodeBase {
  kind: "layout"
  layoutType: LayoutType
  direction?: LayoutDirection
  gap?: string
  padding?: string
  regions?: Region[]
  breakpointRules?: BreakpointRule[]
  constraints?: Constraint[]
}

// Doc 01 §1.7 [L32]
export interface ComponentNode extends NodeBase {
  kind: "component"
  semanticType: SemanticType
  props?: Record<string, PropValue>
  dataBindingRef?: Binding
  stateBindings?: Binding[]
  eventHandlers?: NodeRef[]
  validations?: NodeRef[]
  children?: NodeRef[]
  slots?: Record<string, NodeRef[]>
  accessibility?: Record<string, unknown>
  responsive?: Record<string, unknown>
  mobile?: Record<string, unknown>
}

// ── Bindable nodes ───────────────────────────────────────────────────────────

// Doc 01 §1.12
export interface DataSourceNode extends NodeBase {
  kind: "dataSource"
  dataSourceType: DataSourceType
  targetRef?: string
  filter?: Record<string, unknown>
  sort?: Record<string, unknown>
  paging?: { pageSize: number; cursor?: string }
  writeCapability?: boolean
}

// Doc 01 §1.10
export interface StateNode extends NodeBase {
  kind: "state"
  scope: StateScope
  shape: Record<string, unknown>
  initialValue?: Literal | Binding
  persistence: StatePersistence
  derivation?: string
}

// Doc 01 §1.8
export interface ActionNode extends NodeBase {
  kind: "action"
  actionKind: ActionKind
  target: string | Record<string, unknown>
  inputs?: Record<string, Binding | Literal>
  preconditions?: string[]
  confirmation?: Confirmation
  securityGate?: string
  onSuccess?: NodeRef[]
  onError?: NodeRef[]
}

// Doc 01 §1.9
export interface EventNode extends NodeBase {
  kind: "event"
  trigger: EventTrigger
  sourceRef: string
  conditions?: string[]
  actions: NodeRef[]
}

// Doc 01 §1.11
export interface WorkflowBindingNode extends NodeBase {
  kind: "workflowBinding"
  workflowRef: string
  bindingKind: WorkflowBindingKind
  attachPoint: string
  stateMappings?: Record<string, unknown>
  transitionActions?: Record<string, string>
}

// ── Standalone nodes ─────────────────────────────────────────────────────────

// Doc 01 §1.12
export interface NavigationNode extends NodeBase {
  kind: "navigation"
  entries: NavigationEntry[]
  profileVariants?: Record<string, NavigationEntry[]>
}

// Doc 01 §1.12
export interface ThemeNode extends NodeBase {
  kind: "theme"
  tokens: Record<string, unknown>
  brandAssets?: Record<string, string>
  cascadeOverrides?: Record<string, unknown>
}

// ── Discriminated unions ─────────────────────────────────────────────────────

export type CompositionNode =
  | ApplicationNode
  | ModuleNode
  | PageNode
  | ViewNode
  | SectionNode
  | LayoutNode
  | ComponentNode

export type BindableNode =
  | DataSourceNode
  | StateNode
  | ActionNode
  | EventNode
  | WorkflowBindingNode

export type MetaNode = CompositionNode | BindableNode | NavigationNode | ThemeNode

// ── Type guards ──────────────────────────────────────────────────────────────

export function isBinding(value: unknown): value is Binding {
  if (typeof value !== "object" || value === null) return false
  const obj = value as Record<string, unknown>
  if (typeof obj.bind !== "object" || obj.bind === null) return false
  const bind = obj.bind as Record<string, unknown>
  return typeof bind.kind === "string" && typeof bind.ref === "string"
}

const COMPOSITION_KINDS = new Set([
  "application",
  "module",
  "page",
  "view",
  "section",
  "layout",
  "component",
])

const BINDABLE_KINDS = new Set(["dataSource", "state", "action", "event", "workflowBinding"])

export function isCompositionNode(node: MetaNode): node is CompositionNode {
  return COMPOSITION_KINDS.has(node.kind)
}

export function isBindableNode(node: MetaNode): node is BindableNode {
  return BINDABLE_KINDS.has(node.kind)
}
