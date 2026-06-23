import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Providers } from "@/app/providers"
import "@/index.css"

// Phase 5 T1.1.3 — entry point; MSW started inside Providers once mocks exist (Prompt 03)
const rootEl = document.getElementById("root")
if (!rootEl) throw new Error("Root element #root not found")

createRoot(rootEl).render(
  <StrictMode>
    <Providers />
  </StrictMode>,
)
