import { describe, it, expect, vi } from "vitest"
import { services } from "@/services"

describe("PresenceService", () => {
  it("subscribe returns the seeded collaborators from the real API", async () => {
    const callback = vi.fn()
    const unsub = services.presence.subscribe("app.dms", callback)

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled()
    })

    const users = callback.mock.calls[0][0]
    expect(users).toHaveLength(2)
    expect(users.some((user: { userId: string }) => user.userId === "mock-user")).toBe(true)
    expect(users.some((user: { userId: string }) => user.userId === "u-jordan")).toBe(true)

    unsub()
  })

  it("lock acquires a new lock", async () => {
    const lock = await services.presence.lock("cmp.orderNumber")
    expect(lock.key).toBe("cmp.orderNumber")
    expect(lock.heldBy).toBe("mock-user")
    expect(lock.acquiredAt).toBeTruthy()
    expect(lock.expiresAt).toBeTruthy()
  })

  it("lock conflict returns error for already-locked key", async () => {
    await services.presence.lock("cmp.orderDate")
    await expect(services.presence.lock("cmp.orderDate")).rejects.toThrow()
  })
})
