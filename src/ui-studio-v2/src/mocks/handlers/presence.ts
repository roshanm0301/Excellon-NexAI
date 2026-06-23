// Phase 4 §6 — MSW handler: Presence (user list + lock acquisition)
import { http, HttpResponse } from "msw"
import { API_BASE_URL } from "@/shared/config"
import { getStore, applyLatency, shouldError } from "@/mocks/store"
import type { Lock } from "@/services/interfaces"

export const presenceHandlers = [
  http.get(`${API_BASE_URL}/presence/:appId`, async () => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const users = Array.from(getStore().presence.values())
    return HttpResponse.json(users)
  }),

  http.post(`${API_BASE_URL}/presence/lock`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as { key: string }
    const store = getStore()

    const existing = store.locks.get(body.key)
    if (existing && new Date(existing.expiresAt) > new Date()) {
      return HttpResponse.json(
        { message: `Lock held by ${existing.heldBy}` },
        { status: 409 },
      )
    }

    const now = new Date()
    const lock: Lock = {
      key: body.key,
      heldBy: "mock-user",
      acquiredAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    }

    store.locks.set(body.key, lock)
    return HttpResponse.json(lock)
  }),
]
