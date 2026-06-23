// Phase 4 §5 / [L6] — shared Zod schemas for API response validation

import { z } from "zod"

export const CascadeLevelSchema = z.enum(["platform", "vertical", "tenant", "org"])
export const EnvSchema = z.enum(["dev", "staging", "prod"])
export const OriginStateSchema = z.enum([
  "inherited",
  "overridden",
  "own",
  "suppressed",
  "orphaned",
])

export const AuditSchema = z.object({
  createdBy: z.string(),
  createdAt: z.string(),
  modifiedBy: z.string(),
  modifiedAt: z.string(),
})

export const NodeBaseSchema = z.object({
  id: z.string(),
  logicalKey: z.string(),
  cascadeLevel: CascadeLevelSchema,
  overrideOf: z.string().optional(),
  overrideOps: z.array(z.record(z.string(), z.unknown())).optional(),
  objectVersion: z.number(),
  audit: AuditSchema,
  securityRef: z.string().optional(),
})

export const MetaNodeKindSchema = z.enum([
  "application",
  "module",
  "page",
  "view",
  "section",
  "layout",
  "component",
  "dataSource",
  "state",
  "action",
  "event",
  "workflowBinding",
  "navigation",
  "theme",
])
