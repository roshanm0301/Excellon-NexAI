// Phase 4 §5 — PresenceService HTTP implementation (poll-based per OI-P4-3)

import { apiFetch } from "./client"
import { PresenceListResponseSchema, LockSchema } from "@/services/schemas"
import type { PresenceService, Unsubscribe, PresenceCallback } from "@/services/interfaces"

const POLL_INTERVAL_MS = 5000

export function createPresenceService(): PresenceService {
  return {
    subscribe: (appId: string, callback: PresenceCallback): Unsubscribe => {
      let active = true

      const poll = async () => {
        if (!active) return
        try {
          const users = await apiFetch({
            path: `/presence/${encodeURIComponent(appId)}`,
            schema: PresenceListResponseSchema,
          })
          if (active) callback(users)
        } catch {
          // Swallow poll errors — presence is non-critical
        }
      }

      void poll()
      const intervalId = setInterval(() => void poll(), POLL_INTERVAL_MS)

      return () => {
        active = false
        clearInterval(intervalId)
      }
    },

    lock: (key) =>
      apiFetch({
        method: "POST",
        path: "/presence/lock",
        body: { key },
        schema: LockSchema,
      }),
  }
}
