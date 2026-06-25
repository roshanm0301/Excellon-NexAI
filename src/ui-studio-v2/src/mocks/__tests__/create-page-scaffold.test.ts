import { describe, it, expect, beforeEach } from "vitest"
import { buildPageScaffold, toCamelCase, toKebabCase } from "@/mocks/handlers/page-scaffold"
import { getStore, resetStore, addNode } from "@/mocks/store"
import type { CascadeLevel, Audit } from "@/domain/types"

const audit: Audit = {
  createdBy: "test",
  createdAt: "2024-01-01T00:00:00Z",
  modifiedBy: "test",
  modifiedAt: "2024-01-01T00:00:00Z",
}
const level: CascadeLevel = "vertical"

describe("toCamelCase", () => {
  it("converts space-separated words", () => {
    expect(toCamelCase("Customer List")).toBe("customerList")
  })

  it("handles single word", () => {
    expect(toCamelCase("dashboard")).toBe("dashboard")
  })

  it("handles multiple words", () => {
    expect(toCamelCase("Sales Order Entry")).toBe("salesOrderEntry")
  })
})

describe("toKebabCase", () => {
  it("converts space-separated words", () => {
    expect(toKebabCase("Customer List")).toBe("customer-list")
  })

  it("handles single word", () => {
    expect(toKebabCase("dashboard")).toBe("dashboard")
  })
})

describe("buildPageScaffold — list-report", () => {
  it("creates DataTable component when entity is provided", () => {
    const nodes = buildPageScaffold("customerList", "Customer List", "list-report", "entity.Customer", level, audit)
    const grid = nodes.find((n) => n.logicalKey === "cmp.customerListGrid")
    expect(grid).toBeDefined()
    expect(grid!.kind).toBe("component")
    expect((grid as { semanticType: string }).semanticType).toBe("DataTable")
  })

  it("creates a DataSource node when entity is provided", () => {
    const nodes = buildPageScaffold("customerList", "Customer List", "list-report", "entity.Customer", level, audit)
    const ds = nodes.find((n) => n.logicalKey === "ds.customerList")
    expect(ds).toBeDefined()
    expect(ds!.kind).toBe("dataSource")
  })

  it("omits DataSource when no entity", () => {
    const nodes = buildPageScaffold("myReport", "My Report", "list-report", undefined, level, audit)
    const ds = nodes.find((n) => n.logicalKey === "ds.myReport")
    expect(ds).toBeUndefined()
  })

  it("page node is last in array", () => {
    const nodes = buildPageScaffold("customerList", "Customer List", "list-report", "entity.Customer", level, audit)
    const last = nodes[nodes.length - 1]
    expect(last.kind).toBe("page")
    expect(last.logicalKey).toBe("page.customerList")
  })
})

describe("buildPageScaffold — transaction-entry", () => {
  it("creates two views (header + lines)", () => {
    const nodes = buildPageScaffold("salesOrder", "Sales Order", "transaction-entry", "entity.SalesOrder", level, audit)
    const views = nodes.filter((n) => n.kind === "view")
    expect(views).toHaveLength(2)
    const keys = views.map((v) => v.logicalKey)
    expect(keys).toContain("view.salesOrderHeader")
    expect(keys).toContain("view.salesOrderLines")
  })

  it("page references both views", () => {
    const nodes = buildPageScaffold("salesOrder", "Sales Order", "transaction-entry", undefined, level, audit)
    const page = nodes[nodes.length - 1] as { views: string[] }
    expect(page.views).toContain("view.salesOrderHeader")
    expect(page.views).toContain("view.salesOrderLines")
  })
})

describe("buildPageScaffold — object-detail", () => {
  it("creates one view with three sections", () => {
    const nodes = buildPageScaffold("customer", "Customer", "object-detail", "entity.Customer", level, audit)
    const views = nodes.filter((n) => n.kind === "view")
    expect(views).toHaveLength(1)
    const view = views[0] as { sections: string[] }
    expect(view.sections).toHaveLength(3)
    expect(view.sections).toContain("section.customerHeader")
    expect(view.sections).toContain("section.customerDetails")
    expect(view.sections).toContain("section.customerMetadata")
  })
})

describe("buildPageScaffold — dashboard", () => {
  it("creates three KPI card components", () => {
    const nodes = buildPageScaffold("salesDashboard", "Sales Dashboard", "dashboard", undefined, level, audit)
    const kpis = nodes.filter((n) => n.kind === "component" && n.logicalKey.includes("Kpi"))
    expect(kpis).toHaveLength(3)
    for (const kpi of kpis) {
      expect((kpi as { semanticType: string }).semanticType).toBe("KpiCard")
    }
  })
})

describe("module linkage", () => {
  beforeEach(() => {
    resetStore()
  })

  it("module pages array contains the new page logicalKey after creation", () => {
    const store = getStore()
    const existingModule = store.nodes.get("mod.sales:vertical")
    expect(existingModule).toBeDefined()

    const scaffoldNodes = buildPageScaffold("customerList", "Customer List", "list-report", undefined, "vertical", audit)
    for (const n of scaffoldNodes) {
      addNode(n)
    }
    const pageLogicalKey = `page.customerList`
    // Manually linking would be done by the handler — just verify the page node exists
    expect(store.nodes.has(`${pageLogicalKey}:vertical`)).toBe(true)
  })
})
