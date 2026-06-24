// Phase 4 §7 / Phase 5 T8.1.1 — semanticType → MUI component mapping
// BOUNDARY: this file must NOT import from @/shared/ui [Phase 4 §7.1]

import React from "react"
import type { SemanticType } from "@/domain/types"
import type { RuntimeComponentProps } from "./types"

import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import TextField from "@mui/material/TextField"
import MuiAutocomplete from "@mui/material/Autocomplete"
import MuiCheckbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import RadioGroup from "@mui/material/RadioGroup"
import Radio from "@mui/material/Radio"
import MuiButton from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import MuiAvatar from "@mui/material/Avatar"
import MuiAlert from "@mui/material/Alert"
import MuiTabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import MuiToolbar from "@mui/material/Toolbar"
import MenuItem from "@mui/material/MenuItem"
import Paper from "@mui/material/Paper"
import { DataGridPro } from "@mui/x-data-grid-pro"

import { isBinding } from "@/domain/types/nodes"
import type { PropValue, Binding } from "@/domain/types"
import { BindingPlaceholder } from "./BindingPlaceholder"

function resolvePropDisplay(value: PropValue | undefined, fallback: string): string {
  if (value === undefined || value === null) return fallback
  if (isBinding(value)) {
    const b = value as Binding
    return `{{ ${b.bind.ref}${b.bind.path ? "." + b.bind.path : ""} }}`
  }
  return String(value)
}

// T8.4.1 — broken binding red placeholder: returns React element for bound props
function resolveBindingElement(
  value: PropValue | undefined,
  fallback: string,
): React.ReactNode {
  if (value === undefined || value === null) return fallback
  if (isBinding(value)) {
    return React.createElement(BindingPlaceholder, { binding: value as Binding })
  }
  return String(value)
}

function getProps(node: RuntimeComponentProps["node"]): Record<string, PropValue> {
  const data = node.data as Record<string, unknown>
  return (data.props ?? {}) as Record<string, PropValue>
}

// ── Foundation ──────────────────────────────────────────────────────────────

const ContainerComponent: React.FC<RuntimeComponentProps> = ({ children }) => (
  React.createElement(Box, { sx: { p: 1 } }, children)
)

const StackComponent: React.FC<RuntimeComponentProps> = ({ node, children }) => {
  const props = getProps(node)
  return React.createElement(Stack, {
    direction: (resolvePropDisplay(props.direction, "column")) as "row" | "column",
    spacing: 1,
  }, children)
}

const GridComponent: React.FC<RuntimeComponentProps> = ({ node, children }) => {
  const props = getProps(node)
  const cols = typeof props.columns === "number" ? props.columns : 2
  return React.createElement(Box, {
    sx: {
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: resolvePropDisplay(props.gap, "8px"),
    },
  }, children)
}

const SectionComponent: React.FC<RuntimeComponentProps> = ({ node, children }) => {
  const props = getProps(node)
  const data = node.data as Record<string, unknown>
  const label = typeof data.label === "string" ? data.label : resolvePropDisplay(props.title, "")
  return React.createElement(Box, { sx: { mb: 2 } },
    label ? React.createElement(Typography, { variant: "subtitle2", sx: { mb: 1, fontWeight: 600 } }, label) : null,
    children,
  )
}

const SplitterComponent: React.FC<RuntimeComponentProps> = ({ children }) => (
  React.createElement(Box, { sx: { display: "flex", gap: 2 } }, children)
)

const TabsComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(MuiTabs, { value: 0 },
    React.createElement(Tab, { label: resolvePropDisplay(props.defaultTab, "Tab 1") }),
    React.createElement(Tab, { label: "Tab 2" }),
  )
}

const SeparatorComponent: React.FC<RuntimeComponentProps> = () => (
  React.createElement(Divider, { sx: { my: 1 } })
)

// ── Data Entry ──────────────────────────────────────────────────────────────

const FormFieldComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(TextField, {
    label: resolvePropDisplay(props.label, "Field"),
    size: "small",
    fullWidth: true,
    disabled: props.disabled === true,
    placeholder: resolvePropDisplay(props.placeholder, ""),
    sx: { mb: 1 },
  })
}

const SelectComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(TextField, {
    label: resolvePropDisplay(props.label, "Select"),
    select: true,
    size: "small",
    fullWidth: true,
    sx: { mb: 1 },
    value: "",
  },
    React.createElement(MenuItem, { value: "" }, "—"),
  )
}

const AutocompleteComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(MuiAutocomplete, {
    options: [] as string[],
    renderInput: (params: Record<string, unknown>) =>
      React.createElement(TextField, {
        ...params,
        label: resolvePropDisplay(props.label, "Search"),
        size: "small",
      } as Record<string, unknown>),
    fullWidth: true,
    sx: { mb: 1 },
  })
}

const DatePickerComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(TextField, {
    label: resolvePropDisplay(props.label, "Date"),
    type: "date",
    size: "small",
    fullWidth: true,
    slotProps: { inputLabel: { shrink: true } },
    sx: { mb: 1 },
  })
}

const NumberFieldComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(TextField, {
    label: resolvePropDisplay(props.label, "Number"),
    type: "number",
    size: "small",
    fullWidth: true,
    sx: { mb: 1 },
  })
}

const FileUploadComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Box, { sx: { mb: 1, p: 2, border: "1px dashed", borderColor: "divider", borderRadius: 1 } },
    React.createElement(Typography, { variant: "body2", color: "text.secondary" },
      resolvePropDisplay(props.label, "Upload file")),
  )
}

const ToggleComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(FormControlLabel, {
    control: React.createElement(MuiCheckbox, { defaultChecked: props.defaultChecked === true }),
    label: resolvePropDisplay(props.label, "Toggle"),
    sx: { mb: 1 },
  })
}

const TextAreaComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  const rows = typeof props.rows === "number" ? props.rows : 3
  return React.createElement(TextField, {
    label: resolvePropDisplay(props.label, "Text"),
    multiline: true,
    rows,
    size: "small",
    fullWidth: true,
    sx: { mb: 1 },
  })
}

const CheckboxComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(FormControlLabel, {
    control: React.createElement(MuiCheckbox, { defaultChecked: props.defaultChecked === true }),
    label: resolvePropDisplay(props.label, "Checkbox"),
    sx: { mb: 1 },
  })
}

const RadioGroupComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Box, { sx: { mb: 1 } },
    React.createElement(Typography, { variant: "body2", sx: { mb: 0.5 } },
      resolvePropDisplay(props.label, "Options")),
    React.createElement(RadioGroup, null,
      React.createElement(FormControlLabel, { value: "a", control: React.createElement(Radio, { size: "small" }), label: "Option A" }),
      React.createElement(FormControlLabel, { value: "b", control: React.createElement(Radio, { size: "small" }), label: "Option B" }),
    ),
  )
}

// ── Data Display ────────────────────────────────────────────────────────────

const DataTableComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  const paginated = props.paginated === true
  return React.createElement(Box, { sx: { height: 300, width: "100%", mb: 1 } },
    React.createElement(DataGridPro, {
      rows: [
        { id: 1, col1: "Sample", col2: "Data", col3: 100 },
        { id: 2, col1: "Row 2", col2: "Preview", col3: 200 },
      ],
      columns: [
        { field: "col1", headerName: "Column 1", flex: 1 },
        { field: "col2", headerName: "Column 2", flex: 1 },
        { field: "col3", headerName: "Amount", flex: 1, type: "number" },
      ],
      pagination: paginated ? true : undefined,
      density: "compact",
      disableRowSelectionOnClick: true,
    }),
  )
}

const ListComponent: React.FC<RuntimeComponentProps> = ({ children }) => (
  React.createElement(Box, { sx: { mb: 1 } }, children)
)

const CardComponent: React.FC<RuntimeComponentProps> = ({ node, children }) => {
  const props = getProps(node)
  return React.createElement(Paper, { variant: "outlined", sx: { p: 2, mb: 1 } },
    props.title ? React.createElement(Typography, { variant: "subtitle2" }, resolvePropDisplay(props.title, "")) : null,
    children,
  )
}

const KpiCardComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Paper, { variant: "outlined", sx: { p: 2, textAlign: "center", mb: 1 } },
    React.createElement(Typography, { variant: "caption", color: "text.secondary", component: "div" },
      resolveBindingElement(props.title, "KPI")),
    React.createElement(Typography, { variant: "h5", sx: { fontWeight: 700 }, component: "div" },
      resolveBindingElement(props.value, "—")),
  )
}

const ChartComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Box, {
    sx: { height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 1 },
  },
    React.createElement(Typography, { color: "text.secondary" },
      `[${resolvePropDisplay(props.chartType, "Chart")}] ${resolvePropDisplay(props.title, "")}`),
  )
}

const TreeComponent: React.FC<RuntimeComponentProps> = () => (
  React.createElement(Box, {
    sx: { p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 1 },
  },
    React.createElement(Typography, { variant: "body2", color: "text.secondary" }, "[Tree view placeholder]"),
  )
)

const StatusChipComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Chip, {
    label: resolvePropDisplay(props.label, "Status"),
    size: "small",
    color: "default",
    sx: { mb: 1 },
  })
}

const BadgeComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Chip, {
    label: resolvePropDisplay(props.content, "Badge"),
    size: "small",
    variant: "outlined",
    sx: { mb: 1 },
  })
}

const AvatarComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(MuiAvatar, {
    alt: resolvePropDisplay(props.alt, ""),
    sx: { mb: 1 },
  })
}

const AlertComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  const severity = resolvePropDisplay(props.severity, "info")
  const validSeverity = (["error", "warning", "info", "success"].includes(severity) ? severity : "info") as "error" | "warning" | "info" | "success"
  return React.createElement(MuiAlert, {
    severity: validSeverity,
    sx: { mb: 1 },
  }, resolvePropDisplay(props.message, "Alert"))
}

const DescriptionListComponent: React.FC<RuntimeComponentProps> = () => (
  React.createElement(Box, { sx: { mb: 1 } },
    React.createElement(Typography, { variant: "body2", color: "text.secondary" }, "[Description list placeholder]"),
  )
)

// ── Workflow ─────────────────────────────────────────────────────────────────

const TaskInboxComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Paper, { variant: "outlined", sx: { p: 2, mb: 1 } },
    React.createElement(Typography, { variant: "subtitle2" }, resolvePropDisplay(props.title, "Task Inbox")),
    React.createElement(Typography, { variant: "body2", color: "text.secondary" }, "[Tasks placeholder]"),
  )
}

const ApprovalPanelComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Paper, { variant: "outlined", sx: { p: 2, mb: 1 } },
    React.createElement(Typography, { variant: "subtitle2" }, resolvePropDisplay(props.title, "Approval")),
    React.createElement(Stack, { direction: "row", spacing: 1, sx: { mt: 1 } },
      React.createElement(MuiButton, { variant: "contained", color: "success", size: "small" }, "Approve"),
      React.createElement(MuiButton, { variant: "outlined", color: "error", size: "small" }, "Reject"),
    ),
  )
}

const ProcessTimelineComponent: React.FC<RuntimeComponentProps> = () => (
  React.createElement(Box, {
    sx: { p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 1 },
  },
    React.createElement(Typography, { variant: "body2", color: "text.secondary" }, "[Process timeline placeholder]"),
  )
)

const TransitionButtonComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(MuiButton, {
    variant: "contained",
    size: "small",
    sx: { mb: 1 },
  }, resolvePropDisplay(props.label, "Transition"))
}

// ── Navigation ──────────────────────────────────────────────────────────────

const ButtonComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(MuiButton, {
    variant: resolvePropDisplay(props.variant, "contained") as "contained" | "outlined" | "text",
    size: "small",
    disabled: props.disabled === true,
    sx: { mb: 1 },
  }, resolvePropDisplay(props.label, "Button"))
}

const MenuButtonComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(MuiButton, {
    variant: "outlined",
    size: "small",
    sx: { mb: 1 },
  }, `${resolvePropDisplay(props.label, "Menu")} ▾`)
}

const BreadcrumbComponent: React.FC<RuntimeComponentProps> = () => (
  React.createElement(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 1 } },
    "Home / Page")
)

const LinkComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Typography, {
    variant: "body2",
    sx: { color: "primary.main", textDecoration: "underline", cursor: "pointer", mb: 1 },
  }, resolvePropDisplay(props.label, "Link"))
}

const ToolbarComponent: React.FC<RuntimeComponentProps> = ({ children }) => (
  React.createElement(MuiToolbar, { variant: "dense", disableGutters: true, sx: { mb: 1, gap: 1 } }, children)
)

// ── Enterprise ──────────────────────────────────────────────────────────────

