import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { LockBanner } from "@/features/collaboration"

describe("LockBanner", () => {
  it("renders the locking user's name", () => {
    render(<LockBanner displayName="Jordan Lee" />)

    const banner = screen.getByLabelText("Locked by Jordan Lee")
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveTextContent("Jordan Lee")
  })

  it("uses role=status for assistive tech", () => {
    render(<LockBanner displayName="Jordan Lee" />)

    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})
