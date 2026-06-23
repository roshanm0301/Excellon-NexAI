// Phase 4 §6 — seeded DMS application: Vertical baseline + Toyota overlay + Dealer-X
// Deterministic IDs for reproducibility. Exercises all 5 origin states.

import type { CascadeLevel, Audit, NodeBase } from "@/domain/types"
import type {
  ApplicationNode,
  ModuleNode,
  PageNode,
  ViewNode,
  SectionNode,
  LayoutNode,
  ComponentNode,
  DataSourceNode,
  StateNode,
  ActionNode,
  EventNode,
  WorkflowBindingNode,
  NavigationNode,
  ThemeNode,
  MetaNode,
} from "@/domain/types"

const audit: Audit = {
  createdBy: "seed",
  createdAt: "2024-01-01T00:00:00Z",
  modifiedBy: "seed",
  modifiedAt: "2024-01-01T00:00:00Z",
}

function base(
  id: string,
  logicalKey: string,
  level: CascadeLevel,
  extra?: Partial<NodeBase>,
): NodeBase {
  return {
    id,
    logicalKey,
    cascadeLevel: level,
    objectVersion: 1,
    audit,
    ...extra,
  }
}

// ── Vertical (Automotive) baseline ──────────────────────────────────────────

const app: ApplicationNode = {
  ...base("uuid-app-001", "app.dms", "vertical"),
  kind: "application",
  name: "Dealer Management System",
  description: "Full-stack DMS for automotive dealerships",
  verticalScope: "automotive",
  targetProfiles: ["web"],
  modules: ["mod.sales"],
  navigationRef: "nav.dms",
  themeRef: "theme.automotive",
  defaultEntryRef: "page.orderList",
}

const salesModule: ModuleNode = {
  ...base("uuid-mod-001", "mod.sales", "vertical"),
  kind: "module",
  name: "Sales Module",
  pages: ["page.salesOrder", "page.orderList"],
}

const salesOrderPage: PageNode = {
  ...base("uuid-page-001", "page.salesOrder", "vertical"),
  kind: "page",
  archetype: "transaction-entry",
  route: "/orders/:id",
  title: "Sales Order",
  views: ["view.orderHeader", "view.orderLines"],
  layoutRef: "layout.salesOrder",
  primaryDataSourceRef: "ds.salesOrder",
  pageState: ["state.orderDraft"],
  pageActions: ["action.submitOrder"],
}

const orderListPage: PageNode = {
  ...base("uuid-page-002", "page.orderList", "vertical"),
  kind: "page",
  archetype: "list-report",
  route: "/orders",
  title: "Orders",
  views: ["view.orderList"],
  layoutRef: "layout.orderList",
  primaryDataSourceRef: "ds.salesOrderList",
}

const orderHeaderView: ViewNode = {
  ...base("uuid-view-001", "view.orderHeader", "vertical"),
  kind: "view",
  dataSourceRef: "ds.salesOrder",
  sections: ["section.orderInfo", "section.orderStatus"],
  layoutRef: "layout.orderHeader",
}

const orderLinesView: ViewNode = {
  ...base("uuid-view-002", "view.orderLines", "vertical"),
  kind: "view",
  dataSourceRef: "ds.orderLines",
  sections: ["section.lines"],
  layoutRef: "layout.orderLines",
}

const orderListView: ViewNode = {
  ...base("uuid-view-003", "view.orderList", "vertical"),
  kind: "view",
  dataSourceRef: "ds.salesOrderList",
  sections: ["section.orderListGrid"],
  layoutRef: "layout.orderListView",
}

const sectionOrderInfo: SectionNode = {
  ...base("uuid-sec-001", "section.orderInfo", "vertical"),
  kind: "section",
  label: "Order Information",
  components: [
    "cmp.objectHeader",
    "cmp.orderNumber",
    "cmp.customerName",
    "cmp.orderDate",
    "cmp.discountField",
  ],
}

