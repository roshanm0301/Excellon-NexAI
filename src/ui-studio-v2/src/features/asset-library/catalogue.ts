// Phase 7 — CANONICAL component + archetype catalogue
// Source of truth for the asset library. Must match Architecture-Spec-06 §6.4.

export type CatalogueCategory =
  | "Foundation"
  | "Data Entry"
  | "Data Display"
  | "Workflow"
  | "Navigation"
  | "Enterprise"

export interface CatalogueEntry {
  semanticType: string
  kind: "component"
  label: string
  icon: string
  category: CatalogueCategory
  defaultProps: Record<string, unknown>
  targetProfiles: string[]
}

export interface ArchetypeEntry {
  semanticType: string
  kind: "archetype"
  label: string
  icon: string
  description: string
  defaultProps: Record<string, unknown>
}

// ── Archetypes (Phase 2 §B3) ─────────────────────────────────────────────────

export const ARCHETYPES: ArchetypeEntry[] = [
  {
    semanticType: "list-report",
    kind: "archetype",
    label: "List Report",
    icon: "▤",
    description: "Searchable list with inline filters",
    defaultProps: { columns: 3, filterable: true },
  },
  {
    semanticType: "transaction-entry",
    kind: "archetype",
    label: "Transaction Entry",
    icon: "▥",
    description: "Header-line form for business transactions",
    defaultProps: { sections: 2, hasLines: true },
  },
  {
    semanticType: "master-detail",
    kind: "archetype",
    label: "Master-Detail",
    icon: "▦",
    description: "Left list, right detail pane",
    defaultProps: { splitRatio: 40 },
  },
  {
    semanticType: "object-detail",
    kind: "archetype",
    label: "Object Detail",
    icon: "▧",
    description: "Single-object detail with tabbed sections",
    defaultProps: { tabs: 3 },
  },
  {
    semanticType: "dashboard",
    kind: "archetype",
    label: "Dashboard",
    icon: "▨",
    description: "KPI cards and chart grid",
    defaultProps: { columns: 3, rows: 2 },
  },
]

// ── Components by category ────────────────────────────────────────────────────

export const COMPONENTS: CatalogueEntry[] = [
  // Foundation
  { semanticType: "Container", kind: "component", label: "Container", icon: "□", category: "Foundation", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Stack", kind: "component", label: "Stack", icon: "≡", category: "Foundation", defaultProps: { direction: "vertical" }, targetProfiles: ["web"] },
  { semanticType: "Grid", kind: "component", label: "Grid", icon: "⊞", category: "Foundation", defaultProps: { columns: 2 }, targetProfiles: ["web"] },
  { semanticType: "Section", kind: "component", label: "Section", icon: "§", category: "Foundation", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Splitter", kind: "component", label: "Splitter", icon: "‖", category: "Foundation", defaultProps: { orientation: "horizontal" }, targetProfiles: ["web"] },
  { semanticType: "Tabs", kind: "component", label: "Tabs", icon: "⊟", category: "Foundation", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Separator", kind: "component", label: "Separator", icon: "—", category: "Foundation", defaultProps: {}, targetProfiles: ["web"] },

  // Data Entry
  { semanticType: "FormField", kind: "component", label: "Form Field", icon: "✎", category: "Data Entry", defaultProps: { type: "text" }, targetProfiles: ["web"] },
  { semanticType: "Select", kind: "component", label: "Select", icon: "▾", category: "Data Entry", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Autocomplete", kind: "component", label: "Autocomplete", icon: "⌕", category: "Data Entry", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "DatePicker", kind: "component", label: "Date Picker", icon: "📅", category: "Data Entry", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "NumberField", kind: "component", label: "Number Field", icon: "#", category: "Data Entry", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "FileUpload", kind: "component", label: "File Upload", icon: "↑", category: "Data Entry", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Toggle", kind: "component", label: "Toggle", icon: "⊘", category: "Data Entry", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "TextArea", kind: "component", label: "Text Area", icon: "¶", category: "Data Entry", defaultProps: { rows: 3 }, targetProfiles: ["web"] },
  { semanticType: "Checkbox", kind: "component", label: "Checkbox", icon: "☑", category: "Data Entry", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "RadioGroup", kind: "component", label: "Radio Group", icon: "◉", category: "Data Entry", defaultProps: {}, targetProfiles: ["web"] },

  // Data Display
  { semanticType: "DataTable", kind: "component", label: "Data Table", icon: "▦", category: "Data Display", defaultProps: { pagination: true }, targetProfiles: ["web"] },
  { semanticType: "List", kind: "component", label: "List", icon: "≡", category: "Data Display", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Card", kind: "component", label: "Card", icon: "▢", category: "Data Display", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "KpiCard", kind: "component", label: "KPI Card", icon: "▣", category: "Data Display", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Chart", kind: "component", label: "Chart", icon: "📊", category: "Data Display", defaultProps: { type: "bar" }, targetProfiles: ["web"] },
  { semanticType: "Tree", kind: "component", label: "Tree", icon: "🌳", category: "Data Display", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "StatusChip", kind: "component", label: "Status Chip", icon: "●", category: "Data Display", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Badge", kind: "component", label: "Badge", icon: "◆", category: "Data Display", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Avatar", kind: "component", label: "Avatar", icon: "◯", category: "Data Display", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Alert", kind: "component", label: "Alert", icon: "⚠", category: "Data Display", defaultProps: { variant: "info" }, targetProfiles: ["web"] },
  { semanticType: "DescriptionList", kind: "component", label: "Description List", icon: "☰", category: "Data Display", defaultProps: {}, targetProfiles: ["web"] },

  // Workflow
  { semanticType: "TaskInbox", kind: "component", label: "Task Inbox", icon: "📥", category: "Workflow", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "ApprovalPanel", kind: "component", label: "Approval Panel", icon: "✓", category: "Workflow", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "ProcessTimeline", kind: "component", label: "Process Timeline", icon: "→", category: "Workflow", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "TransitionButton", kind: "component", label: "Transition Button", icon: "▶", category: "Workflow", defaultProps: {}, targetProfiles: ["web"] },

  // Navigation
  { semanticType: "Button", kind: "component", label: "Button", icon: "⊡", category: "Navigation", defaultProps: { variant: "primary" }, targetProfiles: ["web"] },
  { semanticType: "MenuButton", kind: "component", label: "Menu Button", icon: "☰", category: "Navigation", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Breadcrumb", kind: "component", label: "Breadcrumb", icon: "›", category: "Navigation", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Link", kind: "component", label: "Link", icon: "🔗", category: "Navigation", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Toolbar", kind: "component", label: "Toolbar", icon: "▬", category: "Navigation", defaultProps: {}, targetProfiles: ["web"] },

  // Enterprise
  { semanticType: "ObjectHeader", kind: "component", label: "Object Header", icon: "▤", category: "Enterprise", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "MasterDetail", kind: "component", label: "Master Detail", icon: "▥", category: "Enterprise", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Dashboard", kind: "component", label: "Dashboard", icon: "▨", category: "Enterprise", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "WorkspaceShell", kind: "component", label: "Workspace Shell", icon: "◫", category: "Enterprise", defaultProps: {}, targetProfiles: ["web"] },
  { semanticType: "Stepper", kind: "component", label: "Stepper", icon: "①", category: "Enterprise", defaultProps: {}, targetProfiles: ["web"] },
]

export const CATEGORIES: CatalogueCategory[] = [
  "Foundation",
  "Data Entry",
  "Data Display",
  "Workflow",
  "Navigation",
  "Enterprise",
]
