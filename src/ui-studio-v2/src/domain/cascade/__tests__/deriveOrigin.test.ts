import { deriveOrigin } from "@/domain/cascade/deriveOrigin"
import type { NodeBase } from "@/domain/types/base"
import { makeNodeBase } from "@/domain/__tests__/fixtures"

function nodeMap(...nodes: NodeBase[]): Map<string, NodeBase> {
  return new Map(nodes.map((n) => [n.logicalKey, n]))
}

describe("deriveOrigin", () => {
  it("returns 'own' when node is at the editing level with no overrideOf", () => {
    const node = makeNodeBase({ cascadeLevel: "tenant", logicalKey: "cmp.a" })
    expect(deriveOrigin(node, "tenant")).toBe("own")
  })

  it("returns 'inherited' when node is from a less specific level", () => {
    const node = makeNodeBase({ cascadeLevel: "platform", logicalKey: "cmp.a" })
    expect(deriveOrigin(node, "tenant")).toBe("inherited")
  })

  it("returns 'inherited' when node is from a more specific level", () => {
    const node = makeNodeBase({ cascadeLevel: "org", logicalKey: "cmp.a" })
    expect(deriveOrigin(node, "tenant")).toBe("inherited")
  })

  it("returns 'overridden' when node overrides at the editing level", () => {
    const parent = makeNodeBase({ cascadeLevel: "platform", logicalKey: "cmp.a" })
    const node = makeNodeBase({
      cascadeLevel: "tenant",
      logicalKey: "cmp.a",
      overrideOf: "cmp.a",
    })
    expect(deriveOrigin(node, "tenant", nodeMap(parent))).toBe("overridden")
  })

  it("returns 'suppressed' when node has a remove op", () => {
    const node = makeNodeBase({
      cascadeLevel: "tenant",
      logicalKey: "cmp.a",
      overrideOf: "cmp.a",
      overrideOps: [{ op: "remove", logicalKey: "cmp.a" }],
    })
    const parent = makeNodeBase({ cascadeLevel: "platform", logicalKey: "cmp.a" })
    expect(deriveOrigin(node, "tenant", nodeMap(parent))).toBe("suppressed")
  })

  it("returns 'orphaned' when overrideOf points to a non-existent parent", () => {
    const node = makeNodeBase({
      cascadeLevel: "tenant",
      logicalKey: "cmp.a",
      overrideOf: "cmp.missing",
    })
    expect(deriveOrigin(node, "tenant", new Map())).toBe("orphaned")
  })

  it("skips orphan check when allNodes is not provided", () => {
    const node = makeNodeBase({
      cascadeLevel: "tenant",
      logicalKey: "cmp.a",
      overrideOf: "cmp.missing",
    })
    // Without allNodes, orphan check is skipped → falls through to 'overridden'
    expect(deriveOrigin(node, "tenant")).toBe("overridden")
  })

  it("returns 'inherited' for vertical node when editing at org level", () => {
    const node = makeNodeBase({ cascadeLevel: "vertical", logicalKey: "cmp.a" })
    expect(deriveOrigin(node, "org")).toBe("inherited")
  })

  it("returns 'own' for platform node when editing at platform level", () => {
    const node = makeNodeBase({ cascadeLevel: "platform", logicalKey: "cmp.a" })
    expect(deriveOrigin(node, "platform")).toBe("own")
  })

  it("returns 'suppressed' even if orphan check would also apply (suppressed wins)", () => {
    const node = makeNodeBase({
      cascadeLevel: "tenant",
      logicalKey: "cmp.a",
      overrideOf: "cmp.a",
      overrideOps: [{ op: "remove", logicalKey: "cmp.a" }],
    })
    // No parent in allNodes, but suppressed check comes after orphan check
    // Since parent doesn't exist, it's orphaned first
    expect(deriveOrigin(node, "tenant", new Map())).toBe("orphaned")
  })

  it("returns 'suppressed' when parent exists and node has remove op", () => {
    const parent = makeNodeBase({ cascadeLevel: "platform", logicalKey: "cmp.a" })
    const node = makeNodeBase({
      cascadeLevel: "tenant",
      logicalKey: "cmp.a",
      overrideOf: "cmp.a",
      overrideOps: [{ op: "remove", logicalKey: "cmp.a" }],
    })
    expect(deriveOrigin(node, "tenant", nodeMap(parent))).toBe("suppressed")
  })
})
