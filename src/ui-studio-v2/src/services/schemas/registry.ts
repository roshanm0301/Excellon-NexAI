// Phase 4 §5 / [L6] — Zod schemas for RegistryService responses

import { z } from "zod"

export const RegistryHitSchema = z.object({
  ref: z.string(),
  kind: z.enum(["entity", "relationship", "rule", "workflow", "connector"]),
  name: z.string(),
  description: z.string().optional(),
})

export const SearchResponseSchema = z.array(RegistryHitSchema)

export const TypeShapeFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string().optional(),
})

export const TypeShapeSchema = z.object({
  ref: z.string(),
  fields: z.array(TypeShapeFieldSchema),
})
