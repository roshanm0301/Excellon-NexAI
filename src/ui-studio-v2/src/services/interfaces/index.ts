// Phase 4 §5 — service interfaces barrel + aggregate Services type

export type {
  MetadataService,
  TreeNode,
  GetTreeParams,
  NodeInput,
  OverrideNodeParams,
  CreateAppInput,
  CreatePageInput,
  AppSummary,
} from "./metadata"

export type {
  CompilerService,
  ValidateParams,
  Impact,
  ImpactParams,
  PublishParams,
  PublishResult,
} from "./compiler"

export type {
  PreviewService,
  ResolveParams,
  ResolvedNode,
  ResolvedModel,
} from "./preview"

export type {
  RegistryService,
  RegistryKind,
  RegistryHit,
  TypeShapeField,
  TypeShape,
} from "./registry"

export type {
  PresenceService,
  Unsubscribe,
  PresenceUser,
  Lock,
  PresenceCallback,
} from "./presence"

export type {
  VersioningService,
  PromoteParams,
  RollbackParams,
} from "./versioning"

import type { MetadataService } from "./metadata"
import type { CompilerService } from "./compiler"
import type { PreviewService } from "./preview"
import type { RegistryService } from "./registry"
import type { PresenceService } from "./presence"
import type { VersioningService } from "./versioning"

export interface Services {
  metadata: MetadataService
  compiler: CompilerService
  preview: PreviewService
  registry: RegistryService
  presence: PresenceService
  versioning: VersioningService
}