const sectionOrderStatus: SectionNode = {
  ...base("uuid-sec-002", "section.orderStatus", "vertical"),
  kind: "section",
  label: "Status & Actions",
  components: ["cmp.orderStatus", "cmp.submitButton"],
}

const sectionLines: SectionNode = {
  ...base("uuid-sec-003", "section.lines", "vertical"),
  kind: "section",
  label: "Order Lines",
  components: ["cmp.linesGrid"],
}

const sectionOrderListGrid: SectionNode = {
  ...base("uuid-sec-004", "section.orderListGrid", "vertical"),
  kind: "section",
  label: "All Orders",
  components: ["cmp.orderListGrid"],
}

const layoutSalesOrder: LayoutNode = {
  ...base("uuid-lay-001", "layout.salesOrder", "vertical"),
  kind: "layout",
  layoutType: "split",
  direction: "column",
  gap: "16px",
}

const layoutOrderList: LayoutNode = {
  ...base("uuid-lay-002", "layout.orderList", "vertical"),
  kind: "layout",
  layoutType: "stack",
  direction: "column",
  gap: "8px",
}

const layoutOrderHeader: LayoutNode = {
  ...base("uuid-lay-003", "layout.orderHeader", "vertical"),
  kind: "layout",
  layoutType: "form-grid",
  gap: "12px",
}

const layoutOrderLines: LayoutNode = {
  ...base("uuid-lay-004", "layout.orderLines", "vertical"),
  kind: "layout",
  layoutType: "stack",
  direction: "column",
  gap: "8px",
}

const layoutOrderListView: LayoutNode = {
  ...base("uuid-lay-005", "layout.orderListView", "vertical"),
  kind: "layout",
  layoutType: "stack",
  direction: "column",
}

// Components
const cmpObjectHeader: ComponentNode = {
  ...base("uuid-cmp-001", "cmp.objectHeader", "vertical"),
  kind: "component",
  semanticType: "ObjectHeader",
  props: {
    title: { bind: { kind: "dataSource", ref: "ds.salesOrder", path: "orderNumber" } },
    subtitle: "Sales Order",
    status: { bind: { kind: "state", ref: "state.orderDraft", path: "status" } },
  },
}

const cmpOrderNumber: ComponentNode = {
  ...base("uuid-cmp-002", "cmp.orderNumber", "vertical"),
  kind: "component",
  semanticType: "FormField",
  props: { label: "Order Number", fieldType: "text", disabled: true },
  dataBindingRef: { bind: { kind: "dataSource", ref: "ds.salesOrder", path: "orderNumber" } },
}

const cmpCustomerName: ComponentNode = {
  ...base("uuid-cmp-003", "cmp.customerName", "vertical"),
  kind: "component",
  semanticType: "Autocomplete",
  props: { label: "Customer", searchable: true },
  dataBindingRef: { bind: { kind: "dataSource", ref: "ds.salesOrder", path: "customerId" } },
}

const cmpOrderDate: ComponentNode = {
  ...base("uuid-cmp-004", "cmp.orderDate", "vertical"),
  kind: "component",
  semanticType: "DatePicker",
  props: { label: "Order Date", format: "yyyy-MM-dd" },
  dataBindingRef: { bind: { kind: "dataSource", ref: "ds.salesOrder", path: "orderDate" } },
}

const cmpDiscountField: ComponentNode = {
  ...base("uuid-cmp-005", "cmp.discountField", "vertical"),
  kind: "component",
  semanticType: "NumberField",
  props: { label: "Discount %", min: 0, max: 100, step: 0.5 },
  dataBindingRef: { bind: { kind: "dataSource", ref: "ds.salesOrder", path: "discount" } },
}

const cmpOrderStatus: ComponentNode = {
  ...base("uuid-cmp-006", "cmp.orderStatus", "vertical"),
  kind: "component",
  semanticType: "StatusChip",
  props: {
    label: { bind: { kind: "workflow", ref: "wf.orderApproval", path: "currentState" } },
    variant: "default",
  },
}

