// Doc 06 §6.4 — canonical semantic component catalogue [L32]

export type SemanticType =
  // Foundation
  | "Container"
  | "Stack"
  | "Grid"
  | "Section"
  | "Splitter"
  | "Tabs"
  // Data Entry
  | "FormField"
  | "Select"
  | "Autocomplete"
  | "DatePicker"
  | "NumberField"
  | "FileUpload"
  | "Toggle"
  // Data Display
  | "DataTable"
  | "List"
  | "Card"
  | "KpiCard"
  | "Chart"
  | "Tree"
  | "StatusChip"
  | "Badge"
  // Workflow
  | "TaskInbox"
  | "ApprovalPanel"
  | "ProcessTimeline"
  | "TransitionButton"
  // Navigation/Action
  | "Button"
  | "MenuButton"
  | "Breadcrumb"
  | "Link"
  // Enterprise
  | "ObjectHeader"
  | "MasterDetail"
  | "Dashboard"
  | "WorkspaceShell"
  | "Stepper"

export type SemanticCategory =
  | "foundation"
  | "data-entry"
  | "data-display"
  | "workflow"
  | "navigation-action"
  | "enterprise"

export const SEMANTIC_CATALOGUE: Record<SemanticCategory, SemanticType[]> = {
  foundation: ["Container", "Stack", "Grid", "Section", "Splitter", "Tabs"],
  "data-entry": [
    "FormField",
    "Select",
    "Autocomplete",
    "DatePicker",
    "NumberField",
    "FileUpload",
    "Toggle",
  ],
  "data-display": ["DataTable", "List", "Card", "KpiCard", "Chart", "Tree", "StatusChip", "Badge"],
  workflow: ["TaskInbox", "ApprovalPanel", "ProcessTimeline", "TransitionButton"],
  "navigation-action": ["Button", "MenuButton", "Breadcrumb", "Link"],
  enterprise: ["ObjectHeader", "MasterDetail", "Dashboard", "WorkspaceShell", "Stepper"],
}

export const ALL_SEMANTIC_TYPES: ReadonlySet<string> = new Set(
  Object.values(SEMANTIC_CATALOGUE).flat(),
)
