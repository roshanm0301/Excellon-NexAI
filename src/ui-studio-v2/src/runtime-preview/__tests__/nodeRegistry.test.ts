// Phase 5 T8.1.2 — unit tests for NodeRegistry (OI-P4-1 spike validation)
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NodeRegistry } from "@/runtime-preview/nodeRegistry"

// jsdom doesn't lay out elements, so getBoundingClientRect returns zeros.
// We mock it per-element to simulate real rects.
function mockRect(el: HTMLElement, rect: DOMRect): void {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue(rect)
}

function createRect(x: number, y: number, w: number, h: number): DOMRect {
  return new DOMRect(x, y, w, h)
}

// The test setup has a stub ResizeObserver. We replace it with one that
// lets us trigger callbacks manually.
let resizeCallbacks: ResizeObserverCallback[] = []
let observedElements: Set<Element>

class MockResizeObserver implements ResizeObserver {
  private cb: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb
    resizeCallbacks.push(cb)
  }
  observe(target: Element) {
    observedElements.add(target)
  }
  unobserve(target: Element) {
    observedElements.delete(target)
  }
  disconnect() {
    observedElements.clear()
  }
}

function fireResize(el: Element) {
  for (const cb of resizeCallbacks) {
    cb(
      [{ target: el } as ResizeObserverEntry],
      null as unknown as ResizeObserver,
    )
  }
}

beforeEach(() => {
  resizeCallbacks = []
  observedElements = new Set()
  vi.stubGlobal("ResizeObserver", MockResizeObserver)
  vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0)
    return 0
  })
})

describe("NodeRegistry", () => {
  it("registers and unregisters nodes", () => {
    const registry = new NodeRegistry()
    const el = document.createElement("div")
    mockRect(el, createRect(10, 20, 100, 50))

    registry.register("node.a", el, "vertical", "own")
    expect(registry.getRect("node.a")).toBeDefined()

    registry.unregister("node.a")
    expect(registry.getRect("node.a")).toBeNull()

    registry.destroy()
  })

  it("notifies subscribers on rect changes", () => {
    const registry = new NodeRegistry()
    const el = document.createElement("div")
    mockRect(el, createRect(0, 0, 100, 100))

    const listener = vi.fn()
    const unsub = registry.subscribe(listener)

    registry.register("node.a", el, "vertical", "inherited")
    expect(listener).toHaveBeenCalled()

    listener.mockClear()

    // Simulate resize → callback fires → rect updates
    mockRect(el, createRect(0, 0, 200, 100))
    fireResize(el)
    expect(listener).toHaveBeenCalled()

    unsub()
    listener.mockClear()

    mockRect(el, createRect(0, 0, 300, 100))
    fireResize(el)
    expect(listener).not.toHaveBeenCalled()

    registry.destroy()
  })

  it("tracks entry metadata (level, origin, visible)", () => {
    const registry = new NodeRegistry()
    const el = document.createElement("div")
    mockRect(el, createRect(5, 10, 200, 80))

    registry.register("node.b", el, "tenant", "overridden")
    const entry = registry.getEntry("node.b")

    expect(entry).not.toBeNull()
    expect(entry?.level).toBe("tenant")
    expect(entry?.origin).toBe("overridden")
    expect(entry?.visible).toBe(true)

    registry.destroy()
  })

  it("getAll returns all registered entries", () => {
    const registry = new NodeRegistry()
    const el1 = document.createElement("div")
    const el2 = document.createElement("div")
    mockRect(el1, createRect(0, 0, 100, 100))
    mockRect(el2, createRect(0, 100, 100, 100))

    registry.register("a", el1, "vertical", "own")
    registry.register("b", el2, "org", "inherited")

    const all = registry.getAll()
    expect(all.size).toBe(2)
    expect(all.has("a")).toBe(true)
    expect(all.has("b")).toBe(true)

    registry.destroy()
  })

  it("re-registering the same key replaces the element", () => {
    const registry = new NodeRegistry()
    const el1 = document.createElement("div")
    const el2 = document.createElement("div")
    mockRect(el1, createRect(0, 0, 100, 100))
    mockRect(el2, createRect(10, 10, 200, 200))

    registry.register("node.x", el1, "vertical", "own")
    registry.register("node.x", el2, "vertical", "own")

    const rect = registry.getRect("node.x")
    expect(rect?.width).toBe(200)

    registry.destroy()
  })

  it("destroy cleans up all state", () => {
    const registry = new NodeRegistry()
    const el = document.createElement("div")
    mockRect(el, createRect(0, 0, 100, 100))

    registry.register("node.z", el, "vertical", "own")
    registry.destroy()

    expect(registry.getAll().size).toBe(0)
    expect(registry.getRect("node.z")).toBeNull()
  })

  it("does not notify when rect is unchanged", () => {
    const registry = new NodeRegistry()
    const el = document.createElement("div")
    const rect = createRect(0, 0, 100, 100)
    mockRect(el, rect)

    registry.register("node.s", el, "vertical", "own")

    const listener = vi.fn()
    registry.subscribe(listener)
    listener.mockClear()

    // Fire resize with same rect
    fireResize(el)
    expect(listener).not.toHaveBeenCalled()

    registry.destroy()
  })

  it("recalculateAll updates all tracked elements", () => {
    const registry = new NodeRegistry()
    const el = document.createElement("div")
    mockRect(el, createRect(0, 0, 100, 100))

    registry.register("node.r", el, "vertical", "own")

    const listener = vi.fn()
    registry.subscribe(listener)
    listener.mockClear()

    mockRect(el, createRect(0, 0, 300, 300))
    registry.recalculateAll()

    expect(listener).toHaveBeenCalled()
    expect(registry.getRect("node.r")?.width).toBe(300)

    registry.destroy()
  })
})
