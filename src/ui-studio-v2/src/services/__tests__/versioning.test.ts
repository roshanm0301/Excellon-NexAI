import { describe, it, expect } from "vitest"
import { services } from "@/services"

describe("VersioningService (MSW)", () => {
  it("getVersions returns the publish history as version entries", async () => {
    // Seed two published versions via promote.
    await services.versioning.promote({
      env: "dev",
      appId: "app.dms",
      fromEnv: "dev",
      toEnv: "staging",
      version: 1,
    })
    const versions = await services.versioning.getVersions("app.dms")
    expect(Array.isArray(versions)).toBe(true)
    expect(versions.length).toBeGreaterThan(0)
    expect(versions[0]).toHaveProperty("version")
    expect(versions[0]).toHaveProperty("publishedBy")
  })

  it("getDiff returns node-level diff entries between two versions", async () => {
    const diff = await services.versioning.getDiff("app.dms", 1, 2)
    expect(diff.v1).toBe(1)
    expect(diff.v2).toBe(2)
    expect(diff.entries.length).toBeGreaterThan(0)
    const added = diff.entries.find((e) => e.changeType === "added")
    expect(added?.before).toBeNull()
    expect(added?.after).not.toBeNull()
  })

  it("promote appends a new version and returns success", async () => {
    const result = await services.versioning.promote({
      env: "dev",
      appId: "app.dms",
      fromEnv: "dev",
      toEnv: "staging",
      version: 1,
    })
    expect(result.success).toBe(true)
    expect(result.artifactVersion).toBeGreaterThan(0)
    expect(result.message).toMatch(/staging/i)
  })

  it("rollback to an existing version succeeds", async () => {
    await services.versioning.promote({
      env: "dev",
      appId: "app.dms",
      fromEnv: "dev",
      toEnv: "staging",
      version: 1,
    })
    const result = await services.versioning.rollback({
      env: "dev",
      appId: "app.dms",
      targetVersion: 1,
    })
    expect(result.success).toBe(true)
    expect(result.message).toMatch(/rolled back/i)
  })

  it("rollback to a non-existent version is rejected", async () => {
    await expect(
      services.versioning.rollback({ env: "dev", appId: "app.dms", targetVersion: 999 }),
    ).rejects.toThrow()
  })
})
