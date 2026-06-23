import { describe, it, expect } from "vitest"
import { services } from "@/services"

describe("CompilerService (MSW)", () => {
  it("validate returns real domain issues for automotive scope", async () => {
    const issues = await services.compiler.validate({
      env: "dev",
      appId: "app.dms",
      editingLevel: "vertical",
      scopeId: "automotive",
    })

    expect(Array.isArray(issues)).toBe(true)
  })

  it("impact returns counts", async () => {
    const impact = await services.compiler.impact({
      env: "dev",
      appId: "app.dms",
      editingLevel: "vertical",
      scopeId: "automotive",
    })

    expect(impact).toHaveProperty("affectedOems")
    expect(impact).toHaveProperty("affectedDealers")
    expect(impact).toHaveProperty("orphanedOverrides")
    expect(impact).toHaveProperty("brokenBindings")
    expect(impact).toHaveProperty("summary")
    expect(typeof impact.summary).toBe("string")
  })

  it("publish blocks on validation errors (returns 422)", async () => {
    const { ApiError } = await import("@/services/http/client")
    try {
      await services.compiler.publish({
        env: "dev",
        appId: "app.dms",
        editingLevel: "vertical",
        scopeId: "automotive",
        targetEnv: "staging",
      })
      expect.fail("Expected ApiError to be thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as InstanceType<typeof ApiError>).status).toBe(422)
    }
  })
})
