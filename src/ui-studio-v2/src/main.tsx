import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Providers } from "@/app/providers"
import "@/index.css"

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import("@/mocks/browser")
    await worker.start({ onUnhandledRequest: "bypass" })
  }

  const rootEl = document.getElementById("root")
  if (!rootEl) throw new Error("Root element #root not found")

  createRoot(rootEl).render(
    <StrictMode>
      <Providers />
    </StrictMode>,
  )
}

void bootstrap()
