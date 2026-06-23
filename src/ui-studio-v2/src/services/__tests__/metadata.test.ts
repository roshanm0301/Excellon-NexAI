import { describe, it, expect } from "vitest"
import { services } from "@/services"

describe("MetadataService (MSW)", () => {
  it("getTree returns seeded tree for automotive scope", async () => {
    const tree = await services.metadata.getTree({
      env: "dev",
      appId: "app.dms",
      editingLevel: "vertical",
      scopeId: "automotive",
    })

    expect(Array.isArray(tree)).toBe(true)
    expect(tree.length).toBeGreaterThan(0)

    const appNode = tree.find((n) => n.logicalKey === "app.dms")
    expect(appNode).toBeDefined()
    expect(appNode!.kind).toBe("application")
    expect(appNode!.originState).toBe("own")
  })

  it("getTree returns tree for toyota tenant scope", async () => {
    const tree = await services.metadata.getTree({
      env: "dev",
      appId: "app.dms",
      editingLevel: "tenant",
      scopeId: "toyota",
    })

    expect(tree.length).toBeGreaterThan(0)
    const appNode = tree.find((n) => n.logicalKey === "app.dms")
    expect(appNode).toBeDefined()
    expect(appNode!.originState).toBe("inherited")
  })

  it("getNode returns node by id", async () => {
    const node = await services.metadata.getNode("uuid-app-001")
    expect(node).toBeDefined()
    expect(node.logicalKey).toBe("app.dms")
    expect(node.kind).toBe("application")
  })

  it("getNode returns 404 for unknown id", async () => {
    await expect(services.metadata.getNode("nonexistent")).rejects.toThrow()
  })

  it("createNode persists and is retrievable", async () => {
    const created = await services.metadata.createNode({
      kind: "component",
      logicalKey: "cmp.test",
      cascadeLevel: "vertical",
      parentKey: "section.orderInfo",
      data: {
        name: "Test Component",
        semanticType: "FormField",
        props: { label: "Test", fieldType: "text" },
      },
    })

    expect(created.logicalKey).toBe("cmp.test")
    expect(created.id).toBeTruthy()

    const fetched = await services.metadata.getNode(created.id)
    expect(fetched.logicalKey).toBe("cmp.test")
  })

  it("overrideNode persists override", async () => {
    const result = await services.metadata.overrideNode({
      logicalKey: "cmp.orderNumber",
      level: "tenant",
      ops: [{ op: "set", path: "props.label", value: "Toyota Order #" }],
    })

    expect(result).toBeDefined()
    expect(result.id).toBeTruthy()
  })
})
