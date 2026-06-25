import { describe, it, expect } from "vitest"
import type { ReactNode } from "react"
import { renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useLock } from "@/shared/query"

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("useLock", () => {
  it("acquires a lock for a free node", async () => {
    const { result } = renderHook(() => useLock(), { wrapper })

    const outcome = await result.current.mutateAsync("cmp.orderNumber")

    expect(outcome.acquired).toBe(true)
    if (outcome.acquired) {
      expect(outcome.lock.key).toBe("cmp.orderNumber")
      expect(outcome.lock.heldBy).toBe("mock-user")
    }
  })

  it("returns acquired:false when the node is already locked by another user", async () => {
    const { result } = renderHook(() => useLock(), { wrapper })

    // cmp.customerName is seed-locked by u-jordan → backend 409 → non-throwing denial.
    const outcome = await result.current.mutateAsync("cmp.customerName")

    expect(outcome.acquired).toBe(false)
  })
})
