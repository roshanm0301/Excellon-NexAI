// Phase 5 T8.4.1 — BindingPlaceholder tests
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BindingPlaceholder } from "@/runtime-preview/BindingPlaceholder"
import type { Binding } from "@/domain/types"

describe("BindingPlaceholder", () => {
  it("renders binding path with ref and path", () => {
    const binding: Binding = {
      bind: { kind: "dataSource", ref: "ds.order", path: "orderNumber" },
    }

    render(<BindingPlaceholder binding={binding} />)
    expect(screen.getByText("{{ ds.order.orderNumber }}")).toBeInTheDocument()
  })

  it("renders binding path without path component", () => {
    const binding: Binding = {
      bind: { kind: "state", ref: "isEditing" },
    }

    render(<BindingPlaceholder binding={binding} />)
    expect(screen.getByText("{{ isEditing }}")).toBeInTheDocument()
  })

  it("renders in a red-bordered box", () => {
    const binding: Binding = {
      bind: { kind: "dataSource", ref: "ds.test", path: "field" },
    }

    const { container } = render(<BindingPlaceholder binding={binding} />)
    const box = container.firstChild as HTMLElement
    const style = window.getComputedStyle(box)
    expect(style.borderColor).toBeTruthy()
  })
})
