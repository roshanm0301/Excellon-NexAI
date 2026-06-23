import { resolveCascade } from "@/domain/cascade/resolveCascade"
import type { CascadeLevel, NodeBase } from "@/domain/types/base"
import { makeComponent, makeSection } from "@/domain/__tests__/fixtures"

function defs(...entries: [CascadeLevel, NodeBase[]][]): Map<CascadeLevel, NodeBase[]> {
  return new Map(entries)
}

describe("resolveCascade", () => {
  it("passes through platform-only nodes unchanged", () => {
    const cmp = makeComponent({ cascadeLevel: "platform", logicalKey: "cmp.a" })
    const { resolved, orphans } = resolveCascade(defs(["platform", [cmp]]))
    expect(orphans).toHaveLength(0)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].logicalKey).toBe("cmp.a")
  })

  it("most-specific-wins: vertical replaces platform same logicalKey", () => {
    const platform = makeComponent({
      cascadeLevel: "platform",
      logicalKey: "cmp.a",
      props: { label: "Platform" },
    })
    const vertical = makeComponent({
      cascadeLevel: "vertical",
      logicalKey: "cmp.a",
      props: { label: "Vertical" },
    })
    const { resolved } = resolveCascade(defs(["platform", [platform]], ["vertical", [vertical]]))
    expect(resolved).toHaveLength(1)
    expect((resolved[0] as ReturnType<typeof makeComponent>).props?.label).toBe("Vertical")
  })

  it("applies override ops from vertical to platform node", () => {
    const platform = makeSection({
      cascadeLevel: "platform",
      logicalKey: "section.a",
      components: ["cmp.a", "cmp.b"],
    })
    const override: NodeBase = {
      id: "override-1",
      logicalKey: "section.a.override",
      cascadeLevel: "vertical",
      overrideOf: "section.a",
      overrideOps: [
        { op: "insert", path: "components", logicalKey: "cmp.c" },
      ],
      objectVersion: 2,
      audit: platform.audit,
    }
    const { resolved, orphans } = resolveCascade(
      defs(["platform", [platform]], ["vertical", [override]]),
    )
    expect(orphans).toHaveLength(0)
    expect(resolved).toHaveLength(1)
    const section = resolved[0] as ReturnType<typeof makeSection>
    expect(section.components).toEqual(["cmp.a", "cmp.b", "cmp.c"])
  })

  it("three-level override: tenant overrides vertical overrides platform", () => {
    const platform = makeComponent({
      cascadeLevel: "platform",
      logicalKey: "cmp.a",
      props: { label: "Platform", disabled: false },
    })
    const verticalOverride: NodeBase = {
      id: "v-override",
      logicalKey: "cmp.a.v",
      cascadeLevel: "vertical",
      overrideOf: "cmp.a",
      overrideOps: [{ op: "set", path: "props.label", value: "Vertical" }],
      objectVersion: 2,
      audit: platform.audit,
    }
    const tenantOverride: NodeBase = {
      id: "t-override",
      logicalKey: "cmp.a.t",
      cascadeLevel: "tenant",
      overrideOf: "cmp.a",
      overrideOps: [{ op: "set", path: "props.disabled", value: true }],
      objectVersion: 3,
      audit: platform.audit,
    }
    const { resolved } = resolveCascade(
      defs(
        ["platform", [platform]],
        ["vertical", [verticalOverride]],
        ["tenant", [tenantOverride]],
      ),
    )
    expect(resolved).toHaveLength(1)
    const cmp = resolved[0] as ReturnType<typeof makeComponent>
    expect(cmp.props?.label).toBe("Vertical")
    expect(cmp.props?.disabled).toBe(true)
    expect(cmp.cascadeLevel).toBe("tenant")
  })

  it("org overrides all four levels", () => {
    const platform = makeComponent({
      cascadeLevel: "platform",
      logicalKey: "cmp.a",
      props: { label: "P" },
    })
    const orgOverride: NodeBase = {
      id: "o-override",
      logicalKey: "cmp.a.org",
      cascadeLevel: "org",
      overrideOf: "cmp.a",
      overrideOps: [{ op: "set", path: "props.label", value: "Org" }],
      objectVersion: 4,
      audit: platform.audit,
    }
    const { resolved } = resolveCascade(
      defs(["platform", [platform]], ["org", [orgOverride]]),
    )
    expect(resolved).toHaveLength(1)
    expect((resolved[0] as ReturnType<typeof makeComponent>).props?.label).toBe("Org")
    expect(resolved[0].cascadeLevel).toBe("org")
  })

  it("adds new nodes at lower levels alongside inherited", () => {
    const platformCmp = makeComponent({
      cascadeLevel: "platform",
      logicalKey: "cmp.a",
    })
    const tenantCmp = makeComponent({
      cascadeLevel: "tenant",
      logicalKey: "cmp.b",
    })
    const { resolved } = resolveCascade(
      defs(["platform", [platformCmp]], ["tenant", [tenantCmp]]),
    )
    expect(resolved).toHaveLength(2)
    expect(resolved.map((n) => n.logicalKey).sort()).toEqual(["cmp.a", "cmp.b"])
  })

  it("remove op suppresses an inherited node", () => {
    const platform = makeComponent({
      cascadeLevel: "platform",
      logicalKey: "cmp.a",
    })
    const removeOverride: NodeBase = {
      id: "remove-1",
      logicalKey: "cmp.a.remove",
      cascadeLevel: "tenant",
      overrideOf: "cmp.a",
      overrideOps: [{ op: "remove", logicalKey: "cmp.a" }],
      objectVersion: 2,
      audit: platform.audit,
    }
    const { resolved } = resolveCascade(
      defs(["platform", [platform]], ["tenant", [removeOverride]]),
    )
    expect(resolved).toHaveLength(0)
  })

  it("detects orphan when overrideOf points to non-existent parent", () => {
    const orphanNode: NodeBase = {
      id: "orphan-1",
      logicalKey: "cmp.orphan",
      cascadeLevel: "tenant",
      overrideOf: "cmp.missing",
      overrideOps: [{ op: "set", path: "props.label", value: "Orphan" }],
      objectVersion: 1,
      audit: {
        createdBy: "test",
        createdAt: "2024-01-01T00:00:00Z",
        modifiedBy: "test",
        modifiedAt: "2024-01-01T00:00:00Z",
      },
    }
    const { resolved, orphans } = resolveCascade(defs(["tenant", [orphanNode]]))
    expect(orphans).toHaveLength(1)
    expect(orphans[0].type).toBe("orphaned-override")
    expect(orphans[0].nodeId).toBe("cmp.orphan")
    expect(orphans[0].cascade).toBe("tenant")
    expect(resolved).toHaveLength(0)
  })

  it("is deterministic: same input produces same output", () => {
    const platform = makeComponent({
      cascadeLevel: "platform",
      logicalKey: "cmp.a",
      props: { label: "Test" },
    })
    const override: NodeBase = {
      id: "v-1",
      logicalKey: "cmp.a.v",
      cascadeLevel: "vertical",
      overrideOf: "cmp.a",
      overrideOps: [{ op: "set", path: "props.label", value: "V" }],
      objectVersion: 2,
      audit: platform.audit,
    }
    const input = defs(["platform", [platform]], ["vertical", [override]])
    const result1 = resolveCascade(input)
    const result2 = resolveCascade(input)
    expect(result1.resolved).toEqual(result2.resolved)
    expect(result1.orphans).toEqual(result2.orphans)
  })

  it("returns empty result for empty definitions", () => {
    const { resolved, orphans } = resolveCascade(new Map())
    expect(resolved).toHaveLength(0)
    expect(orphans).toHaveLength(0)
  })

  it("handles override with no overrideOps (shallow copy)", () => {
    const platform = makeComponent({
      cascadeLevel: "platform",
      logicalKey: "cmp.a",
      props: { label: "Original" },
    })
    const override: NodeBase = {
      id: "v-1",
      logicalKey: "cmp.a.v",
      cascadeLevel: "vertical",
      overrideOf: "cmp.a",
      objectVersion: 2,
      audit: platform.audit,
    }
    const { resolved } = resolveCascade(
      defs(["platform", [platform]], ["vertical", [override]]),
    )
    expect(resolved).toHaveLength(1)
    expect(resolved[0].cascadeLevel).toBe("vertical")
    expect((resolved[0] as ReturnType<typeof makeComponent>).props?.label).toBe("Original")
  })
})
