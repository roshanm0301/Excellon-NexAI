import { http, HttpResponse } from "msw"
import { API_BASE_URL } from "@/shared/config"
import { getStore, applyLatency, shouldError } from "@/mocks/store"
import type { VersionEntry, VersionDiffEntry } from "@/domain/types"

export const versioningHandlers = [
  http.get(`${API_BASE_URL}/versioning/:appId/versions`, async () => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const store = getStore()
    const versions: VersionEntry[] = store.publishHistory.map((pr, idx) => ({
      version: idx + 1,
      env: "dev",
      publishedAt: new Date(Date.now() - (store.publishHistory.length - idx) * 3600000).toISOString(),
      publishedBy: "mock-user",
      message: pr.message,
    }))

    return HttpResponse.json(versions)
  }),

  http.post(`${API_BASE_URL}/versioning/:appId/diff`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as { v1: number; v2: number }
    const entries: VersionDiffEntry[] = [
      {
        logicalKey: "dms-app.main-module.vehicle-list",
        kind: "component",
        changeType: "modified",
        before: { props: { columns: 3 } },
        after: { props: { columns: 4 } },
      },
      {
        logicalKey: "dms-app.main-module.customer-form",
        kind: "component",
        changeType: "added",
        before: null,
        after: { props: { fields: ["name", "email"] } },
      },
    ]

    return HttpResponse.json({
      v1: body.v1,
      v2: body.v2,
      entries,
    })
  }),

  http.post(`${API_BASE_URL}/versioning/:appId/promote`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as { fromEnv: string; toEnv: string; version: number }
    const store = getStore()
    const version = store.publishHistory.length + 1
    const result = {
      success: true,
      artifactVersion: version,
      message: `Promoted v${body.version} from ${body.fromEnv} to ${body.toEnv}`,
      issues: [],
    }
    store.publishHistory.push(result)
    return HttpResponse.json(result)
  }),

  http.post(`${API_BASE_URL}/versioning/:appId/rollback`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as { targetVersion: number }
    const store = getStore()

    if (body.targetVersion < 1 || body.targetVersion > store.publishHistory.length) {
      return HttpResponse.json(
        { success: false, artifactVersion: 0, message: "Version not found", issues: [] },
        { status: 404 },
      )
    }

    const version = store.publishHistory.length + 1
    const result = {
      success: true,
      artifactVersion: version,
      message: `Rolled back to v${body.targetVersion}`,
      issues: [],
    }
    store.publishHistory.push(result)
    return HttpResponse.json(result)
  }),
]
