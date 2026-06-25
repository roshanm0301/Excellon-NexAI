// Phase 6 T12.1.1 — presence subscription + lock derivation.
// Subscribes to the poll-based PresenceService and exposes the live user list
// plus a map of nodes locked by OTHER users (drives lock-aware editing).

import { useEffect, useMemo, useState } from "react"
import { services } from "@/services"
import type { PresenceUser } from "@/services/interfaces"

// Dev identity — matches the x-user-id header trusted by the mock backend.
export const CURRENT_USER_ID = "mock-user"

export interface PresenceResult {
  users: PresenceUser[]
  /** node logicalKey → the user holding it, for every lock NOT held by the current user. */
  lockedByOthers: Map<string, PresenceUser>
}

export function usePresence(appId: string): PresenceResult {
  const [users, setUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!appId) return
    const unsubscribe = services.presence.subscribe(appId, setUsers)
    return unsubscribe
  }, [appId])

  const lockedByOthers = useMemo(() => {
    const map = new Map<string, PresenceUser>()
    for (const user of users) {
      if (user.userId === CURRENT_USER_ID) continue
      for (const key of user.lockedKeys) {
        map.set(key, user)
      }
    }
    return map
  }, [users])

  return { users, lockedByOthers }
}
