// F-01 — pure scaffold builder for the POST /metadata/pages composite endpoint

import type {
  CascadeLevel,
  Audit,
  Binding,
} from "@/domain/types"
import type {
  PageNode,
  ViewNode,
  SectionNode,
  LayoutNode,
  ComponentNode,
  DataSourceNode,
  StateNode,
  ActionNode,
  EventNode,
  MetaNode,
  PageArchetype,
} from "@/domain/types"
import { toCamelCase, toKebabCase } from "@/shared/lib/utils"

export { toCamelCase, toKebabCase }

let _idCounter = 0

function makeId(logicalKey: string): string {
  return `uuid-scaffold-${logicalKey}-${++_idCounter}`
}

function nodeBase(logicalKey: string, cascadeLevel: CascadeLevel, audit: Audit) {
  return { id: makeId(logicalKey), logicalKey, cascadeLevel, objectVersion: 1, audit }
}

function dsBind(ref: string, path?: string): Binding {
  return { bind: { kind: "dataSource", ref, ...(path ? { path } : {}) } }
}

function stateBind(ref: string, path: string): Binding {
  return { bind: { kind: "state", ref, path } }
}

export function buildPageScaffold(
  slug: string,
  title: string,
  archetype: PageArchetype,
  entityRef: string | undefined,
  cascadeLevel: CascadeLevel,
  audit: Audit,
): MetaNode[] {
  const nodes: MetaNode[] = []

  function base(lk: string) {
    return nodeBase(lk, cascadeLevel, audit)
  }

  let dsKey: string | undefined
  if (entityRef) {
    dsKey = `ds.${slug}`
  }

  let pageViews: string[] = []
  let pageLayoutRef = `layout.${slug}`
  let pageState: string[] | undefined
  let pageActions: string[] | undefined

  // ── list-report ──────────────────────────────────────────────────────────────
  if (archetype === "list-report") {
    if (entityRef && dsKey) {
      const ds: DataSourceNode = {
        ...base(dsKey),
        kind: "dataSource",
        dataSourceType: "entity",
        targetRef: entityRef,
        writeCapability: false,
        sort: { field: "modifiedAt", direction: "desc" },
        paging: { pageSize: 25 },
      }
      nodes.push(ds)
    }

    const stateSelection: StateNode = {
      ...base(`state.${slug}Selection`),
      kind: "state",
      scope: "page",
      shape: { selectedIds: "string[]" },
      initialValue: { selectedIds: [] as string[] },
      persistence: "none",
    }
    nodes.push(stateSelection)

    const actionNew: ActionNode = {
      ...base(`action.${slug}New`),
      kind: "action",
      actionKind: "navigate",
      target: `/${toKebabCase(title)}/new`,
    }
    const actionExport: ActionNode = {
      ...base(`action.${slug}Export`),
      kind: "action",
      actionKind: "call-api",
      target: dsKey ?? "",
      inputs: { format: "csv" },
    }
    const actionRowOpen: ActionNode = {
      ...base(`action.${slug}RowOpen`),
      kind: "action",
      actionKind: "navigate",
      target: `/${toKebabCase(title)}/:id`,
    }
    nodes.push(actionNew, actionExport, actionRowOpen)

    const evtNewClick: EventNode = {
      ...base(`evt.${slug}NewClick`),
      kind: "event",
      trigger: "onClick",
      sourceRef: `cmp.${slug}NewButton`,
      actions: [`action.${slug}New`],
    }
    const evtExportClick: EventNode = {
      ...base(`evt.${slug}ExportClick`),
      kind: "event",
      trigger: "onClick",
      sourceRef: `cmp.${slug}ExportButton`,
      actions: [`action.${slug}Export`],
    }
    const evtRowClick: EventNode = {
      ...base(`evt.${slug}RowClick`),
      kind: "event",
      trigger: "onClick",
      sourceRef: `cmp.${slug}Grid`,
      actions: [`action.${slug}RowOpen`],
    }
    nodes.push(evtNewClick, evtExportClick, evtRowClick)

    const layoutMain: LayoutNode = {
      ...base(`layout.${slug}`),
      kind: "layout",
      layoutType: "stack",
      direction: "column",
      gap: "0px",
    }
    const layoutToolbar: LayoutNode = {
      ...base(`layout.${slug}Toolbar`),
      kind: "layout",
      layoutType: "flex",
      direction: "row",
      gap: "8px",
    }
    nodes.push(layoutMain, layoutToolbar)

    const cmpObjHeader: ComponentNode = {
      ...base(`cmp.${slug}ObjectHeader`),
      kind: "component",
      semanticType: "ObjectHeader",
      props: { title, subtitle: entityRef ?? "" },
    }
    const cmpSearch: ComponentNode = {
      ...base(`cmp.${slug}Search`),
      kind: "component",
      semanticType: "FormField",
      props: { label: "Search", fieldType: "search", placeholder: `Search ${title}…` },
    }
    const cmpNewButton: ComponentNode = {
      ...base(`cmp.${slug}NewButton`),
      kind: "component",
      semanticType: "Button",
      props: { label: "New", variant: "primary" },
      eventHandlers: [`evt.${slug}NewClick`],
    }
    const cmpExportButton: ComponentNode = {
      ...base(`cmp.${slug}ExportButton`),
      kind: "component",
      semanticType: "Button",
      props: { label: "Export", variant: "secondary" },
      eventHandlers: [`evt.${slug}ExportClick`],
    }
    const cmpGrid: ComponentNode = {
      ...base(`cmp.${slug}Grid`),
      kind: "component",
      semanticType: "DataTable",
      props: {
        editable: false,
        paginated: true,
        sortable: true,
        selectable: true,
        multiSelect: true,
        columnVisibility: true,
        exportable: true,
      },
      ...(dsKey ? { dataBindingRef: dsBind(dsKey) } : {}),
      eventHandlers: [`evt.${slug}RowClick`],
      stateBindings: [stateBind(`state.${slug}Selection`, "selectedIds")],
    }
    nodes.push(cmpObjHeader, cmpSearch, cmpNewButton, cmpExportButton, cmpGrid)

    const sectionToolbar: SectionNode = {
      ...base(`section.${slug}Toolbar`),
      kind: "section",
      label: "Toolbar",
      components: [
        `cmp.${slug}ObjectHeader`,
        `cmp.${slug}Search`,
        `cmp.${slug}NewButton`,
        `cmp.${slug}ExportButton`,
      ],
      layoutRef: `layout.${slug}Toolbar`,
    }
    const sectionList: SectionNode = {
      ...base(`section.${slug}List`),
      kind: "section",
      label: "List",
      components: [`cmp.${slug}Grid`],
    }
    nodes.push(sectionToolbar, sectionList)

    const view: ViewNode = {
      ...base(`view.${slug}`),
      kind: "view",
      sections: [`section.${slug}Toolbar`, `section.${slug}List`],
      layoutRef: `layout.${slug}`,
      ...(dsKey ? { dataSourceRef: dsKey } : {}),
    }
    nodes.push(view)

    pageViews = [`view.${slug}`]
    pageState = [`state.${slug}Selection`]
    pageActions = [`action.${slug}New`, `action.${slug}Export`]

  // ── transaction-entry ────────────────────────────────────────────────────────
  } else if (archetype === "transaction-entry") {
    if (entityRef && dsKey) {
      const dsHeader: DataSourceNode = {
        ...base(dsKey),
        kind: "dataSource",
        dataSourceType: "entity",
        targetRef: entityRef,
        writeCapability: true,
      }
      nodes.push(dsHeader)
    }

    const dsLinesKey = `ds.${slug}Lines`
    const dsLines: DataSourceNode = {
      ...base(dsLinesKey),
      kind: "dataSource",
      dataSourceType: "relationship",
      filter: { parentField: "id" },
      paging: { pageSize: 50 },
      writeCapability: true,
    }
    nodes.push(dsLines)

    const stateDraft: StateNode = {
      ...base(`state.${slug}Draft`),
      kind: "state",
      scope: "page",
      shape: { status: "string", isDirty: "boolean" },
      initialValue: { status: "draft", isDirty: false },
      persistence: "session",
    }
    nodes.push(stateDraft)

    const actionSubmit: ActionNode = {
      ...base(`action.${slug}Submit`),
      kind: "action",
      actionKind: "trigger-workflow-transition",
      target: "",
      inputs: { transition: "submit" },
      confirmation: { message: "Submit for approval?" },
    }
    const actionSaveDraft: ActionNode = {
      ...base(`action.${slug}SaveDraft`),
      kind: "action",
      actionKind: "mutate-entity",
      target: dsKey ?? "",
      inputs: { mode: "patch" },
    }
    const actionAddLine: ActionNode = {
      ...base(`action.${slug}AddLine`),
      kind: "action",
      actionKind: "mutate-entity",
      target: dsLinesKey,
      inputs: { mode: "create" },
    }
    const actionDeleteLine: ActionNode = {
      ...base(`action.${slug}DeleteLine`),
      kind: "action",
      actionKind: "mutate-entity",
      target: dsLinesKey,
      inputs: { mode: "delete" },
    }
    nodes.push(actionSubmit, actionSaveDraft, actionAddLine, actionDeleteLine)

    const evtSubmitClick: EventNode = {
      ...base(`evt.${slug}SubmitClick`),
      kind: "event",
      trigger: "onClick",
      sourceRef: `cmp.${slug}SubmitButton`,
      actions: [`action.${slug}Submit`],
    }
    const evtSaveClick: EventNode = {
      ...base(`evt.${slug}SaveClick`),
      kind: "event",
      trigger: "onClick",
      sourceRef: `cmp.${slug}SaveButton`,
      actions: [`action.${slug}SaveDraft`],
    }
    nodes.push(evtSubmitClick, evtSaveClick)

    const layoutHeader: LayoutNode = {
      ...base(`layout.${slug}Header`),
      kind: "layout",
      layoutType: "form-grid",
      gap: "12px",
    }
    const layoutLines: LayoutNode = {
      ...base(`layout.${slug}Lines`),
      kind: "layout",
      layoutType: "stack",
      direction: "column",
      gap: "8px",
    }
    nodes.push(layoutHeader, layoutLines)

    const cmpObjHeader: ComponentNode = {
      ...base(`cmp.${slug}ObjectHeader`),
      kind: "component",
      semanticType: "ObjectHeader",
      props: {
        title: dsKey ? dsBind(dsKey, "id") : title,
        subtitle: title,
      },
    }
    const cmpStatusChip: ComponentNode = {
      ...base(`cmp.${slug}StatusChip`),
      kind: "component",
      semanticType: "StatusChip",
      props: {
        label: stateBind(`state.${slug}Draft`, "status"),
        variant: "default",
      },
    }
    const cmpSaveButton: ComponentNode = {
      ...base(`cmp.${slug}SaveButton`),
      kind: "component",
      semanticType: "Button",
      props: { label: "Save Draft", variant: "secondary" },
      eventHandlers: [`evt.${slug}SaveClick`],
    }
    const cmpSubmitButton: ComponentNode = {
      ...base(`cmp.${slug}SubmitButton`),
      kind: "component",
      semanticType: "TransitionButton",
      props: { label: "Submit for Approval", transition: "submit" },
      eventHandlers: [`evt.${slug}SubmitClick`],
    }
    const cmpAddLineButton: ComponentNode = {
      ...base(`cmp.${slug}AddLineButton`),
      kind: "component",
      semanticType: "Button",
      props: { label: "Add Line", variant: "ghost" },
    }
    const cmpLinesGrid: ComponentNode = {
      ...base(`cmp.${slug}LinesGrid`),
      kind: "component",
      semanticType: "DataTable",
      props: { editable: true, paginated: true, selectable: true },
      dataBindingRef: dsBind(dsLinesKey),
    }
    nodes.push(cmpObjHeader, cmpStatusChip, cmpSaveButton, cmpSubmitButton, cmpAddLineButton, cmpLinesGrid)

    const sectionHeader: SectionNode = {
      ...base(`section.${slug}Header`),
      kind: "section",
      label: "Header",
      components: [`cmp.${slug}ObjectHeader`],
    }
    const sectionActions: SectionNode = {
      ...base(`section.${slug}Actions`),
      kind: "section",
      label: "Status & Actions",
      components: [
        `cmp.${slug}StatusChip`,
        `cmp.${slug}SaveButton`,
        `cmp.${slug}SubmitButton`,
      ],
    }
    const sectionLines: SectionNode = {
      ...base(`section.${slug}Lines`),
      kind: "section",
      label: "Lines",
      components: [`cmp.${slug}AddLineButton`, `cmp.${slug}LinesGrid`],
    }
    nodes.push(sectionHeader, sectionActions, sectionLines)

    const viewHeader: ViewNode = {
      ...base(`view.${slug}Header`),
      kind: "view",
      sections: [`section.${slug}Header`, `section.${slug}Actions`],
      layoutRef: `layout.${slug}Header`,
      ...(dsKey ? { dataSourceRef: dsKey } : {}),
    }
    const viewLines: ViewNode = {
      ...base(`view.${slug}Lines`),
      kind: "view",
      sections: [`section.${slug}Lines`],
      layoutRef: `layout.${slug}Lines`,
      dataSourceRef: dsLinesKey,
    }
    nodes.push(viewHeader, viewLines)

    pageViews = [`view.${slug}Header`, `view.${slug}Lines`]
    pageLayoutRef = `layout.${slug}Header`
    pageState = [`state.${slug}Draft`]
    pageActions = [`action.${slug}Submit`, `action.${slug}SaveDraft`]

  // ── object-detail ────────────────────────────────────────────────────────────
  } else if (archetype === "object-detail") {
    if (entityRef && dsKey) {
      const ds: DataSourceNode = {
        ...base(dsKey),
        kind: "dataSource",
        dataSourceType: "entity",
        targetRef: entityRef,
        writeCapability: true,
      }
      nodes.push(ds)
    }

    const layout: LayoutNode = {
      ...base(`layout.${slug}`),
      kind: "layout",
      layoutType: "stack",
      direction: "column",
      gap: "16px",
    }
    nodes.push(layout)

    const secHeader: SectionNode = {
      ...base(`section.${slug}Header`),
      kind: "section",
      label: "Header",
      components: [],
    }
    const secDetails: SectionNode = {
      ...base(`section.${slug}Details`),
      kind: "section",
      label: "Details",
      components: [],
    }
    const secMeta: SectionNode = {
      ...base(`section.${slug}Metadata`),
      kind: "section",
      label: "Metadata",
      components: [],
    }
    nodes.push(secHeader, secDetails, secMeta)

    const view: ViewNode = {
      ...base(`view.${slug}`),
      kind: "view",
      sections: [
        `section.${slug}Header`,
        `section.${slug}Details`,
        `section.${slug}Metadata`,
      ],
      layoutRef: `layout.${slug}`,
      ...(dsKey ? { dataSourceRef: dsKey } : {}),
    }
    nodes.push(view)

    pageViews = [`view.${slug}`]

  // ── dashboard ─────────────────────────────────────────────────────────────────
  } else if (archetype === "dashboard") {
    const layout: LayoutNode = {
      ...base(`layout.${slug}`),
      kind: "layout",
      layoutType: "grid",
      gap: "16px",
    }
    nodes.push(layout)

    const kpi1: ComponentNode = {
      ...base(`cmp.${slug}Kpi1`),
      kind: "component",
      semanticType: "KpiCard",
      props: { label: "KPI 1" },
    }
    const kpi2: ComponentNode = {
      ...base(`cmp.${slug}Kpi2`),
      kind: "component",
      semanticType: "KpiCard",
      props: { label: "KPI 2" },
    }
    const kpi3: ComponentNode = {
      ...base(`cmp.${slug}Kpi3`),
      kind: "component",
      semanticType: "KpiCard",
      props: { label: "KPI 3" },
    }
    nodes.push(kpi1, kpi2, kpi3)

    const section: SectionNode = {
      ...base(`section.${slug}Kpis`),
      kind: "section",
      label: "KPIs",
      components: [`cmp.${slug}Kpi1`, `cmp.${slug}Kpi2`, `cmp.${slug}Kpi3`],
    }
    nodes.push(section)

    const view: ViewNode = {
      ...base(`view.${slug}`),
      kind: "view",
      sections: [`section.${slug}Kpis`],
      layoutRef: `layout.${slug}`,
    }
    nodes.push(view)

    pageViews = [`view.${slug}`]

  // ── master-detail / workspace / wizard — minimal skeleton ──────────────────
  } else {
    if (entityRef && dsKey) {
      const ds: DataSourceNode = {
        ...base(dsKey),
        kind: "dataSource",
        dataSourceType: "entity",
        targetRef: entityRef,
        writeCapability: false,
      }
      nodes.push(ds)
    }

    const layout: LayoutNode = {
      ...base(`layout.${slug}`),
      kind: "layout",
      layoutType: "split",
      direction: "column",
    }
    const section: SectionNode = {
      ...base(`section.${slug}Main`),
      kind: "section",
      label: "Main",
      components: [],
    }
    const view: ViewNode = {
      ...base(`view.${slug}`),
      kind: "view",
      sections: [`section.${slug}Main`],
      layoutRef: `layout.${slug}`,
      ...(dsKey ? { dataSourceRef: dsKey } : {}),
    }
    nodes.push(layout, section, view)
    pageViews = [`view.${slug}`]
  }

  // PageNode always last
  const page: PageNode = {
    ...base(`page.${slug}`),
    kind: "page",
    archetype,
    title,
    route: `/${toKebabCase(title)}`,
    views: pageViews,
    layoutRef: pageLayoutRef,
    ...(dsKey ? { primaryDataSourceRef: dsKey } : {}),
    ...(pageState ? { pageState } : {}),
    ...(pageActions ? { pageActions } : {}),
  }
  nodes.push(page)

  return nodes
}
