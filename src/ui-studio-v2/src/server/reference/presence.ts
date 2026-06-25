import type { PresenceUser, Lock } from "../../services/interfaces"

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
    expiresAt: "2099-01-01T00:00:00Z",
  },
]