const cmpSubmitButton: ComponentNode = {
  ...base("uuid-cmp-007", "cmp.submitButton", "vertical"),
  kind: "component",
  semanticType: "TransitionButton",
  props: { label: "Submit for Approval", transition: "submit" },
  eventHandlers: ["evt.submitClick"],
}

const cmpLinesGrid: ComponentNode = {
  ...base("uuid-cmp-008", "cmp.linesGrid", "vertical"),
  kind: "component",
  semanticType: "DataTable",
  props: { editable: true, paginated: true, selectable: true },
  dataBindingRef: { bind: { kind: "dataSource", ref: "ds.orderLines" } },
}

const cmpOrderListGrid: ComponentNode = {
  ...base("uuid-cmp-009", "cmp.orderListGrid", "vertical"),
  kind: "component",
  semanticType: "DataTable",
  props: { editable: false, paginated: true, selectable: true },
  dataBindingRef: { bind: { kind: "dataSource", ref: "ds.salesOrderList" } },
}

// DataSources
const dsSalesOrder: DataSourceNode = {
  ...base("uuid-ds-001", "ds.salesOrder", "vertical"),
  kind: "dataSource",
  dataSourceType: "entity",
  targetRef: "entity.SalesOrder",
  writeCapability: true,
}

const dsOrderLines: DataSourceNode = {
  ...base("uuid-ds-002", "ds.orderLines", "vertical"),
  kind: "dataSource",
  dataSourceType: "relationship",
  targetRef: "entity.OrderLine",
  filter: { parentField: "orderId" },
  paging: { pageSize: 50 },
  writeCapability: true,
}

const dsSalesOrderList: DataSourceNode = {
  ...base("uuid-ds-003", "ds.salesOrderList", "vertical"),
  kind: "dataSource",
  dataSourceType: "entity",
  targetRef: "entity.SalesOrder",
  sort: { field: "orderDate", direction: "desc" },
  paging: { pageSize: 25 },
}

// Actions & Events
const actionSubmitOrder: ActionNode = {
  ...base("uuid-act-001", "action.submitOrder", "vertical"),
  kind: "action",
  actionKind: "trigger-workflow-transition",
  target: "wf.orderApproval",
  inputs: { transition: "submit" },
  preconditions: ["rule.orderHasLines"],
  confirmation: { message: "Submit this order for approval?" },
}

const evtSubmitClick: EventNode = {
  ...base("uuid-evt-001", "evt.submitClick", "vertical"),
  kind: "event",
  trigger: "onClick",
  sourceRef: "cmp.submitButton",
  actions: ["action.submitOrder"],
}

// Workflow binding
const wbOrderStatus: WorkflowBindingNode = {
  ...base("uuid-wb-001", "wb.orderStatus", "vertical"),
  kind: "workflowBinding",
  workflowRef: "wf.orderApproval",
  bindingKind: "show-current-state",
  attachPoint: "view.orderHeader",
  transitionActions: {
    submit: "action.submitOrder",
  },
}

// State
const stateOrderDraft: StateNode = {
  ...base("uuid-state-001", "state.orderDraft", "vertical"),
  kind: "state",
  scope: "page",
  shape: { status: "string", isDirty: "boolean" },
  initialValue: { status: "draft", isDirty: false },
  persistence: "session",
}

// Navigation
const navDms: NavigationNode = {
  ...base("uuid-nav-001", "nav.dms", "vertical"),
  kind: "navigation",
  entries: [
    { logicalKey: "nav.orders", label: "Orders", pageRef: "page.orderList", icon: "list" },
    {
      logicalKey: "nav.newOrder",
      label: "New Order",
      pageRef: "page.salesOrder",
      icon: "plus",
    },
  ],
}

// Theme
const themeAutomotive: ThemeNode = {
  ...base("uuid-theme-001", "theme.automotive", "vertical"),
  kind: "theme",
  tokens: {
    colorPrimary: "#1a56db",
    colorSecondary: "#6b7280",
    colorBackground: "#ffffff",
    fontFamily: "Inter, sans-serif",
    borderRadius: "6px",
  },
}