const ObjectHeaderComponent: React.FC<RuntimeComponentProps> = ({ node }) => {
  const props = getProps(node)
  return React.createElement(Box, { sx: { mb: 2, pb: 1, borderBottom: "1px solid", borderColor: "divider" } },
    React.createElement(Typography, { variant: "h6", sx: { fontWeight: 700 }, component: "div" },
      resolveBindingElement(props.title, "Object")),
    props.subtitle ? React.createElement(Typography, { variant: "body2", color: "text.secondary", component: "div" },
      resolveBindingElement(props.subtitle, "")) : null,
    props.status ? React.createElement(Chip, {
      label: resolvePropDisplay(props.status, ""),
      size: "small",
      sx: { mt: 0.5 },
    }) : null,
  )
}

const MasterDetailComponent: React.FC<RuntimeComponentProps> = ({ children }) => (
  React.createElement(Box, { sx: { display: "flex", gap: 2 } }, children)
)

const DashboardComponent: React.FC<RuntimeComponentProps> = ({ node, children }) => {
  const props = getProps(node)
  const cols = typeof props.columns === "number" ? props.columns : 2
  return React.createElement(Box, {
    sx: { display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, mb: 1 },
  }, children)
}

const WorkspaceShellComponent: React.FC<RuntimeComponentProps> = ({ children }) => (
  React.createElement(Box, { sx: { display: "flex", flexDirection: "column", gap: 1 } }, children)
)

const StepperComponent: React.FC<RuntimeComponentProps> = () => (
  React.createElement(Box, {
    sx: { p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 1 },
  },
    React.createElement(Typography, { variant: "body2", color: "text.secondary" }, "[Stepper placeholder]"),
  )
)

// ── Fallback ────────────────────────────────────────────────────────────────

function createFallback(semanticType: string): React.FC<RuntimeComponentProps> {
  const Fallback: React.FC<RuntimeComponentProps> = () =>
    React.createElement(Box, {
      sx: {
        p: 1,
        mb: 1,
        border: "1px dashed",
        borderColor: "grey.400",
        borderRadius: 1,
        bgcolor: "grey.50",
      },
    },
      React.createElement(Typography, { variant: "caption", color: "text.secondary" },
        `[${semanticType}]`),
    )
  Fallback.displayName = `Fallback(${semanticType})`
  return Fallback
}

// ── Component Map ───────────────────────────────────────────────────────────

export const componentMap: Record<SemanticType, React.FC<RuntimeComponentProps>> = {
  // Foundation
  Container: ContainerComponent,
  Stack: StackComponent,
  Grid: GridComponent,
  Section: SectionComponent,
  Splitter: SplitterComponent,
  Tabs: TabsComponent,
  Separator: SeparatorComponent,

  // Data Entry
  FormField: FormFieldComponent,
  Select: SelectComponent,
  Autocomplete: AutocompleteComponent,
  DatePicker: DatePickerComponent,
  NumberField: NumberFieldComponent,
  FileUpload: FileUploadComponent,
  Toggle: ToggleComponent,
  TextArea: TextAreaComponent,
  Checkbox: CheckboxComponent,
  RadioGroup: RadioGroupComponent,

  // Data Display
  DataTable: DataTableComponent,
  List: ListComponent,
  Card: CardComponent,
  KpiCard: KpiCardComponent,
  Chart: ChartComponent,
  Tree: TreeComponent,
  StatusChip: StatusChipComponent,
  Badge: BadgeComponent,
  Avatar: AvatarComponent,
  Alert: AlertComponent,
  DescriptionList: DescriptionListComponent,

  // Workflow
  TaskInbox: TaskInboxComponent,
  ApprovalPanel: ApprovalPanelComponent,
  ProcessTimeline: ProcessTimelineComponent,
  TransitionButton: TransitionButtonComponent,

  // Navigation
  Button: ButtonComponent,
  MenuButton: MenuButtonComponent,
  Breadcrumb: BreadcrumbComponent,
  Link: LinkComponent,
  Toolbar: ToolbarComponent,

  // Enterprise
  ObjectHeader: ObjectHeaderComponent,
  MasterDetail: MasterDetailComponent,
  Dashboard: DashboardComponent,
  WorkspaceShell: WorkspaceShellComponent,
  Stepper: StepperComponent,
}

export function getComponentForType(semanticType: string): React.FC<RuntimeComponentProps> {
  const component = componentMap[semanticType as SemanticType]
  if (component) return component
  return createFallback(semanticType)
}
