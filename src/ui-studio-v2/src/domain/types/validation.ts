// Phase 5 T2.3.1 — Issue type for client-side validation results

import type { CascadeLevel } from "./base"

export type IssueType =
  | "broken-binding"
  | "orphaned-override"
  | "contract-violation"
  | "out-of-scope-binding"

export type IssueSeverity = "error" | "warning"

export interface Issue {
  type: IssueType
  severity: IssueSeverity
  nodeId: string
  path: string
  message: string
  cascade?: CascadeLevel
}
