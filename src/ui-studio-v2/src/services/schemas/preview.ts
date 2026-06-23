// Phase 4 §5 / [L6] — Zod schemas for PreviewService responses

import { z } from "zod"
import { CascadeLevelSchema, MetaNodeKindSchema, OriginStateSchema } from "./common"

export const ResolvedNodeSchema = z.object({
  logicalKey: z.string(),
  kind: MetaNodeKindSchema,
  cascadeLevel: CascadeLevelSchema,
  originState: OriginStateSchema,
  data: z.record(z.string(), z.unknown()),
})

export const ResolvedModelSchema = z.object({
  pageId: z.string(),
  scopeId: z.string(),
  nodes: z.array(ResolvedNodeSchema),
})
