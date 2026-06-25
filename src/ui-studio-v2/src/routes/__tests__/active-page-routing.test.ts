// P0-01 — findFirstPageNode helper
import { describe, it, expect } from "vitest"
import { findFirstPageNode } from "@/routes/route-utils"
import type { TreeNode } from "@/services/interfaces"

function makeNode(
  logicalKey: string,
  kind: TreeNode["kind"],
  children: TreeNode[] = [],
): TreeNode {
  return {
    id: `id-${logicalKey}`,
    logicalKey,
    kind,
    label: logicalKey,
    cascadeLevel: "vertical",
    originState: "own",
    parentKey: null,
    children,
  }
}

describe("findFirstPageNode", () => {
  it("returns null for empty tree", () => {
    expect(findFirstPageNode([])).toBeNull()
  })

  it("returns null when no page nodes exist", () => {
    const nodes = [makeNode("app.dms", "application"), makeNode("mod.sales", "module")]
    expect(findFirstPageNode(nodes)).toBeNull()
  })

  it("returns the first page node at root level", () => {
    const nodes = [
      makeNode("app.dms", "application"),
      makeNode("page.salesOrder", "page"),
      makeNode("page.orderList", "page"),
    ]
    expect(findFirstPageNode(nodes)?.logicalKey).toBe("page.salesOrder")
  })

  it("finds a page node nested under a module", () => {
    const pageNode = makeNode("page.salesOrder", "page")
    const nodes = [
      makeNode("app.dms", "application", [
        makeNode("mod.sales", "module", [pageNode]),
      ]),
    ]
    expect(findFirstPageNode(nodes)?.logicalKey).toBe("page.salesOrder")
  })

  it("returns null when tree has application and module but no pages", () => {
    const nodes = [
      makeNode("app.dms", "application", [makeNode("mod.sales", "module")]),
    ]
    expect(findFirstPageNode(nodes)).toBeNull()
  })

  it("returns first page in DFS order (not second)", () => {
    const nodes = [
      makeNode("page.first", "page"),
      makeNode("page.second", "page"),
    ]
    expect(findFirstPageNode(nodes)?.logicalKey).toBe("page.first")
  })
})
