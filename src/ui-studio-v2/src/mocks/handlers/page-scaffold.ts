// F-01 — pure scaffold builder for the POST /metadata/pages composite endpoint

import type { CascadeLevel, Audit } from "@/domain/types"
import type {
  PageNode,
  ViewNode,
  SectionNode,
  LayoutNode,
  ComponentNode,
  DataSourceNode,
  MetaNode,
  PageArchetype,
} from "@/domain/types"
import { toCamelCase, toKebabCase } from "@/shared/lib/utils"

export { toCamelCase, toKebabCase }

let _idCounter = 0

function makeId(logicalKey: string): string {
  return `uuid-scaffold-${logicalKey}-${++_idCounter}`
}

function nodeBase(
  logicalKey: string,
  cascadeLevel: CascadeLevel,
  audit: Audit,
) {
  return { id: makeId(logicalKey), logicalKey, cascadeLevel, objectVersion: 1, audit }
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

  // DataSource — created first when an entity is provided
  let dsKey: string | undefined
  if (entityRef) {
    dsKey = `ds.${slug}`
    const ds: DataSourceNode = {
      ...base(dsKey),
      kind: "dataSource",
      dataSourceType: "entity",
      targetRef: entityRef,
      writeCapability: true,
    }
    nodes.push(ds)
  }

  let pageViews: string[] = []
  let pageLayoutRef = `layout.${slug}`

  if (archetype === "list-report") {
    const layout: LayoutNode = {
      ...base(`layout.${slug}`),
      kind: "layout",
      layoutType: "stack",
      direction: "column",
      gap: "16px",
    }

    const cmpGrid: ComponentNode = {
      ...base(`cmp.${slug}Grid`),
      kind: "component",
      semanticType: "DataTable",
      props: { editable: false, paginated: true, selectable: true },
      ...(dsKey
        ? { dataBindingRef: { bind: { kind: "dataSource", ref: dsKey, path: undefined } } }
        : {}),
    }

    const section: SectionNode = {
      ...base(`section.${slug}List`),
      kind: "section",
      label: title,
      components: [`cmp.${slug}Grid`],
    }

    const view: ViewNode = {
      ...base(`view.${slug}`),
      kind: "view",
      sections: [`section.${slug}List`],
      layoutRef: `layout.${slug}`,
      ...(dsKey ? { dataSourceRef: dsKey } : {}),
    }

    nodes.push(layout, cmpGrid, section, view)
    pageViews = [`view.${slug}`]
  } else if (archetype === "transaction-entry") {
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

    const cmpObjHeader: ComponentNode = {
      ...base(`cmp.${slug}ObjectHeader`),
      kind: "component",
      semanticType: "ObjectHeader",
      props: { title, subtitle: title },
    }

    const sectionInfo: SectionNode = {
      ...base(`section.${slug}Info`),
      kind: "section",
      label: "Information",
      components: [`cmp.${slug}ObjectHeader`],
    }

    const viewHeader: ViewNode = {
      ...base(`view.${slug}Header`),
      kind: "view",
      sections: [`section.${slug}Info`],
      layoutRef: `layout.${slug}Header`,
      ...(dsKey ? { dataSourceRef: dsKey } : {}),
    }

    const cmpLines: ComponentNode = {
      ...base(`cmp.${slug}LinesGrid`),
      kind: "component",
      semanticType: "DataTable",
      props: { editable: true, paginated: true },
    }

    const sectionLines: SectionNode = {
      ...base(`section.${slug}Lines`),
      kind: "section",
      label: "Lines",
      components: [`cmp.${slug}LinesGrid`],
    }

    const viewLines: ViewNode = {
      ...base(`view.${slug}Lines`),
      kind: "view",
      sections: [`section.${slug}Lines`],
      layoutRef: `layout.${slug}Lines`,
    }

    nodes.push(layoutHeader, layoutLines, cmpObjHeader, sectionInfo, viewHeader, cmpLines, sectionLines, viewLines)
    pageViews = [`view.${slug}Header`, `view.${slug}Lines`]
    pageLayoutRef = `layout.${slug}Header`
  } else if (archetype === "object-detail") {
    const layout: LayoutNode = {
      ...base(`layout.${slug}`),
      kind: "layout",
      layoutType: "stack",
      direction: "column",
      gap: "16px",
    }

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

    nodes.push(layout, secHeader, secDetails, secMeta, view)
    pageViews = [`view.${slug}`]
  } else if (archetype === "dashboard") {
    const layout: LayoutNode = {
      ...base(`layout.${slug}`),
      kind: "layout",
      layoutType: "grid",
      gap: "16px",
    }

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

    const section: SectionNode = {
      ...base(`section.${slug}Kpis`),
      kind: "section",
      label: "KPIs",
      components: [`cmp.${slug}Kpi1`, `cmp.${slug}Kpi2`, `cmp.${slug}Kpi3`],
    }

    const view: ViewNode = {
      ...base(`view.${slug}`),
      kind: "view",
      sections: [`section.${slug}Kpis`],
      layoutRef: `layout.${slug}`,
    }

    nodes.push(layout, kpi1, kpi2, kpi3, section, view)
    pageViews = [`view.${slug}`]
  } else {
    // master-detail, workspace, wizard — minimal skeleton
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
    }

    nodes.push(layout, section, view)
    pageViews = [`view.${slug}`]
  }

  // PageNode always last — the composite endpoint returns it
  const page: PageNode = {
    ...base(`page.${slug}`),
    kind: "page",
    archetype,
    title,
    route: `/${toKebabCase(title)}`,
    views: pageViews,
    layoutRef: pageLayoutRef,
    ...(dsKey ? { primaryDataSourceRef: dsKey } : {}),
  }
  nodes.push(page)

  return nodes
}
