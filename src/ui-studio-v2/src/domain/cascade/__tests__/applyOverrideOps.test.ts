import { applyOverrideOps } from "@/domain/cascade/applyOverrideOps"
import { makeComponent, makeSection } from "@/domain/__tests__/fixtures"

describe("applyOverrideOps", () => {
  describe("set op", () => {
    it("replaces a top-level property", () => {
      const node = makeComponent({ props: { label: "Old" } })
      const result = applyOverrideOps(node, [{ op: "set", path: "props.label", value: "New" }])
      expect(result.props?.label).toBe("New")
    })

    it("replaces a nested property via dot-path", () => {
      const node = makeComponent({
        props: { config: { nested: { deep: "old" } } as never },
      })
      const result = applyOverrideOps(node, [
        { op: "set", path: "props.config.nested.deep", value: "new" },
      ])
      const config = result.props?.config as Record<string, Record<string, string>>
      expect(config.nested.deep).toBe("new")
    })

    it("creates intermediate objects when path doesn't fully exist", () => {
      const node = makeComponent({ props: { label: "Test" } })
      const result = applyOverrideOps(node, [
        { op: "set", path: "props.newProp.nested", value: 42 },
      ])
      const newProp = result.props?.newProp as Record<string, unknown>
      expect(newProp.nested).toBe(42)
    })

    it("does not mutate the original node", () => {
      const node = makeComponent({ props: { label: "Original" } })
      applyOverrideOps(node, [{ op: "set", path: "props.label", value: "Changed" }])
      expect(node.props?.label).toBe("Original")
    })
  })

  describe("merge op", () => {
    it("deep-merges an object at path", () => {
      const node = makeComponent({
        props: { label: "Test", disabled: false } as Record<string, unknown>,
      })
      const result = applyOverrideOps(node, [
        { op: "merge", path: "props", value: { disabled: true, extra: "val" } },
      ])
      expect(result.props?.label).toBe("Test")
      expect(result.props?.disabled).toBe(true)
      expect(result.props?.extra).toBe("val")
    })

    it("deep-merges nested objects", () => {
      const node = makeComponent({
        props: { config: { a: 1, b: { c: 2 } } as never },
      })
      const result = applyOverrideOps(node, [
        { op: "merge", path: "props.config", value: { b: { d: 3 }, e: 4 } },
      ])
      const config = result.props?.config as Record<string, unknown>
      expect(config.a).toBe(1)
      expect((config.b as Record<string, unknown>).c).toBe(2)
      expect((config.b as Record<string, unknown>).d).toBe(3)
      expect(config.e).toBe(4)
    })

    it("sets the value when target path is not an object", () => {
      const node = makeComponent({ props: { label: "Test" } })
      const result = applyOverrideOps(node, [
        { op: "merge", path: "props.newObj", value: { a: 1 } },
      ])
      const newObj = result.props?.newObj as Record<string, unknown>
      expect(newObj.a).toBe(1)
    })
  })

  describe("insert op", () => {
    it("appends to string[] when no relativeTo", () => {
      const node = makeSection({ components: ["cmp.a", "cmp.b"] })
      const result = applyOverrideOps(node, [
        { op: "insert", path: "components", logicalKey: "cmp.c" },
      ])
      expect(result.components).toEqual(["cmp.a", "cmp.b", "cmp.c"])
    })

    it("inserts after a sibling", () => {
      const node = makeSection({ components: ["cmp.a", "cmp.b", "cmp.c"] })
      const result = applyOverrideOps(node, [
        { op: "insert", path: "components", logicalKey: "cmp.x", relativeTo: "cmp.a", position: "after" },
      ])
      expect(result.components).toEqual(["cmp.a", "cmp.x", "cmp.b", "cmp.c"])
    })

    it("inserts before a sibling", () => {
      const node = makeSection({ components: ["cmp.a", "cmp.b"] })
      const result = applyOverrideOps(node, [
        { op: "insert", path: "components", logicalKey: "cmp.x", relativeTo: "cmp.b", position: "before" },
      ])
      expect(result.components).toEqual(["cmp.a", "cmp.x", "cmp.b"])
    })

    it("appends when relativeTo is not found", () => {
      const node = makeSection({ components: ["cmp.a"] })
      const result = applyOverrideOps(node, [
        { op: "insert", path: "components", logicalKey: "cmp.x", relativeTo: "cmp.missing" },
      ])
      expect(result.components).toEqual(["cmp.a", "cmp.x"])
    })

    it("creates array when path does not exist", () => {
      const node = makeComponent()
      const result = applyOverrideOps(node, [
        { op: "insert", path: "children", logicalKey: "cmp.child" },
      ])
      expect(result.children).toEqual(["cmp.child"])
    })
  })

  describe("remove op", () => {
    it("removes a child from a string array", () => {
      const node = makeSection({ components: ["cmp.a", "cmp.b", "cmp.c"] })
      const result = applyOverrideOps(node, [{ op: "remove", logicalKey: "cmp.b" }])
      expect(result.components).toEqual(["cmp.a", "cmp.c"])
    })

    it("is a no-op when child is not found", () => {
      const node = makeSection({ components: ["cmp.a", "cmp.b"] })
      const result = applyOverrideOps(node, [{ op: "remove", logicalKey: "cmp.missing" }])
      expect(result.components).toEqual(["cmp.a", "cmp.b"])
    })
  })

  describe("replace op", () => {
    it("replaces a child in an object array by logicalKey", () => {
      const node = {
        ...makeSection(),
        items: [
          { logicalKey: "item.a", value: 1 },
          { logicalKey: "item.b", value: 2 },
        ],
      }
      const result = applyOverrideOps(node, [
        { op: "replace", logicalKey: "item.b", value: { logicalKey: "item.b", value: 99 } },
      ])
      const items = (result as Record<string, unknown>).items as Array<{
        logicalKey: string
        value: number
      }>
      expect(items[1].value).toBe(99)
      expect(items[1].logicalKey).toBe("item.b")
    })

    it("is a no-op when logicalKey not found", () => {
      const node = {
        ...makeSection(),
        items: [{ logicalKey: "item.a", value: 1 }],
      }
      const result = applyOverrideOps(node, [
        { op: "replace", logicalKey: "item.missing", value: { logicalKey: "item.missing", value: 0 } },
      ])
      const items = (result as Record<string, unknown>).items as Array<{
        logicalKey: string
        value: number
      }>
      expect(items).toHaveLength(1)
      expect(items[0].logicalKey).toBe("item.a")
    })
  })

  describe("edge cases", () => {
    it("returns original reference when ops array is empty", () => {
      const node = makeComponent({ props: { label: "Test" } })
      const result = applyOverrideOps(node, [])
      expect(result).toEqual(node)
      expect(result).toBe(node)
    })

    it("applies multiple ops in sequence", () => {
      const node = makeSection({ components: ["cmp.a", "cmp.b"] })
      const result = applyOverrideOps(node, [
        { op: "insert", path: "components", logicalKey: "cmp.c" },
        { op: "remove", logicalKey: "cmp.a" },
      ])
      expect(result.components).toEqual(["cmp.b", "cmp.c"])
    })
  })
})
