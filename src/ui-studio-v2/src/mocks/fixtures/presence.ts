// Phase 6 T12.1.1 — seeded collaboration presence + locks.
// Two users: the current dev user ("mock-user", matches x-user-id) and a second
// collaborator holding a node-level lock so concurrent-edit blocking is testable.

import type { PresenceUser, Lock } from "@/services/interfaces"

// The node held by the OTHER user — demonstrates lock-aware editing.
export const LOCKED_NODE_KEY = "cmp.customerName"

export const CURRENT_USER_ID = "mock-user"

export const seedPresenceUsers: PresenceUser[] = [
  {
    userId: CURRENT_USER_ID,
    displayName: "You",
    lockedKeys: [],
    lastSeen: "2024-01-01T00:00:00Z",
  },
  {
    userId: "u-jordan",
    displayName: "Jordan Lee",
    lockedKeys: [LOCKED_NODE_KEY],
    lastSeen: "2024-01-01T00:00:00Z",
  },
]

export const seedLocks: Lock[] = [
  {
    key: LOCKED_NODE_KEY,
    heldBy: "u-jordan",
    acquiredAt: "2024-01-01T00:00:00Z",
    // Far-future expiry so the seeded lock never lapses during a session/test run.
    expiresAt: "2099-01-01T00:00:00Z",
  },
]
