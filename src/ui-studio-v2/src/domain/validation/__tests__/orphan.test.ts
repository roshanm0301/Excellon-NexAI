import { validateOrphans } from "@/domain/validation/orphan"
import { makeNodeBase } from "@/domain/__tests__/fixtures"

describe("validateOrphans", () => {
  it("returns empty issues when no nodes have overrideOf", () => {
    const nodes = [
      makeNodeBase({ logicalKey: "cmp.a", cascadeLevel: "platform" }),
      makeNodeBase({ logicalKey: "cmp.b", cascadeLevel: "tenant" }),
    ]
    const issues = validateOrphans(nodes)
    expect(issues).toHaveLength(0)
  })

  it("returns empty issues when override parent exists at higher level", () => {
    const parent = makeNodeBase({ logicalKey: "cmp.a", cascadeLevel: "platform" })
    const child = makeNodeBase({
      logicalKey: "cmp.a",
      cascadeLevel: "tenant",
      overrideOf: "cmp.a",
    })
    const issues = validateOrphans([parent, child])
    expect(issues).toHaveLength(0)
  })

  it("detects orphan when overrideOf targets non-existent logicalKey", () => {
    const node = makeNodeBase({
      logicalKey: "cmp.orphan",
      cascadeLevel: "tenant",
      overrideOf: "cmp.missing",
    })
    const issues = validateOrphans([node])
    expect(issues).toHaveLength(1)
    expect(issues[0].type).toBe("orphaned-override")
    expect(issues[0].nodeId).toBe("cmp.orphan")
    expect(issues[0].path).toBe("overrideOf")
    expect(issues[0].cascade).toBe("tenant")
    expect(issues[0].message).toContain("cmp.missing")
  })

  it("detects orphan when parent exists but at same or lower cascade level", () => {
    const parent = makeNodeBase({ logicalKey: "cmp.a", cascadeLevel: "tenant" })
    const child = makeNodeBase({
      logicalKey: "cmp.a",
      cascadeLevel: "tenant",
      overrideOf: "cmp.a",
    })
    const issues = validateOrphans([parent, child])
    expect(issues).toHaveLength(1)
    expect(issues[0].type).toBe("orphaned-override")
    expect(issues[0].message).toContain("higher cascade level")
  })

  it("collects multiple orphans", () => {
    const orphan1 = makeNodeBase({
      logicalKey: "cmp.o1",
      cascadeLevel: "tenant",
      overrideOf: "cmp.missing1",
    })
    const orphan2 = makeNodeBase({
      logicalKey: "cmp.o2",
      cascadeLevel: "org",
      overrideOf: "cmp.missing2",
    })
    const issues = validateOrphans([orphan1, orphan2])
    expect(issues).toHaveLength(2)
    expect(issues.map((i) => i.nodeId).sort()).toEqual(["cmp.o1", "cmp.o2"])
  })

  it("accepts chained overrides across levels", () => {
    const platform = makeNodeBase({ logicalKey: "cmp.a", cascadeLevel: "platform" })
    const vertical = makeNodeBase({
      logicalKey: "cmp.a",
      cascadeLevel: "vertical",
      overrideOf: "cmp.a",
    })
    const tenant = makeNodeBase({
      logicalKey: "cmp.a",
      cascadeLevel: "tenant",
      overrideOf: "cmp.a",
    })
    const org = makeNodeBase({
      logicalKey: "cmp.a",
      cascadeLevel: "org",
      overrideOf: "cmp.a",
    })
    const issues = validateOrphans([platform, vertical, tenant, org])
    expect(issues).toHaveLength(0)
  })

  it("returns empty issues for empty input", () => {
    const issues = validateOrphans([])
    expect(issues).toHaveLength(0)
  })

  it("detects orphan at org level targeting non-existent parent", () => {
    const node = makeNodeBase({
      logicalKey: "cmp.org-orphan",
      cascadeLevel: "org",
      overrideOf: "cmp.gone",
    })
    const issues = validateOrphans([node])
    expect(issues).toHaveLength(1)
    expect(issues[0].cascade).toBe("org")
  })

  it("validates when overrideOf targets a different logicalKey", () => {
    const parent = makeNodeBase({ logicalKey: "section.a", cascadeLevel: "platform" })
    const child = makeNodeBase({
      logicalKey: "section.a.override",
      cascadeLevel: "tenant",
      overrideOf: "section.a",
    })
    const issues = validateOrphans([parent, child])
    expect(issues).toHaveLength(0)
  })
})
