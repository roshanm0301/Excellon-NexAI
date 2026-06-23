// Phase 4 §6 — MSW browser worker for dev mode
import { setupWorker } from "msw/browser"
import { handlers } from "./handlers"

export const worker = setupWorker(...handlers)
