import { QueryClient } from "@tanstack/react-query"

// Phase 4 §3.2 — TanStack Query client; server state only, never duplicated in Zustand
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: false,
    },
  },
})
