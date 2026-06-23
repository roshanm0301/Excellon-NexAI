// Phase 4 §5 / [L6] — Zod schemas for PresenceService responses

import { z } from "zod"

export const PresenceUserSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatar: z.string().optional(),
  lockedKeys: z.array(z.string()),
  lastSeen: z.string(),
})

export const PresenceListResponseSchema = z.array(PresenceUserSchema)

export const LockSchema = z.object({
  key: z.string(),
  heldBy: z.string(),
  acquiredAt: z.string(),
  expiresAt: z.string(),
})
