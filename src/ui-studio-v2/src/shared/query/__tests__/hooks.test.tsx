import { describe, it, expect } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useTree, useNode, usePreview } from "@/shared/query/hooks"

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("useTree", () => {
  it("fetches tree for automotive scope", async () => {
    const { result } = renderHook(
      () => useTree("dev", "app.dms", "vertical", "automotive"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
    expect(result.current.data!.length).toBeGreaterThan(0)
  })

  it("re-fetches when editingLevel changes", async () => {
    const wrapper = createWrapper()

    const { result: r1 } = renderHook(
      () => useTree("dev", "app.dms", "vertical", "automotive"),
      { wrapper },
    )
    await waitFor(() => expect(r1.current.isSuccess).toBe(true))

    const { result: r2 } = renderHook(
      () => useTree("dev", "app.dms", "tenant", "toyota"),
      { wrapper },
    )
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    expect(r2.current.data).toBeDefined()
  })
})

describe("useNode", () => {
  it("fetches node when id is non-empty", async () => {
    const { result } = renderHook(() => useNode("uuid-app-001"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.logicalKey).toBe("app.dms")
  })

  it("is disabled when id is empty", () => {
    const { result } = renderHook(() => useNode(""), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe("idle")
  })
})

describe("usePreview", () => {
  it("fetches preview for automotive scope", async () => {
    const { result } = renderHook(
      () => usePreview("dev", "app.dms", "page.salesOrder", "automotive"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.nodes.length).toBeGreaterThan(0)
  })

  it("preview scope change re-fetches without tree involvement", async () => {
    const wrapper = createWrapper()

    const { result: r1 } = renderHook(
      () => usePreview("dev", "app.dms", "page.salesOrder", "automotive"),
      { wrapper },
    )
    await waitFor(() => expect(r1.current.isSuccess).toBe(true))

    const { result: r2 } = renderHook(
      () => usePreview("dev", "app.dms", "page.salesOrder", "toyota"),
      { wrapper },
    )
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    const discountField = r2.current.data!.nodes.find(
      (n) => n.logicalKey === "cmp.discountField",
    )
    expect(discountField).toBeUndefined()
  })
})
