import "@testing-library/jest-dom"
import { server } from "@/mocks/server"
import { resetStore } from "@/mocks/store"
import { afterAll, afterEach, beforeAll } from "vitest"

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  resetStore()
})
afterAll(() => server.close())
