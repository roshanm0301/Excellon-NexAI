import type { Env } from "./base"

export interface VersionEntry {
  version: number
  env: Env
  publishedAt: string
  publishedBy: string
  message: string
}

export interface VersionDiffEntry {
  logicalKey: string
  kind: string
  changeType: "added" | "removed" | "modified"
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

export interface VersionDiff {
  v1: number
  v2: number
  entries: VersionDiffEntry[]
}