// ── Tenant (Toyota OEM) overlay ─────────────────────────────────────────────

const toyotaDiscountRemove: NodeBase = {
  ...base("uuid-toyota-001", "cmp.discountField.toyota", "tenant", {
    overrideOf: "cmp.discountField",
    overrideOps: [{ op: "remove", logicalKey: "cmp.discountField" }],
  }),
}

const toyotaThemeOverride: NodeBase = {
  ...base("uuid-toyota-002", "theme.automotive.toyota", "tenant", {
    overrideOf: "theme.automotive",
    overrideOps: [
      {
        op: "merge",
        path: "tokens",
        value: { colorPrimary: "#eb0a1e", colorSecondary: "#282830", fontFamily: "Toyota Type, sans-serif" },
      },
    ],
  }),
}

const toyotaHeaderOverride: NodeBase = {
  ...base("uuid-toyota-003", "cmp.objectHeader.toyota", "tenant", {
    overrideOf: "cmp.objectHeader",
    overrideOps: [
      { op: "set", path: "props.subtitle", value: "Toyota Sales Order" },
    ],
  }),
}

// ── Org (Dealer-X) overlay ──────────────────────────────────────────────────

const dealerXThemeOverride: NodeBase = {
  ...base("uuid-dealerx-001", "theme.automotive.dealerx", "org", {
    overrideOf: "theme.automotive",
    overrideOps: [
      {
        op: "merge",
        path: "tokens",
        value: { colorAccent: "#f59e0b" },
      },
    ],
  }),
}

const dealerXNavOverride: NodeBase = {
  ...base("uuid-dealerx-002", "nav.dms.dealerx", "org", {
    overrideOf: "nav.dms",
    overrideOps: [
      {
        op: "insert",
        path: "entries",
        logicalKey: "nav.dealerDashboard",
      },
    ],
  }),
}

// Own node at org level
const cmpDealerNotes: ComponentNode = {
  ...base("uuid-dealerx-003", "cmp.dealerNotes", "org"),
  kind: "component",
  semanticType: "FormField",
  props: { label: "Dealer Notes", fieldType: "textarea" },
}

// ── Exports ─────────────────────────────────────────────────────────────────

export const verticalNodes: MetaNode[] = [
  app,
  salesModule,
  salesOrderPage,
  orderListPage,
  orderHeaderView,
  orderLinesView,
  orderListView,
  sectionOrderInfo,
  sectionOrderStatus,
  sectionLines,
  sectionOrderListGrid,
  layoutSalesOrder,
  layoutOrderList,
  layoutOrderHeader,
  layoutOrderLines,
  layoutOrderListView,
  cmpObjectHeader,
  cmpOrderNumber,
  cmpCustomerName,
  cmpOrderDate,
  cmpDiscountField,
  cmpOrderStatus,
  cmpSubmitButton,
  cmpLinesGrid,
  cmpOrderListGrid,
  dsSalesOrder,
  dsOrderLines,
  dsSalesOrderList,
  actionSubmitOrder,
  evtSubmitClick,
  wbOrderStatus,
  stateOrderDraft,
  navDms,
  themeAutomotive,
]

export const tenantNodes: NodeBase[] = [
  toyotaDiscountRemove,
  toyotaThemeOverride,
  toyotaHeaderOverride,
]

export const orgNodes: (NodeBase | MetaNode)[] = [
  dealerXThemeOverride,
  dealerXNavOverride,
  cmpDealerNotes,
]

export interface ScopeEntry {
  level: CascadeLevel
  parentScopes: string[]
}

export const SCOPE_MAP: Record<string, ScopeEntry> = {
  platform: { level: "platform", parentScopes: [] },
  automotive: { level: "vertical", parentScopes: ["platform"] },
  toyota: { level: "tenant", parentScopes: ["platform", "automotive"] },
  "dealer-x": { level: "org", parentScopes: ["platform", "automotive", "toyota"] },
}
