// Phase 4 §5 / [L6] — Zod schemas for CompilerService responses

import { z } from "zod"
import { CascadeLevelSchema } from "./common"

export const IssueSchema = z.object({
  type: z.enum([
    "broken-binding",
    "orphaned-override",
    "contract-violation",
    "out-of-scope-binding",
  ]),
  severity: z.enum(["error", "warning"]),
  nodeId: z.string(),
  path: z.string(),
  message: z.string(),
  cascade: CascadeLevelSchema.optional(),
})

export const ValidateResponseSchema = z.array(IssueSchema)

export const ImpactResponseSchema = z.object({
  affectedOems: z.number(),
  affectedDealers: z.number(),
  orphanedOverrides: z.number(),
  brokenBindings: z.number(),
  summary: z.string(),
})

export const PublishResultSchema = z.object({
  success: z.boolean(),
  artifactVersion: z.number(),
  message: z.string(),
  issues: z.array(IssueSchema),
})
