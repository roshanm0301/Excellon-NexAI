// Phase 5 T8.1.1 — unit tests for buildRenderTree
import { describe, it, expect } from "vitest"
import { buildRenderTree } from "@/runtime-preview/buildRenderTree"
import type { ResolvedNode } from "@/services/interfaces"

function makeNode(
  logicalKey: string,
  kind: ResolvedNode["kind"],
  data: Record<string, unknown> = {},
): ResolvedNode {
  return {
    logicalKey,
    kind,
    cascadeLevel: "vertical",
    originState: "own",
    data: { logicalKey, kind, ...data },
  }
}

describe("buildRenderTree", () => {
  it("builds a tree from page → view → section → component", () => {
    const nodes: ResolvedNode[] = [
      makeNode("page.test", "page", {
        views: ["view.header"],
        layoutRef: "layout.page",
      }),
      makeNode("view.header", "view", {
        sections: ["section.info"],
        layoutRef: "layout.header",
      }),
      makeNode("section.info", "section", {
        components: ["cmp.name"],
      }),
      makeNode("cmp.name", "component", {
        semanticType: "FormField",
        props: { label: "Name" },
      }),
      makeNode("layout.page", "layout", {
        layoutType: "stack",
        direction: "column",
        gap: "8px",
      }),
      makeNode("layout.header", "layout", {
        layoutType: "form-grid",
        gap: "12px",
      }),
    ]

    const tree = buildRenderTree(nodes)

    expect(tree).toHaveLength(1)
    expect(tree[0].node.logicalKey).toBe("page.test")
    expect(tree[0].layoutProps?.layoutType).toBe("stack")
    expect(tree[0].children).toHaveLength(1)

    const view = tree[0].children[0]
    expect(view.node.logicalKey).toBe("view.header")
    expect(view.layoutProps?.layoutType).toBe("form-grid")
    expect(view.children).toHaveLength(1)

    const section = view.children[0]
    expect(section.node.logicalKey).toBe("section.info")
    expect(section.children).toHaveLength(1)

    const component = section.children[0]
    expect(component.node.logicalKey).toBe("cmp.name")
    expect(component.children).toHaveLength(0)
  })

  it("handles missing refs gracefully (no crash)", () => {
    const nodes: ResolvedNode[] = [
      makeNode("page.test", "page", {
        views: ["view.missing", "view.existing"],
      }),
      makeNode("view.existing", "view", {
        sections: ["section.gone"],
      }),
    ]

    const tree = buildRenderTree(nodes)

    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].node.logicalKey).toBe("view.existing")
    expect(tree[0].children[0].children).toHaveLength(0)
  })

  it("filters out non-visual nodes", () => {
    const nodes: ResolvedNode[] = [
      makeNode("page.test", "page", {
        views: ["ds.source", "view.main"],
      }),
      makeNode("ds.source", "dataSource", {
        dataSourceType: "entity",
      }),
      makeNode("view.main", "view", { sections: [] }),
    ]

    const tree = buildRenderTree(nodes)

    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].node.logicalKey).toBe("view.main")
  })

  it("returns empty array when no pages exist", () => {
    const nodes: ResolvedNode[] = [
      makeNode("view.orphan", "view", { sections: [] }),
    ]

    const tree = buildRenderTree(nodes)
    expect(tree).toHaveLength(0)
  })

  it("handles multiple pages", () => {
    const nodes: ResolvedNode[] = [
      makeNode("page.a", "page", { views: [] }),
      makeNode("page.b", "page", { views: [] }),
    ]

    const tree = buildRenderTree(nodes)
    expect(tree).toHaveLength(2)
  })

  it("resolves layout props from referenced layout node", () => {
    const nodes: ResolvedNode[] = [
      makeNode("page.test", "page", {
        views: [],
        layoutRef: "layout.custom",
      }),
      makeNode("layout.custom", "layout", {
        layoutType: "grid",
        gap: "24px",
        padding: "16px",
      }),
    ]

    const tree = buildRenderTree(nodes)
    expect(tree[0].layoutProps).toEqual({
      layoutType: "grid",
      direction: undefined,
      gap: "24px",
      padding: "16px",
    })
  })

  it("has no layoutProps when layoutRef is missing", () => {
    const nodes: ResolvedNode[] = [
      makeNode("page.test", "page", { views: [] }),
    ]

    const tree = buildRenderTree(nodes)
    expect(tree[0].layoutProps).toBeUndefined()
  })
})
