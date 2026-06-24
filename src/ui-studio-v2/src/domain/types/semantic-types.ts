// Doc 06 §6.4 — canonical semantic component catalogue [L32]

export type SemanticType =
  // Foundation (7)
  | "Container"
  | "Stack"
  | "Grid"
  | "Section"
  | "Splitter"
  | "Tabs"
  | "Separator"
  // Data Entry (10)
  | "FormField"
  | "Select"
  | "Autocomplete"
  | "DatePicker"
  | "NumberField"
  | "FileUpload"
  | "Toggle"
  | "TextArea"
  | "Checkbox"
  | "RadioGroup"
  // Data Display (11)
  | "DataTable"
  | "List"
  | "Card"
  | "KpiCard"
  | "Chart"
  | "Tree"
  | "StatusChip"
  | "Badge"
  | "Avatar"
  | "Alert"
  | "DescriptionList"
  // Workflow (4)
  | "TaskInbox"
  | "ApprovalPanel"
  | "ProcessTimeline"
  | "TransitionButton"
  // Navigation (5)
  | "Button"
  | "MenuButton"
  | "Breadcrumb"
  | "Link"
  | "Toolbar"
  // Enterprise (5)
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
  | "navigation"
  | "enterprise"

export const SEMANTIC_CATALOGUE: Record<SemanticCategory, SemanticType[]> = {
  foundation: ["Container", "Stack", "Grid", "Section", "Splitter", "Tabs", "Separator"],
  "data-entry": [
    "FormField",
    "Select",
    "Autocomplete",
    "DatePicker",
    "NumberField",
    "FileUpload",
    "Toggle",
    "TextArea",
    "Checkbox",
    "RadioGroup",
  ],
  "data-display": [
    "DataTable",
    "List",
    "Card",
    "KpiCard",
    "Chart",
    "Tree",
    "StatusChip",
    "Badge",
    "Avatar",
    "Alert",
    "DescriptionList",
  ],
  workflow: ["TaskInbox", "ApprovalPanel", "ProcessTimeline", "TransitionButton"],
  navigation: ["Button", "MenuButton", "Breadcrumb", "Link", "Toolbar"],
  enterprise: ["ObjectHeader", "MasterDetail", "Dashboard", "WorkspaceShell", "Stepper"],
}

export const ALL_SEMANTIC_TYPES: ReadonlySet<string> = new Set(
  Object.values(SEMANTIC_CATALOGUE).flat(),
)
