import { Outlet } from "@tanstack/react-router"

// Phase 5 T1.1.1 — root layout component; rendered by routes/__root.tsx
// Shell panels (E5) slot in here in Prompt 05
export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  )
}
