// T1.1.2 — shadcn Button renders with correct text (chrome boundary smoke test)
import { createRef } from "react"
import { render, screen } from "@testing-library/react"
import { Button } from "@/shared/ui/button"

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("renders destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
