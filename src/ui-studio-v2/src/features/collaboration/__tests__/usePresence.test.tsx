import { describe, it, expect } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { usePresence } from "@/features/collaboration"

describe("usePresence", () => {
  it("subscribes and returns seeded users", async () => {
    const { result } = renderHook(() => usePresence("app.dms"))

    await waitFor(() => expect(result.current.users.length).toBeGreaterThan(0))

    expect(
      result.current.users.some((u) => u.displayName === "Jordan Lee"),
    ).toBe(true)
  })

  it("derives lockedByOthers excluding the current user", async () => {
    const { result } = renderHook(() => usePresence("app.dms"))

    await waitFor(() => expect(result.current.users.length).toBeGreaterThan(0))

    expect(result.current.lockedByOthers.get("cmp.customerName")?.displayName).toBe(
      "Jordan Lee",
    )

    // The current user ("mock-user") holds no locks, and even if they did the
    // hook must never surface them in lockedByOthers.
    for (const user of result.current.lockedByOthers.values()) {
      expect(user.userId).not.toBe("mock-user")
    }
  })

  it("does not subscribe when appId is empty", async () => {
    const { result } = renderHook(() => usePresence(""))

    expect(result.current.users).toHaveLength(0)

    // Give any errant subscription a chance to populate, then confirm it stayed empty.
    await waitFor(() => expect(result.current.users).toHaveLength(0))
    expect(result.current.users).toHaveLength(0)
  })
})
