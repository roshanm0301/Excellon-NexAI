import { z } from "zod"
import { EnvSchema } from "./common"
import { IssueSchema } from "./compiler"

export const VersionEntrySchema = z.object({
  version: z.number(),
  env: EnvSchema,
  publishedAt: z.string(),
  publishedBy: z.string(),
  message: z.string(),
})

export const VersionsResponseSchema = z.array(VersionEntrySchema)

export const VersionDiffEntrySchema = z.object({
  logicalKey: z.string(),
  kind: z.string(),
  changeType: z.enum(["added", "removed", "modified"]),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
})

export const VersionDiffSchema = z.object({
  v1: z.number(),
  v2: z.number(),
  entries: z.array(VersionDiffEntrySchema),
})

export const PromoteResultSchema = z.object({
  success: z.boolean(),
  artifactVersion: z.number(),
  message: z.string(),
  issues: z.array(IssueSchema),
})

export const AppSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  vertical: z.string(),
  description: z.string(),
  createdAt: z.string(),
  modifiedAt: z.string(),
})

export const AppsListResponseSchema = z.array(AppSummarySchema)
