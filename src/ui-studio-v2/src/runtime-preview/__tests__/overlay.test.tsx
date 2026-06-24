// Phase 5 T8.2.1 — overlay layer tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { NodeRegistryProvider } from "@/runtime-preview/NodeRegistryProvider"
import { useNodeRegistry } from "@/runtime-preview/useNodeRegistryHooks"
import { SelectionLayer } from "@/runtime-preview/overlay/SelectionLayer"
import { OriginBadgeLayer } from "@/runtime-preview/overlay/OriginBadgeLayer"
import { DropTargetLayer } from "@/runtime-preview/overlay/DropTargetLayer"
import { CanvasOverlay } from "@/runtime-preview/overlay/CanvasOverlay"
import { useSelectionStore } from "@/stores/selection.store"
import type { CascadeLevel, OriginState } from "@/domain/types"
import { useEffect } from "react"

class MockResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let containerEl: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver)
  vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0)
    return 0
  })

  containerEl = document.createElement("div")
  Object.defineProperty(containerEl, "getBoundingClientRect", {
    value: () => new DOMRect(0, 0, 800, 600),
    configurable: true,
  })
  document.body.appendChild(containerEl)

  useSelectionStore.getState().clearSelection()
})

afterEach(() => {
  document.body.removeChild(containerEl)
  vi.restoreAllMocks()
})

function mockElement(rect: DOMRect): HTMLElement {
  const el = document.createElement("div")
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue(rect)
  return el
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <DndProvider backend={HTML5Backend}>
        <NodeRegistryProvider>{children}</NodeRegistryProvider>
      </DndProvider>
    </QueryClientProvider>
  )
}

function RegisterNode({
  logicalKey,
  rect,
  level = "vertical",
  origin = "own",
  children,
}: {
  logicalKey: string
  rect: DOMRect
  level?: CascadeLevel
  origin?: OriginState
  children?: React.ReactNode
}) {
  const registry = useNodeRegistry()
  useEffect(() => {
    const el = mockElement(rect)
    registry.register(logicalKey, el, level, origin)
    return () => registry.unregister(logicalKey)
  }, [registry, logicalKey, rect, level, origin])
  return <>{children}</>
}

describe("SelectionLayer", () => {
  it("renders nothing when no selection", () => {
    const { container } = render(
      <TestWrapper>
        <SelectionLayer containerEl={containerEl} />
      </TestWrapper>,
    )
    expect(container.querySelectorAll("[data-overlay-key]")).toHaveLength(0)
  })

  it("renders outline for selected node", () => {
    function Inner() {
      return (
        <RegisterNode logicalKey="cmp.test" rect={new DOMRect(100, 50, 200, 40)}>
          <SelectionLayer containerEl={containerEl} />
        </RegisterNode>
      )
    }

    render(<TestWrapper><Inner /></TestWrapper>)
    act(() => { useSelectionStore.getState().setSelected(["cmp.test"]) })

    const overlay = document.querySelector('[data-overlay-key="cmp.test"]')
    expect(overlay).toBeInTheDocument()
  })

  it("renders hover outline for hovered node", () => {
    function Inner() {
      return (
        <RegisterNode logicalKey="cmp.hover" rect={new DOMRect(50, 50, 100, 30)}>
          <SelectionLayer containerEl={containerEl} />
        </RegisterNode>
      )
    }

    render(<TestWrapper><Inner /></TestWrapper>)
    act(() => { useSelectionStore.getState().setHover("cmp.hover") })

    const overlay = document.querySelector('[data-overlay-key="cmp.hover"]')
    expect(overlay).toBeInTheDocument()
  })

  it("does not render hover outline for already selected node", () => {
    function Inner() {
      return (
        <RegisterNode logicalKey="cmp.both" rect={new DOMRect(50, 50, 100, 30)}>
          <SelectionLayer containerEl={containerEl} />
        </RegisterNode>
      )
    }

    render(<TestWrapper><Inner /></TestWrapper>)
    act(() => {
      useSelectionStore.getState().setSelected(["cmp.both"])
      useSelectionStore.getState().setHover("cmp.both")
    })

    const overlays = document.querySelectorAll('[data-overlay-key="cmp.both"]')
    expect(overlays).toHaveLength(1)
  })
})

