import { describe, it, expect } from "vitest"
import type { ReactNode } from "react"
import { renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/mocks/server"
import {
  useCreateNode,
  useOverrideNode,
  usePublish,
  usePromote,
  useRollback,
  useCreateApp,
} from "@/shared/query"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("query mutations", () => {
  it("useCreateNode creates a component node", async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateNode(), { wrapper })

    const node = await result.current.mutateAsync({
      kind: "component",
      logicalKey: "cmp.test.created",
      cascadeLevel: "vertical",
      parentKey: "section.orderHeader",
      data: { semanticType: "TextField", props: { label: "Test" } },
    })

    expect(node.logicalKey).toBe("cmp.test.created")
  })

  it("useOverrideNode persists an override and rolls forward the node cache", async () => {
    const { qc, wrapper } = makeWrapper()
    // Seed a node cache entry so the optimistic onMutate path runs.
    qc.setQueryData(["node", "cmp.orderNumber"], {
      id: "uuid-cmp-002",
      logicalKey: "cmp.orderNumber",
      kind: "component",
      cascadeLevel: "vertical",
      semanticType: "TextField",
      props: { label: "Order #" },
    })

    const { result } = renderHook(() => useOverrideNode(), { wrapper })
    const res = await result.current.mutateAsync({
      logicalKey: "cmp.orderNumber",
      level: "tenant",
      ops: [{ op: "set", path: "props.label", value: "Order Number" }],
    })

    expect(res).toBeTruthy()
  })

  it("usePublish publishes to the target env", async () => {
    // Stub a clean publish so the mutation path is exercised deterministically
    // (the seeded fixture otherwise returns validation errors → 422).
    server.use(
      http.post("/api/v1/compiler/publish", () =>
        HttpResponse.json({
          success: true,
          artifactVersion: 1,
          message: "Published successfully",
          issues: [],
        }),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublish(), { wrapper })

    const res = await result.current.mutateAsync({
      env: "dev",
      appId: "app.dms",
      editingLevel: "vertical",
      scopeId: "automotive",
      targetEnv: "staging",
    })

    expect(res).toHaveProperty("artifactVersion")
    expect(res).toHaveProperty("success")
  })

  it("usePromote promotes between environments", async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePromote(), { wrapper })

    const res = await result.current.mutateAsync({
      env: "dev",
      appId: "app.dms",
      fromEnv: "dev",
      toEnv: "staging",
      version: 1,
    })

    expect(res.success).toBe(true)
  })

  it("useRollback rolls back to a prior version", async () => {
    const { wrapper } = makeWrapper()
    const promote = renderHook(() => usePromote(), { wrapper })
    await promote.result.current.mutateAsync({
      env: "dev",
      appId: "app.dms",
      fromEnv: "dev",
      toEnv: "staging",
      version: 1,
    })

    const { result } = renderHook(() => useRollback(), { wrapper })
    const res = await result.current.mutateAsync({
      env: "dev",
      appId: "app.dms",
      targetVersion: 1,
    })

    expect(res.success).toBe(true)
  })

  it("useCreateApp creates an application", async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateApp(), { wrapper })

    const app = await result.current.mutateAsync({
      name: "Test App",
      vertical: "automotive",
    })

    expect(app.id).toBeTruthy()
    expect(app.name).toBe("Test App")
  })
})
