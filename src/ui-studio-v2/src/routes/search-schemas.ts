// Phase 4 §4 — route search-param Zod schemas
import { z } from "zod"

export const editorAppSearchSchema = z.object({
  env: z.enum(["dev", "staging", "prod"]).optional().default("dev"),
  editingLevel: z
    .enum(["platform", "vertical", "tenant", "org"])
    .optional()
    .default("platform"),
  scopeId: z.string().optional().default(""),
  previewScopeId: z.string().optional().default(""),
})

export const editorPageSearchSchema = editorAppSearchSchema.extend({
  selection: z.array(z.string()).optional().default([]),
})

export const homeSearchSchema = z.object({
  env: z.enum(["dev", "staging", "prod"]).optional().default("dev"),
})

export type EditorAppSearch = z.infer<typeof editorAppSearchSchema>
export type EditorPageSearch = z.infer<typeof editorPageSearchSchema>
export type HomeSearch = z.infer<typeof homeSearchSchema>
