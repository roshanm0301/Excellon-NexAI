import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"

const navigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

import { useCascadeNav } from "@/shared/hooks/use-cascade-nav"

type SearchUpdater = (prev: Record<string, unknown>) => Record<string, unknown>

describe("useCascadeNav", () => {
  beforeEach(() => navigate.mockReset())

  it("setEditingLevel navigates with editingLevel + scopeId in search", () => {
    const { result } = renderHook(() => useCascadeNav())
    result.current.setEditingLevel("tenant", "toyota")
    expect(navigate).toHaveBeenCalledTimes(1)
    const updater = navigate.mock.calls[0][0].search as SearchUpdater
    expect(updater({ env: "dev" })).toEqual({
      env: "dev",
      editingLevel: "tenant",
      scopeId: "toyota",
    })
  })

  it("setPreviewScope, setEnv, and setSelection update their search keys", () => {
    const { result } = renderHook(() => useCascadeNav())

    result.current.setPreviewScope("dealer-x")
    result.current.setEnv("prod")
    result.current.setSelection(["n1", "n2"])

    expect(navigate).toHaveBeenCalledTimes(3)
    const previewUpdater = navigate.mock.calls[0][0].search as SearchUpdater
    const envUpdater = navigate.mock.calls[1][0].search as SearchUpdater
    const selUpdater = navigate.mock.calls[2][0].search as SearchUpdater

    expect(previewUpdater({})).toEqual({ previewScopeId: "dealer-x" })
    expect(envUpdater({})).toEqual({ env: "prod" })
    expect(selUpdater({})).toEqual({ selection: ["n1", "n2"] })
  })
})
