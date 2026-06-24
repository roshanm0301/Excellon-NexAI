import type { Env } from "@/domain/types"
import type { VersionEntry, VersionDiff } from "@/domain/types"
import type { PublishResult } from "./compiler"

export interface PromoteParams {
  env: Env
  appId: string
  fromEnv: Env
  toEnv: Env
  version: number
}

export interface RollbackParams {
  env: Env
  appId: string
  targetVersion: number
}

export interface VersioningService {
  getVersions(appId: string): Promise<VersionEntry[]>
  getDiff(appId: string, v1: number, v2: number): Promise<VersionDiff>
  promote(params: PromoteParams): Promise<PublishResult>
  rollback(params: RollbackParams): Promise<PublishResult>
}
