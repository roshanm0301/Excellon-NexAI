// Phase 4 §5 — DI: all services wired to HTTP clients.
// In dev/test, MSW intercepts the same fetch calls — no separate mock client.
// This keeps the real code path exercised at all times.

import { createMetadataService } from "./http/metadata"
import { createCompilerService } from "./http/compiler"
import { createPreviewService } from "./http/preview"
import { createRegistryService } from "./http/registry"
import { createPresenceService } from "./http/presence"
import { createVersioningService } from "./http/versioning"
import type { Services } from "./interfaces"

export const services: Services = {
  metadata: createMetadataService(),
  compiler: createCompilerService(),
  preview: createPreviewService(),
  registry: createRegistryService(),
  presence: createPresenceService(),
  versioning: createVersioningService(),
}
