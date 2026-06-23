// Phase 4 §5 — CompilerService: validate, impact, publish

import type { CascadeLevel, Env } from "@/domain/types"
import type { Issue } from "@/domain/types"

export interface ValidateParams {
  env: Env
  appId: string
  editingLevel: CascadeLevel
  scopeId: string
}

export interface Impact {
  affectedOems: number
  affectedDealers: number
  orphanedOverrides: number
  brokenBindings: number
  summary: string
}

export interface ImpactParams {
  env: Env
  appId: string
  editingLevel: CascadeLevel
  scopeId: string
}

export interface PublishParams {
  env: Env
  appId: string
  editingLevel: CascadeLevel
  scopeId: string
  targetEnv: Env
}

export interface PublishResult {
  success: boolean
  artifactVersion: number
  message: string
  issues: Issue[]
}

export interface CompilerService {
  validate(params: ValidateParams): Promise<Issue[]>
  impact(params: ImpactParams): Promise<Impact>
  publish(params: PublishParams): Promise<PublishResult>
}
