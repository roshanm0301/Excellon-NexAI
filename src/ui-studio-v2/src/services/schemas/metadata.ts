// Phase 4 §5 / [L6] — Zod schemas for MetadataService responses

import { z } from "zod"
import {
  CascadeLevelSchema,
  OriginStateSchema,
  NodeBaseSchema,
  MetaNodeKindSchema,
} from "./common"

export const TreeNodeSchema: z.ZodType<{
  id: string
  logicalKey: string
  kind: string
  label: string
  cascadeLevel: string
  originState: string
  parentKey: string | null
  children: unknown[]
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    logicalKey: z.string(),
    kind: MetaNodeKindSchema,
    label: z.string(),
    cascadeLevel: CascadeLevelSchema,
    originState: OriginStateSchema,
    parentKey: z.string().nullable(),
    children: z.array(TreeNodeSchema),
  }),
)

export const GetTreeResponseSchema = z.array(TreeNodeSchema)

export const MetaNodeResponseSchema = NodeBaseSchema.extend({
  kind: MetaNodeKindSchema,
}).passthrough()
