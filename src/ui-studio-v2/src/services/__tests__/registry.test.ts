import { describe, it, expect } from "vitest"
import { services } from "@/services"

describe("RegistryService (MSW)", () => {
  it("search with empty query returns all hits", async () => {
    const results = await services.registry.search("")
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.kind === "entity")).toBe(true)
    expect(results.some((r) => r.kind === "workflow")).toBe(true)
  })

  it("search filters by query", async () => {
    const results = await services.registry.search("order")
    expect(results.length).toBeGreaterThan(0)
    for (const hit of results) {
      const match =
        hit.ref.toLowerCase().includes("order") ||
        hit.name.toLowerCase().includes("order") ||
        (hit.description?.toLowerCase().includes("order") ?? false)
      expect(match).toBe(true)
    }
  })

  it("shape returns fields for known ref", async () => {
    const shape = await services.registry.shape("entity.SalesOrder")
    expect(shape.ref).toBe("entity.SalesOrder")
    expect(shape.fields.length).toBe(6)
    expect(shape.fields.some((f) => f.name === "orderNumber")).toBe(true)
  })

  it("shape throws for unknown ref", async () => {
    await expect(services.registry.shape("entity.Unknown")).rejects.toThrow()
  })
})
