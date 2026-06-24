// Doc 06 §6.4 — semantic type prop contracts for validation [L32][L37]

import type { SemanticType } from "./semantic-types"

export type PropType =
  | "string"
  | "number"
  | "boolean"
  | "binding"
  | "string[]"
  | "number[]"
  | "record"
  | "unknown"

export interface PropDefinition {
  type: PropType
  required: boolean
}

export interface SemanticContract {
  semanticType: SemanticType
  props: Record<string, PropDefinition>
  slots?: string[]
  events?: string[]
}

// DMS-critical subset (Doc 06 DS1) + remaining types with minimal contracts
export const SEMANTIC_CONTRACTS: Record<SemanticType, SemanticContract> = {
  // Foundation
  Container: {
    semanticType: "Container",
    props: { padding: { type: "string", required: false } },
    slots: ["children"],
  },
  Stack: {
    semanticType: "Stack",
    props: {
      direction: { type: "string", required: false },
      gap: { type: "string", required: false },
    },
    slots: ["children"],
  },
  Grid: {
    semanticType: "Grid",
    props: {
      columns: { type: "number", required: false },
      gap: { type: "string", required: false },
    },
    slots: ["children"],
  },
  Section: {
    semanticType: "Section",
    props: {
      title: { type: "string", required: false },
      collapsible: { type: "boolean", required: false },
    },
    slots: ["children"],
  },
  Splitter: {
    semanticType: "Splitter",
    props: {
      orientation: { type: "string", required: false },
      sizes: { type: "number[]", required: false },
    },
    slots: ["primary", "secondary"],
  },
  Tabs: {
    semanticType: "Tabs",
    props: { defaultTab: { type: "string", required: false } },
    slots: ["tabs"],
    events: ["onChange"],
  },

  // Data Entry
  FormField: {
    semanticType: "FormField",
    props: {
      label: { type: "string", required: true },
      fieldType: { type: "string", required: true },
      required: { type: "boolean", required: false },
      placeholder: { type: "string", required: false },
      disabled: { type: "boolean", required: false },
    },
    events: ["onChange", "onBlur"],
  },
  Select: {
    semanticType: "Select",
    props: {
      label: { type: "string", required: true },
      options: { type: "record", required: false },
      multiple: { type: "boolean", required: false },
    },
    events: ["onChange"],
  },
  Autocomplete: {
    semanticType: "Autocomplete",
    props: {
      label: { type: "string", required: true },
      searchable: { type: "boolean", required: false },
    },
    events: ["onChange", "onSearch"],
  },
  DatePicker: {
    semanticType: "DatePicker",
    props: {
      label: { type: "string", required: true },
      format: { type: "string", required: false },
    },
    events: ["onChange"],
  },
  NumberField: {
    semanticType: "NumberField",
    props: {
      label: { type: "string", required: true },
      min: { type: "number", required: false },
      max: { type: "number", required: false },
      step: { type: "number", required: false },
    },
    events: ["onChange"],
  },
  FileUpload: {
    semanticType: "FileUpload",
    props: {
      label: { type: "string", required: true },
      accept: { type: "string[]", required: false },
      maxSize: { type: "number", required: false },
    },
    events: ["onUpload"],
  },
  Toggle: {
    semanticType: "Toggle",
    props: {
      label: { type: "string", required: true },
      defaultChecked: { type: "boolean", required: false },
    },
    events: ["onChange"],
  },

  // Data Display (DMS-critical)
  DataTable: {
    semanticType: "DataTable",
    props: {
      editable: { type: "boolean", required: false },
      columns: { type: "record", required: false },
      aggregations: { type: "record", required: false },
      selectable: { type: "boolean", required: false },
      paginated: { type: "boolean", required: false },
    },
    slots: ["toolbar", "footer"],
    events: ["onSelect", "onChange"],
  },
  List: {
    semanticType: "List",
    props: { itemLayout: { type: "string", required: false } },
    slots: ["item"],
    events: ["onSelect"],
  },
  Card: {
    semanticType: "Card",
    props: {
      title: { type: "string", required: false },
      subtitle: { type: "string", required: false },
    },
    slots: ["header", "content", "actions"],
  },
  KpiCard: {
    semanticType: "KpiCard",
    props: {
      title: { type: "string", required: true },
      value: { type: "string", required: true },
      trend: { type: "string", required: false },
    },
  },
  Chart: {
    semanticType: "Chart",
    props: {
      chartType: { type: "string", required: true },
      title: { type: "string", required: false },
    },
  },
  Tree: {
    semanticType: "Tree",
    props: {
      selectable: { type: "boolean", required: false },
      expandable: { type: "boolean", required: false },
    },
    events: ["onSelect", "onExpand"],
  },
  StatusChip: {
    semanticType: "StatusChip",
    props: {
      label: { type: "string", required: true },
      variant: { type: "string", required: false },
    },
  },
  Badge: {
    semanticType: "Badge",
    props: {
      content: { type: "string", required: false },
      variant: { type: "string", required: false },
    },
  },

  // Workflow (DMS-critical)
  TaskInbox: {
    semanticType: "TaskInbox",
    props: {
      title: { type: "string", required: false },
      showFilters: { type: "boolean", required: false },
    },
    events: ["onSelect", "onAction"],
  },
  ApprovalPanel: {
    semanticType: "ApprovalPanel",
    props: { title: { type: "string", required: false } },
    events: ["onApprove", "onReject"],
  },
  ProcessTimeline: {
    semanticType: "ProcessTimeline",
    props: { orientation: { type: "string", required: false } },
  },
  TransitionButton: {
    semanticType: "TransitionButton",
    props: {
      label: { type: "string", required: true },
      transition: { type: "string", required: true },
    },
    events: ["onClick"],
  },

  // Navigation/Action
  Button: {
    semanticType: "Button",
    props: {
      label: { type: "string", required: true },
      variant: { type: "string", required: false },
      disabled: { type: "boolean", required: false },
    },
    events: ["onClick"],
  },
  MenuButton: {
    semanticType: "MenuButton",
    props: {
      label: { type: "string", required: true },
      items: { type: "record", required: false },
    },
    events: ["onSelect"],
  },
  Breadcrumb: {
    semanticType: "Breadcrumb",
    props: { separator: { type: "string", required: false } },
  },
  Link: {
    semanticType: "Link",
    props: {
      label: { type: "string", required: true },
      href: { type: "string", required: true },
    },
    events: ["onClick"],
  },

  // Enterprise (DMS-critical)
  ObjectHeader: {
    semanticType: "ObjectHeader",
    props: {
      title: { type: "string", required: true },
      subtitle: { type: "string", required: false },
      status: { type: "string", required: false },
      avatar: { type: "string", required: false },
    },
    slots: ["actions", "tags"],
  },
  MasterDetail: {
    semanticType: "MasterDetail",
    props: {
      orientation: { type: "string", required: false },
      masterWidth: { type: "string", required: false },
    },
    slots: ["master", "detail"],
    events: ["onSelect"],
  },
  Dashboard: {
    semanticType: "Dashboard",
    props: {
      title: { type: "string", required: false },
      columns: { type: "number", required: false },
    },
    slots: ["widgets"],
  },
  WorkspaceShell: {
    semanticType: "WorkspaceShell",
    props: { title: { type: "string", required: false } },
    slots: ["sidebar", "content", "toolbar"],
  },
  Stepper: {
    semanticType: "Stepper",
    props: {
      orientation: { type: "string", required: false },
      linear: { type: "boolean", required: false },
    },
    slots: ["steps"],
    events: ["onStepChange"],
  },

  // Foundation additions
  Separator: {
    semanticType: "Separator",
    props: {
      orientation: { type: "string", required: false },
    },
  },

  // Data Entry additions
  TextArea: {
    semanticType: "TextArea",
    props: {
      label: { type: "string", required: true },
      rows: { type: "number", required: false },
      placeholder: { type: "string", required: false },
    },
    events: ["onChange"],
  },
  Checkbox: {
    semanticType: "Checkbox",
    props: {
      label: { type: "string", required: true },
      defaultChecked: { type: "boolean", required: false },
    },
    events: ["onChange"],
  },
  RadioGroup: {
    semanticType: "RadioGroup",
    props: {
      label: { type: "string", required: true },
      options: { type: "record", required: false },
    },
    events: ["onChange"],
  },

  // Data Display additions
  Avatar: {
    semanticType: "Avatar",
    props: {
      src: { type: "string", required: false },
      alt: { type: "string", required: false },
    },
  },
  Alert: {
    semanticType: "Alert",
    props: {
      severity: { type: "string", required: false },
      message: { type: "string", required: true },
    },
  },
  DescriptionList: {
    semanticType: "DescriptionList",
    props: {
      items: { type: "record", required: false },
    },
  },

  // Navigation additions
  Toolbar: {
    semanticType: "Toolbar",
    props: {
      variant: { type: "string", required: false },
    },
    slots: ["children"],
  },
}
