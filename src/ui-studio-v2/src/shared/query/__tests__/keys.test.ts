import { describe, it, expect } from "vitest"
import { qk } from "@/shared/query/keys"

describe("qk (query-key factory)", () => {
  it("tree key shape includes env, appId, editingLevel, scopeId", () => {
    const key = qk.tree("dev", "app.dms", "vertical", "automotive")
    expect(key).toEqual(["tree", "dev", "app.dms", "vertical", "automotive"])
  })

  it("editingLevel change produces a different tree key", () => {
    const key1 = qk.tree("dev", "app.dms", "vertical", "automotive")
    const key2 = qk.tree("dev", "app.dms", "tenant", "toyota")
    expect(key1).not.toEqual(key2)
  })

  it("preview key is independent of editingLevel", () => {
    const key = qk.preview("dev", "app.dms", "page.salesOrder", "toyota")
    expect(key).toEqual(["preview", "dev", "app.dms", "page.salesOrder", "toyota", undefined])
    expect(key[0]).toBe("preview")
    // No editingLevel dimension in preview key
    expect(key).not.toContain("vertical")
  })

  it("preview key includes role when provided", () => {
    const key = qk.preview("dev", "app.dms", "page.salesOrder", "toyota", "admin")
    expect(key[5]).toBe("admin")
  })

  it("node key is tuple of [node, id]", () => {
    const key = qk.node("uuid-123")
    expect(key).toEqual(["node", "uuid-123"])
  })

  it("validate key is tuple of [validate, env, appId]", () => {
    const key = qk.validate("dev", "app.dms")
    expect(key).toEqual(["validate", "dev", "app.dms"])
  })

  it("impact key includes level and scopeId", () => {
    const key = qk.impact("dev", "app.dms", "vertical", "automotive")
    expect(key).toEqual(["impact", "dev", "app.dms", "vertical", "automotive"])
  })
})
