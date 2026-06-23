// Phase 4 §5 / T3.3.1 — apiFetch<T>() wrapper: all API calls go through here
// [L16][L17] Auth token carries verified tenant claim; never client-supplied

import { z } from "zod"
import { API_BASE_URL } from "@/shared/config"

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}`)
    this.name = "ApiError"
  }
}

interface ApiFetchOptions<T> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string
  body?: unknown
  schema: z.ZodType<T>
  signal?: AbortSignal
}

function getAuthToken(): string {
  // [L16] Stubbed for MSW-backed dev; real implementation reads from auth provider.
  // The token carries the verified tenant claim server-side.
  return "dev-token-with-verified-tenant-claim"
}

export async function apiFetch<T>(options: ApiFetchOptions<T>): Promise<T> {
  const { method = "GET", path, body, schema, signal } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAuthToken()}`,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => ({}))
    throw new ApiError(response.status, errorBody)
  }

  const json: unknown = await response.json()
  return schema.parse(json)
}