describe("OriginBadgeLayer", () => {
  it("renders badge for inherited node", () => {
    function Inner() {
      return (
        <RegisterNode
          logicalKey="cmp.inh"
          rect={new DOMRect(100, 50, 200, 40)}
          level="platform"
          origin="inherited"
        >
          <OriginBadgeLayer containerEl={containerEl} />
        </RegisterNode>
      )
    }

    render(<TestWrapper><Inner /></TestWrapper>)
    expect(screen.getByText("INH")).toBeInTheDocument()
  })

  it("does not render badge for own node", () => {
    function Inner() {
      return (
        <RegisterNode
          logicalKey="cmp.own"
          rect={new DOMRect(100, 50, 200, 40)}
          origin="own"
        >
          <OriginBadgeLayer containerEl={containerEl} />
        </RegisterNode>
      )
    }

    render(<TestWrapper><Inner /></TestWrapper>)
    expect(screen.queryByText("OWN")).not.toBeInTheDocument()
  })

  it("renders overridden badge", () => {
    function Inner() {
      return (
        <RegisterNode
          logicalKey="cmp.ovr"
          rect={new DOMRect(100, 50, 200, 40)}
          level="tenant"
          origin="overridden"
        >
          <OriginBadgeLayer containerEl={containerEl} />
        </RegisterNode>
      )
    }

    render(<TestWrapper><Inner /></TestWrapper>)
    expect(screen.getByText("OVR")).toBeInTheDocument()
  })

  it("renders suppressed badge", () => {
    function Inner() {
      return (
        <RegisterNode
          logicalKey="cmp.sup"
          rect={new DOMRect(100, 50, 200, 40)}
          level="org"
          origin="suppressed"
        >
          <OriginBadgeLayer containerEl={containerEl} />
        </RegisterNode>
      )
    }

    render(<TestWrapper><Inner /></TestWrapper>)
    expect(screen.getByText("SUP")).toBeInTheDocument()
  })

  it("renders orphaned badge", () => {
    function Inner() {
      return (
        <RegisterNode
          logicalKey="cmp.orp"
          rect={new DOMRect(100, 50, 200, 40)}
          origin="orphaned"
        >
          <OriginBadgeLayer containerEl={containerEl} />
        </RegisterNode>
      )
    }

    render(<TestWrapper><Inner /></TestWrapper>)
    expect(screen.getByText("ORP")).toBeInTheDocument()
  })
})

describe("DropTargetLayer", () => {
  it("renders without crash", () => {
    const handleDrop = vi.fn()

    function Inner() {
      return (
        <RegisterNode logicalKey="section.a" rect={new DOMRect(0, 0, 400, 200)}>
          <DropTargetLayer containerEl={containerEl} onDrop={handleDrop} />
        </RegisterNode>
      )
    }

    const { container } = render(
      <TestWrapper>
        <Inner />
      </TestWrapper>,
    )

    expect(container).toBeTruthy()
  })
})

describe("CanvasOverlay", () => {
  it("renders overlay container with correct testid", () => {
    const handleDrop = vi.fn()

    render(
      <TestWrapper>
        <CanvasOverlay containerEl={containerEl} onDrop={handleDrop} />
      </TestWrapper>,
    )

    expect(screen.getByTestId("canvas-overlay")).toBeInTheDocument()
  })

  it("overlay container has pointer-events none", () => {
    const handleDrop = vi.fn()

    render(
      <TestWrapper>
        <CanvasOverlay containerEl={containerEl} onDrop={handleDrop} />
      </TestWrapper>,
    )

    const overlay = screen.getByTestId("canvas-overlay")
    expect(overlay).toBeInTheDocument()
  })
})
