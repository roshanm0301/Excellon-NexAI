// Phase 4 §5 — PresenceService: collaboration presence + node-level locks

export type Unsubscribe = () => void

export interface PresenceUser {
  userId: string
  displayName: string
  avatar?: string
  lockedKeys: string[]
  lastSeen: string
}

export interface Lock {
  key: string
  heldBy: string
  acquiredAt: string
  expiresAt: string
}

export type PresenceCallback = (users: PresenceUser[]) => void

export interface PresenceService {
  subscribe(appId: string, callback: PresenceCallback): Unsubscribe
  lock(key: string): Promise<Lock>
}
