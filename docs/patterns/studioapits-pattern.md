# Pattern: studioApi.ts — API Client

> Canonical reference for GitHub Copilot. Read this before adding any new API functions.

## What This Pattern Is

`src/react/src/config/studioApi.ts` is the **only file in the React app that calls `fetch()`**. Every HTTP call from every component and hook must go through the `studioFetch<T>()` wrapper defined here.

## File Location

```
src/react/src/config/studioApi.ts
```

## The studioFetch Wrapper

```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// Dev-mode headers — no auth in initial build
const DEV_HEADERS: Record<string, string> = {
  'x-tenant-id': import.meta.env.VITE_TENANT_ID ?? '00000000-0000-0000-0000-000000000001',
  'x-user-id':   import.meta.env.VITE_USER_ID   ?? '00000000-0000-0000-0000-000000000001',
  'x-role':      import.meta.env.VITE_ROLE       ?? 'admin',
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function studioFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...DEV_HEADERS,
    ...((options.headers as Record<string, string>) ?? {}),
  }
  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    let body: unknown
    try { body = await res.json() } catch { body = await res.text() }
    throw new ApiError(res.status, `${options.method ?? 'GET'} ${path} → ${res.status}`, body)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
```

Key points:
- `BASE_URL` defaults to `/api` — the Go server mounts all routes under `/api/v1`. The Vite proxy maps `/api` to the Go backend during development.
- Dev-mode tenant/user/role headers are injected automatically into every request. Do not add them manually in API functions.
- Non-2xx responses throw `ApiError` with `status`, `message`, and the parsed `body`.
- HTTP 204 returns `undefined as T` — use `studioFetch<void>` for DELETE endpoints.

## Naming Convention

Functions follow the pattern **verb + resource**:

| Verb | Meaning |
|------|---------|
| `list` | GET collection |
| `get` | GET single record |
| `create` | POST new record |
| `save` / `update` | PUT/PATCH existing record |
| `publish` | POST action |
| `deprecate` | POST action |
| `fork` | POST action |
| `delete` | DELETE |

Examples: `listArtifacts`, `getArtifact`, `createArtifact`, `saveArtifact`, `publishArtifact`, `deleteArtifact`

## Interface Naming Convention

TypeScript interfaces mirror Go struct names exactly (PascalCase matching the Go backend type):

```ts
// Go:   type ArtifactVersion struct { ... }
// TS:   interface Artifact { ... }          ← shorter alias acceptable

// Go:   type ArtifactListResponse struct { Items []ArtifactVersion; Total int }
// TS:   interface ArtifactListResponse { items: Artifact[]; total: number }
```

JSON field names are snake_case (matching Go json tags).

## 3 Example Functions from the File

### 1. List with optional query parameters

```ts
export interface ArtifactListResponse {
  items: Artifact[]
  total: number
  next_cursor?: string
}

export const listArtifacts = (params?: { entity_type?: string; status?: string; cursor?: string }) =>
  studioFetch<ArtifactListResponse>(
    `/v1/artifacts?${new URLSearchParams(params as Record<string, string>).toString()}`
  )
```

### 2. Create with typed request body

```ts
export const createArtifact = (body: { entity_type: string; payload?: Record<string, unknown> }) =>
  studioFetch<Artifact>('/v1/artifacts', { method: 'POST', body: JSON.stringify(body) })
```

### 3. Action endpoint (no request body)

```ts
export const publishArtifact = (id: string) =>
  studioFetch<Artifact>(`/v1/artifacts/${id}/publish`, { method: 'POST' })
```

## How to Add a New API Group

1. Add a section comment: `// ── My Resource API ──────────────`
2. Define TypeScript interfaces for request/response shapes (PascalCase, snake_case fields)
3. Export arrow functions using `studioFetch<ReturnType>(path, options)`
4. Follow the verb + resource naming convention

```ts
// ── Widget API ────────────────────────────────────────────────────────────────

export interface Widget {
  id: string
  tenant_id: string
  name: string
  created_at: string
  updated_at: string
}

export const listWidgets = () =>
  studioFetch<{ items: Widget[] }>('/v1/widgets')

export const getWidget = (id: string) =>
  studioFetch<Widget>(`/v1/widgets/${id}`)

export const createWidget = (body: { name: string }) =>
  studioFetch<Widget>('/v1/widgets', { method: 'POST', body: JSON.stringify(body) })

export const deleteWidget = (id: string) =>
  studioFetch<void>(`/v1/widgets/${id}`, { method: 'DELETE' })
```

## What Copilot CAN Replicate

- New API function groups following this exact shape
- New interface definitions mirroring Go struct field names
- Adding query parameters via `URLSearchParams`

## What Copilot Must NOT Do

- Do NOT call `fetch()` directly anywhere other than inside `studioFetch`
- Do NOT hardcode tenant IDs, user IDs, or role values in API functions
- Do NOT duplicate `DEV_HEADERS` or `BASE_URL` in other files
- Do NOT add error handling logic inside individual API functions — `studioFetch` handles it centrally
- Do NOT add auth token logic — there is no JWT in this build
