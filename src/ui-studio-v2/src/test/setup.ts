import "@testing-library/jest-dom"
import { server } from "@/mocks/server"
import { resetStore } from "@/mocks/store"
import { afterAll, afterEach, beforeAll } from "vitest"

// jsdom polyfills required by Radix/cmdk components (chrome layer)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
if (typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = () => {}
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}

// jsdom reports offsetWidth/offsetHeight as 0 (no layout). @tanstack/react-virtual
// measures the scroll element via offsetWidth/offsetHeight, so without a non-zero
// default it renders an empty window. Override jsdom's zero-getters with a
// viewport-sized default so virtualized lists render a realistic slice in tests.
Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  get() {
    return 600
  },
})
Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  get() {
    return 280
  },
})

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  resetStore()
})
afterAll(() => server.close())
