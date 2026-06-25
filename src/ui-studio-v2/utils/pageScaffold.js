import { toCamelCase, toKebabCase } from "./stringUtils.js"

let _idCounter = 0

function makeId(logicalKey) {
  return `uuid-scaffold-${logicalKey}-${++_idCounter}-${Date.now()}`
}

function nodeBase(logicalKey, cascadeLevel, audit) {
  return { id: makeId(logicalKey), logicalKey, cascadeLevel, objectVersion: 1, audit }
}

function dsBind(ref, path) {
  return { bind: { kind: "dataSource", ref, ...(path ? { path } : {}) } }
}

function stateBind(ref, path) {
  return { bind: { kind: "state", ref, path } }
}

export function buildPageScaffold(slug, title, archetype, entityRef, cascadeLevel, audit) {
  const nodes = []

  function base(lk) {
    return nodeBase(lk, cascadeLevel, audit)
  }

  const dsKey = entityRef ? `ds.${slug}` : undefined

  let pageViews = []
  let pageLayoutRef = `layout.${slug}`
  let pageState
  let pageActions

  if (archetype === "list-report") {
    if (entityRef && dsKey) {
      nodes.push({
        ...base(dsKey),
        kind: "dataSource",
        dataSourceType: "entity",
        targetRef: entityRef,
        writeCapability: false,
        sort: { field: "modifiedAt", direction: "desc" },
        paging: { pageSize: 25 },
      })
    }

    nodes.push({
      ...base(`state.${slug}Selection`),
      kind: "state",
      scope: "page",
      shape: { selectedIds: "string[]" },
      initialValue: { selectedIds: [] },
      persistence: "none",
    })

    nodes.push(
      { ...base(`action.${slug}New`), kind: "action", actionKind: "navigate", target: `/${toKebabCase(title)}/new` },
      { ...base(`action.${slug}Export`), kind: "action", actionKind: "call-api", target: dsKey ?? "", inputs: { format: "csv" } },
      { ...base(`action.${slug}RowOpen`), kind: "action", actionKind: "navigate", target: `/${toKebabCase(title)}/:id` },
    )

    nodes.push(
      { ...base(`evt.${slug}NewClick`), kind: "event", trigger: "onClick", sourceRef: `cmp.${slug}NewButton`, actions: [`action.${slug}New`] },
      { ...base(`evt.${slug}ExportClick`), kind: "event", trigger: "onClick", sourceRef: `cmp.${slug}ExportButton`, actions: [`action.${slug}Export`] },
      { ...base(`evt.${slug}RowClick`), kind: "event", trigger: "onClick", sourceRef: `cmp.${slug}Grid`, actions: [`action.${slug}RowOpen`] },
    )

    nodes.push(
      { ...base(`layout.${slug}`), kind: "layout", layoutType: "stack", direction: "column", gap: "0px" },
      { ...base(`layout.${slug}Toolbar`), kind: "layout", layoutType: "flex", direction: "row", gap: "8px" },
    )

    nodes.push(
      { ...base(`cmp.${slug}ObjectHeader`), kind: "component", semanticType: "ObjectHeader", props: { title, subtitle: entityRef ?? "" } },
      { ...base(`cmp.${slug}Search`), kind: "component", semanticType: "FormField", props: { label: "Search", fieldType: "search", placeholder: `Search ${title}…` } },
      { ...base(`cmp.${slug}NewButton`), kind: "component", semanticType: "Button", props: { label: "New", variant: "primary" }, eventHandlers: [`evt.${slug}NewClick`] },
      { ...base(`cmp.${slug}ExportButton`), kind: "component", semanticType: "Button", props: { label: "Export", variant: "secondary" }, eventHandlers: [`evt.${slug}ExportClick`] },
      {
        ...base(`cmp.${slug}Grid`),
        kind: "component",
        semanticType: "DataTable",
        props: { editable: false, paginated: true, sortable: true, selectable: true, multiSelect: true, columnVisibility: true, exportable: true },
        ...(dsKey ? { dataBindingRef: dsBind(dsKey) } : {}),
        eventHandlers: [`evt.${slug}RowClick`],
        stateBindings: [stateBind(`state.${slug}Selection`, "selectedIds")],
      },
    )

    nodes.push(
      { ...base(`section.${slug}Toolbar`), kind: "section", label: "Toolbar", components: [`cmp.${slug}ObjectHeader`, `cmp.${slug}Search`, `cmp.${slug}NewButton`, `cmp.${slug}ExportButton`], layoutRef: `layout.${slug}Toolbar` },
      { ...base(`section.${slug}List`), kind: "section", label: "List", components: [`cmp.${slug}Grid`] },
    )

    nodes.push({
      ...base(`view.${slug}`),
      kind: "view",
      sections: [`section.${slug}Toolbar`, `section.${slug}List`],
      layoutRef: `layout.${slug}`,
      ...(dsKey ? { dataSourceRef: dsKey } : {}),
    })

    pageViews = [`view.${slug}`]
    pageState = [`state.${slug}Selection`]
    pageActions = [`action.${slug}New`, `action.${slug}Export`]

  } else if (archetype === "transaction-entry") {
    if (entityRef && dsKey) {
      nodes.push({ ...base(dsKey), kind: "dataSource", dataSourceType: "entity", targetRef: entityRef, writeCapability: true })
    }

    const dsLinesKey = `ds.${slug}Lines`
    nodes.push({ ...base(dsLinesKey), kind: "dataSource", dataSourceType: "relationship", filter: { parentField: "id" }, paging: { pageSize: 50 }, writeCapability: true })
    nodes.push({ ...base(`state.${slug}Draft`), kind: "state", scope: "page", shape: { status: "string", isDirty: "boolean" }, initialValue: { status: "draft", isDirty: false }, persistence: "session" })

    nodes.push(
      { ...base(`action.${slug}Submit`), kind: "action", actionKind: "trigger-workflow-transition", target: "", inputs: { transition: "submit" }, confirmation: { message: "Submit for approval?" } },
      { ...base(`action.${slug}SaveDraft`), kind: "action", actionKind: "mutate-entity", target: dsKey ?? "", inputs: { mode: "patch" } },
      { ...base(`action.${slug}AddLine`), kind: "action", actionKind: "mutate-entity", target: dsLinesKey, inputs: { mode: "create" } },
      { ...base(`action.${slug}DeleteLine`), kind: "action", actionKind: "mutate-entity", target: dsLinesKey, inputs: { mode: "delete" } },
    )

    nodes.push(
      { ...base(`evt.${slug}SubmitClick`), kind: "event", trigger: "onClick", sourceRef: `cmp.${slug}SubmitButton`, actions: [`action.${slug}Submit`] },
      { ...base(`evt.${slug}SaveClick`), kind: "event", trigger: "onClick", sourceRef: `cmp.${slug}SaveButton`, actions: [`action.${slug}SaveDraft`] },
    )

    nodes.push(
      { ...base(`layout.${slug}Header`), kind: "layout", layoutType: "form-grid", gap: "12px" },
      { ...base(`layout.${slug}Lines`), kind: "layout", layoutType: "stack", direction: "column", gap: "8px" },
    )

    nodes.push(
      { ...base(`cmp.${slug}ObjectHeader`), kind: "component", semanticType: "ObjectHeader", props: { title: dsKey ? dsBind(dsKey, "id") : title, subtitle: title } },
      { ...base(`cmp.${slug}StatusChip`), kind: "component", semanticType: "StatusChip", props: { label: stateBind(`state.${slug}Draft`, "status"), variant: "default" } },
      { ...base(`cmp.${slug}SaveButton`), kind: "component", semanticType: "Button", props: { label: "Save Draft", variant: "secondary" }, eventHandlers: [`evt.${slug}SaveClick`] },
      { ...base(`cmp.${slug}SubmitButton`), kind: "component", semanticType: "TransitionButton", props: { label: "Submit for Approval", transition: "submit" }, eventHandlers: [`evt.${slug}SubmitClick`] },
      { ...base(`cmp.${slug}AddLineButton`), kind: "component", semanticType: "Button", props: { label: "Add Line", variant: "ghost" } },
      { ...base(`cmp.${slug}LinesGrid`), kind: "component", semanticType: "DataTable", props: { editable: true, paginated: true, selectable: true }, dataBindingRef: dsBind(dsLinesKey) },
    )

    nodes.push(
      { ...base(`section.${slug}Header`), kind: "section", label: "Header", components: [`cmp.${slug}ObjectHeader`] },
      { ...base(`section.${slug}Actions`), kind: "section", label: "Status & Actions", components: [`cmp.${slug}StatusChip`, `cmp.${slug}SaveButton`, `cmp.${slug}SubmitButton`] },
      { ...base(`section.${slug}Lines`), kind: "section", label: "Lines", components: [`cmp.${slug}AddLineButton`, `cmp.${slug}LinesGrid`] },
    )

    nodes.push(
      { ...base(`view.${slug}Header`), kind: "view", sections: [`section.${slug}Header`, `section.${slug}Actions`], layoutRef: `layout.${slug}Header`, ...(dsKey ? { dataSourceRef: dsKey } : {}) },
      { ...base(`view.${slug}Lines`), kind: "view", sections: [`section.${slug}Lines`], layoutRef: `layout.${slug}Lines`, dataSourceRef: dsLinesKey },
    )

    pageViews = [`view.${slug}Header`, `view.${slug}Lines`]
    pageLayoutRef = `layout.${slug}Header`
    pageState = [`state.${slug}Draft`]
    pageActions = [`action.${slug}Submit`, `action.${slug}SaveDraft`]

  } else if (archetype === "object-detail") {
    if (entityRef && dsKey) {
      nodes.push({ ...base(dsKey), kind: "dataSource", dataSourceType: "entity", targetRef: entityRef, writeCapability: true })
    }

    nodes.push({ ...base(`layout.${slug}`), kind: "layout", layoutType: "stack", direction: "column", gap: "16px" })
    nodes.push(
      { ...base(`section.${slug}Header`), kind: "section", label: "Header", components: [] },
      { ...base(`section.${slug}Details`), kind: "section", label: "Details", components: [] },
      { ...base(`section.${slug}Metadata`), kind: "section", label: "Metadata", components: [] },
    )
    nodes.push({ ...base(`view.${slug}`), kind: "view", sections: [`section.${slug}Header`, `section.${slug}Details`, `section.${slug}Metadata`], layoutRef: `layout.${slug}`, ...(dsKey ? { dataSourceRef: dsKey } : {}) })
    pageViews = [`view.${slug}`]

  } else if (archetype === "dashboard") {
    nodes.push({ ...base(`layout.${slug}`), kind: "layout", layoutType: "grid", gap: "16px" })
    nodes.push(
      { ...base(`cmp.${slug}Kpi1`), kind: "component", semanticType: "KpiCard", props: { label: "KPI 1" } },
      { ...base(`cmp.${slug}Kpi2`), kind: "component", semanticType: "KpiCard", props: { label: "KPI 2" } },
      { ...base(`cmp.${slug}Kpi3`), kind: "component", semanticType: "KpiCard", props: { label: "KPI 3" } },
    )
    nodes.push({ ...base(`section.${slug}Kpis`), kind: "section", label: "KPIs", components: [`cmp.${slug}Kpi1`, `cmp.${slug}Kpi2`, `cmp.${slug}Kpi3`] })
    nodes.push({ ...base(`view.${slug}`), kind: "view", sections: [`section.${slug}Kpis`], layoutRef: `layout.${slug}` })
    pageViews = [`view.${slug}`]

  } else {
    if (entityRef && dsKey) {
      nodes.push({ ...base(dsKey), kind: "dataSource", dataSourceType: "entity", targetRef: entityRef, writeCapability: false })
    }
    nodes.push({ ...base(`layout.${slug}`), kind: "layout", layoutType: "split", direction: "column" })
    nodes.push({ ...base(`section.${slug}Main`), kind: "section", label: "Main", components: [] })
    nodes.push({ ...base(`view.${slug}`), kind: "view", sections: [`section.${slug}Main`], layoutRef: `layout.${slug}`, ...(dsKey ? { dataSourceRef: dsKey } : {}) })
    pageViews = [`view.${slug}`]
  }

  nodes.push({
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
  })

  return nodes
}
