import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PropertyRow, TooltipProvider } from "@/shared/ui"
import type { PropertyRowProps } from "@/shared/ui"

function wrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>
}

function makeProps(overrides?: Partial<PropertyRowProps>): PropertyRowProps {
  return {
    propKey: "label",
    label: "Label",
    propType: "string",
    required: true,
    value: "Test label",
    origin: "own",
    onChangeValue: vi.fn(),
    onClickBind: vi.fn(),
    onRevert: vi.fn(),
    ...overrides,
  }
}

describe("PropertyRow", () => {
  it("renders text Input for string prop", () => {
    render(<PropertyRow {...makeProps()} />, { wrapper })
    expect(screen.getByRole("textbox", { name: "Label" })).toBeInTheDocument()
  })

  it("renders number Input for number prop", () => {
    render(
      <PropertyRow
        {...makeProps({ propKey: "min", label: "Min", propType: "number", value: 0, required: false })}
      />,
      { wrapper },
    )
    expect(screen.getByRole("spinbutton", { name: "Min" })).toBeInTheDocument()
  })

  it("renders Switch for boolean prop", () => {
    render(
      <PropertyRow
        {...makeProps({ propKey: "disabled", label: "Disabled", propType: "boolean", value: false, required: false })}
      />,
      { wrapper },
    )
    expect(screen.getByRole("switch", { name: "Disabled" })).toBeInTheDocument()
  })

  it("calls onChangeValue when text input changes", () => {
    const onChangeValue = vi.fn()
    render(<PropertyRow {...makeProps({ onChangeValue })} />, { wrapper })
    const input = screen.getByRole("textbox", { name: "Label" })
    fireEvent.change(input, { target: { value: "New value" } })
    expect(onChangeValue).toHaveBeenCalledWith("New value")
  })

  it("calls onChangeValue when Switch is toggled", () => {
    const onChangeValue = vi.fn()
    render(
      <PropertyRow
        {...makeProps({
          propKey: "disabled",
          label: "Disabled",
          propType: "boolean",
          value: false,
          required: false,
          onChangeValue,
        })}
      />,
      { wrapper },
    )
    fireEvent.click(screen.getByRole("switch", { name: "Disabled" }))
    expect(onChangeValue).toHaveBeenCalledWith(true)
  })

  it("renders binding badge and Change button when value is a Binding", () => {
    render(
      <PropertyRow
        {...makeProps({
          propKey: "source",
          label: "Source",
          propType: "string",
          value: { bind: { kind: "dataSource", ref: "ds.salesOrder", path: "orderId" } },
          required: false,
        })}
      />,
      { wrapper },
    )
    expect(screen.getByText(/ds\.salesOrder\.orderId/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument()
  })

  it("calls onClickBind when Change button is clicked", () => {
    const onClickBind = vi.fn()
    render(
      <PropertyRow
        {...makeProps({
          propKey: "source",
          label: "Source",
          propType: "string",
          value: { bind: { kind: "dataSource", ref: "ds.salesOrder", path: "orderId" } },
          required: false,
          onClickBind,
        })}
      />,
      { wrapper },
    )
    fireEvent.click(screen.getByRole("button", { name: "Change" }))
    expect(onClickBind).toHaveBeenCalledOnce()
  })

  it("shows B toggle button and switches to binding mode on click", () => {
    render(<PropertyRow {...makeProps({ value: "plain text" })} />, { wrapper })

    expect(screen.getByRole("textbox", { name: "Label" })).toBeInTheDocument()

    fireEvent.click(screen.getByTitle("Switch to binding"))

    expect(screen.queryByRole("textbox", { name: "Label" })).not.toBeInTheDocument()
    expect(screen.getByText("None")).toBeInTheDocument()
  })

  it("shows T toggle button in binding mode and switches back to value mode", () => {
    render(
      <PropertyRow
        {...makeProps({
          value: { bind: { kind: "dataSource", ref: "ds.salesOrder" } },
        })}
      />,
      { wrapper },
    )

    expect(screen.queryByRole("textbox", { name: "Label" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByTitle("Switch to value"))

    expect(screen.getByRole("textbox", { name: "Label" })).toBeInTheDocument()
  })

  it("shows OriginBadge for non-own origin", () => {
    render(<PropertyRow {...makeProps({ origin: "inherited" })} />, { wrapper })
    expect(screen.getByLabelText(/inherited/i)).toBeInTheDocument()
  })

  it("shows Revert button when origin is not own", () => {
    render(<PropertyRow {...makeProps({ origin: "overridden" })} />, { wrapper })
    expect(screen.getByTitle("Revert to inherited")).toBeInTheDocument()
  })

  it("does not show Revert button when origin is own", () => {
    render(<PropertyRow {...makeProps({ origin: "own" })} />, { wrapper })
    expect(screen.queryByTitle("Revert to inherited")).not.toBeInTheDocument()
  })

  it("calls onRevert when Revert button is clicked", () => {
    const onRevert = vi.fn()
    render(<PropertyRow {...makeProps({ origin: "overridden", onRevert })} />, { wrapper })
    fireEvent.click(screen.getByTitle("Revert to inherited"))
    expect(onRevert).toHaveBeenCalledOnce()
  })

  it("required prop marks the input as required", () => {
    render(<PropertyRow {...makeProps({ required: true })} />, { wrapper })
    expect(screen.getByRole("textbox", { name: "Label" })).toBeRequired()
  })
})
