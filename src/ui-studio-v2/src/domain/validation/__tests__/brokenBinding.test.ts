import { validateBrokenBindings } from "@/domain/validation/brokenBinding"
import type { MetaNode } from "@/domain/types/nodes"
import type { Binding } from "@/domain/types/base"
import {
  makeComponent,
  makePage,
  makeView,
  makeWorkflowBinding,
  makeBinding,
} from "@/domain/__tests__/fixtures"

function registryOf(...keys: string[]): ReadonlySet<string> {
  return new Set(keys)
}

describe("validateBrokenBindings", () => {
  it("returns empty issues when all bindings are valid", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.a",
      dataBindingRef: makeBinding("ds.test"),
    })
    const issues = validateBrokenBindings([cmp], registryOf("ds.test"))
    expect(issues).toHaveLength(0)
  })

  it("detects broken dataBindingRef on a component", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.a",
      dataBindingRef: makeBinding("ds.missing"),
    })
    const issues = validateBrokenBindings([cmp], registryOf())
    expect(issues).toHaveLength(1)
    expect(issues[0].type).toBe("broken-binding")
    expect(issues[0].nodeId).toBe("cmp.a")
    expect(issues[0].path).toBe("dataBindingRef")
  })

  it("detects broken stateBindings on a component", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.b",
      stateBindings: [makeBinding("state.missing", "state")],
    })
    const issues = validateBrokenBindings([cmp], registryOf())
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe("cmp.b")
    expect(issues[0].path).toBe("stateBindings[0]")
  })

  it("detects broken binding in component props", () => {
    const binding: Binding = { bind: { kind: "dataSource", ref: "ds.nope" } }
    const cmp = makeComponent({
      logicalKey: "cmp.c",
      props: { label: binding as never },
    })
    const issues = validateBrokenBindings([cmp], registryOf())
    expect(issues).toHaveLength(1)
    expect(issues[0].path).toBe("props.label")
  })

  it("collects multiple broken bindings across nodes", () => {
    const cmp1 = makeComponent({
      logicalKey: "cmp.a",
      dataBindingRef: makeBinding("ds.missing1"),
    })
    const cmp2 = makeComponent({
      logicalKey: "cmp.b",
      dataBindingRef: makeBinding("ds.missing2"),
    })
    const issues = validateBrokenBindings([cmp1, cmp2], registryOf())
    expect(issues).toHaveLength(2)
  })

  it("detects broken primaryDataSourceRef on a page", () => {
    const page = makePage({
      logicalKey: "page.a",
      primaryDataSourceRef: "ds.missing",
    })
    const issues = validateBrokenBindings([page], registryOf())
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe("page.a")
    expect(issues[0].path).toBe("primaryDataSourceRef")
  })

  it("passes when page primaryDataSourceRef exists", () => {
    const page = makePage({
      logicalKey: "page.a",
      primaryDataSourceRef: "ds.exists",
    })
    const issues = validateBrokenBindings([page], registryOf("ds.exists"))
    expect(issues).toHaveLength(0)
  })

  it("detects broken dataSourceRef on a view", () => {
    const view = makeView({
      logicalKey: "view.a",
      dataSourceRef: "ds.missing",
    })
    const issues = validateBrokenBindings([view], registryOf())
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe("view.a")
    expect(issues[0].path).toBe("dataSourceRef")
  })

  it("passes when view dataSourceRef exists", () => {
    const view = makeView({
      logicalKey: "view.a",
      dataSourceRef: "ds.exists",
    })
    const issues = validateBrokenBindings([view], registryOf("ds.exists"))
    expect(issues).toHaveLength(0)
  })

  it("detects broken workflowRef on a workflowBinding", () => {
    const wb = makeWorkflowBinding({
      logicalKey: "wb.a",
      workflowRef: "wf.missing",
    })
    const issues = validateBrokenBindings([wb], registryOf())
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe("wb.a")
    expect(issues[0].path).toBe("workflowRef")
  })

  it("passes when workflowRef exists", () => {
    const wb = makeWorkflowBinding({
      logicalKey: "wb.a",
      workflowRef: "wf.exists",
    })
    const issues = validateBrokenBindings([wb], registryOf("wf.exists"))
    expect(issues).toHaveLength(0)
  })

  it("ignores node kinds that have no binding checks", () => {
    const nodes: MetaNode[] = [
      {
        id: "ds-1",
        logicalKey: "ds.a",
        cascadeLevel: "platform",
        kind: "dataSource",
        dataSourceType: "entity",
        objectVersion: 1,
        audit: {
          createdBy: "test",
          createdAt: "2024-01-01T00:00:00Z",
          modifiedBy: "test",
          modifiedAt: "2024-01-01T00:00:00Z",
        },
      },
    ]
    const issues = validateBrokenBindings(nodes, registryOf())
    expect(issues).toHaveLength(0)
  })

  it("skips component with no bindings at all", () => {
    const cmp = makeComponent({ logicalKey: "cmp.clean" })
    const issues = validateBrokenBindings([cmp], registryOf())
    expect(issues).toHaveLength(0)
  })

  it("passes component props that are non-binding values", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.x",
      props: { label: "plain string", count: 42 as never },
    })
    const issues = validateBrokenBindings([cmp], registryOf())
    expect(issues).toHaveLength(0)
  })

  it("skips page without primaryDataSourceRef", () => {
    const page = makePage({ logicalKey: "page.simple" })
    delete (page as Record<string, unknown>).primaryDataSourceRef
    const issues = validateBrokenBindings([page], registryOf())
    expect(issues).toHaveLength(0)
  })

  it("skips view without dataSourceRef", () => {
    const view = makeView({ logicalKey: "view.simple" })
    delete (view as Record<string, unknown>).dataSourceRef
    const issues = validateBrokenBindings([view], registryOf())
    expect(issues).toHaveLength(0)
  })
})
