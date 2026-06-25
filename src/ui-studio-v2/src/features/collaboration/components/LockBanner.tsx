// Phase 6 T12.1.1 — banner shown when the selected node is locked by another user.

import { Lock } from "lucide-react"

interface LockBannerProps {
  displayName: string
}

export function LockBanner({ displayName }: LockBannerProps) {
  return (
    <div
      role="status"
      aria-label={`Locked by ${displayName}`}
      className="flex items-center gap-2 border-b border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700"
    >
      <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        Locked by <span className="font-medium">{displayName}</span> — editing is disabled
      </span>
    </div>
  )
}
