// Phase 4 §6 — MSW Node server for Vitest
import { setupServer } from "msw/node"
import { handlers } from "./handlers"

export const server = setupServer(...handlers)
