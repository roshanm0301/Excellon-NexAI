import "@testing-library/jest-dom"
import { afterAll, afterEach, beforeAll, vi } from "vitest"
import { MongoMemoryServer } from "mongodb-memory-server"
import { app } from "../server/app"
import { resetStudioData } from "../server/db"
import { connectDB, closeDBConnection } from "../../config/db.js"

let mongoServer: MongoMemoryServer
let originalFetch: typeof globalThis.fetch
let baseUrl = ""
let httpServer: import("node:http").Server

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

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  process.env.MONGO_URI = mongoServer.getUri()

  await connectDB()
  await resetStudioData()

  await new Promise<void>((resolve) => {
    httpServer = app.listen(0, () => {
      const address = httpServer.address()
      if (typeof address === "object" && address && "port" in address) {
        baseUrl = `http://127.0.0.1:${address.port}`
      }
      resolve()
    })
  })

  originalFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const target = typeof input === "string" && input.startsWith("/")
      ? `${baseUrl}${input}`
      : input
    return originalFetch(target as RequestInfo | URL, init)
  }) as typeof globalThis.fetch
})

afterEach(async () => {
  vi.restoreAllMocks()
  await resetStudioData()
})

afterAll(async () => {
  globalThis.fetch = originalFetch

  if (httpServer) {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  await closeDBConnection()

  if (mongoServer) {
    await mongoServer.stop()
  }
})
