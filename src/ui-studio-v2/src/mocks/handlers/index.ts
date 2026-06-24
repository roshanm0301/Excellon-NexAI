// Phase 4 §6 — MSW handler aggregation
import { metadataHandlers } from "./metadata"
import { compilerHandlers } from "./compiler"
import { previewHandlers } from "./preview"
import { registryHandlers } from "./registry"
import { presenceHandlers } from "./presence"
import { versioningHandlers } from "./versioning"

export const handlers = [
  ...metadataHandlers,
  ...compilerHandlers,
  ...previewHandlers,
  ...registryHandlers,
  ...presenceHandlers,
  ...versioningHandlers,
]
