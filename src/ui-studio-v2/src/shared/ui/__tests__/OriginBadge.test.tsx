import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TooltipProvider } from "@/shared/ui"
import { OriginBadge } from "@/shared/ui/origin-badge"
import type { OriginState } from "@/domain/types"

function renderBadge(state: OriginState, sourceLevel?: "vertical") {
  return render(
    <TooltipProvider>
      <OriginBadge state={state} sourceLevel={sourceLevel} />
    </TooltipProvider>,
  )
}

describe("OriginBadge", () => {
  it("own — renders + glyph with correct aria-label", () => {
    renderBadge("own")
    const badge = screen.getByRole("generic", { name: /^Own:/i })
    expect(badge).toBeInTheDocument()
    expect(badge.textContent).toContain("+")
  })

  it("overridden — renders ● glyph", () => {
    renderBadge("overridden")
    const badge = screen.getByRole("generic", { name: /^Override:/i })
    expect(badge.textContent).toContain("●")
  })

  it("inherited — renders ↑ glyph and includes source level in aria-label", () => {
    renderBadge("inherited", "vertical")
    const badge = screen.getByRole("generic", { name: /^Inherited:/i })
    expect(badge.textContent).toContain("↑")
    expect(badge).toHaveAttribute("aria-label", expect.stringContaining("vertical"))
  })

  it("suppressed — renders ⊘ glyph with opacity class", () => {
    renderBadge("suppressed")
    const badge = screen.getByRole("generic", { name: /^Hidden:/i })
    expect(badge.textContent).toContain("⊘")
    expect(badge.className).toContain("opacity-40")
  })

  it("orphaned — renders ! glyph with destructive ring", () => {
    renderBadge("orphaned")
    const badge = screen.getByRole("generic", { name: /^Orphaned:/i })
    expect(badge.textContent).toContain("!")
    expect(badge.className).toContain("ring-destructive")
  })
})
