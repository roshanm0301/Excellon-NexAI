// Phase 4 §6 — MSW handler: Compiler (validate, impact, publish)
// Runs REAL domain validation — not a stub.
import { http, HttpResponse } from "msw"
import { API_BASE_URL } from "@/shared/config"
import type { MetaNode, ComponentNode } from "@/domain/types"
import { SEMANTIC_CONTRACTS } from "@/domain/types"
import { validateBrokenBindings } from "@/domain/validation"
import { validateOrphans } from "@/domain/validation"
import { validateTypeContracts } from "@/domain/validation"
import { resolveCascade } from "@/domain/cascade"
import type { Issue } from "@/domain/types"
import {
  getStore,
  getNodesForScope,
  applyLatency,
  shouldError,
} from "@/mocks/store"
import { allRegistryKeys } from "@/mocks/fixtures/registry"

function runValidation(scopeId: string): Issue[] {
  const layeredNodes = getNodesForScope(scopeId)
  const { resolved, orphans } = resolveCascade(layeredNodes)

  const metaNodes = resolved.filter((n): n is MetaNode => "kind" in n)
  const components = metaNodes.filter((n): n is ComponentNode => n.kind === "component")

  const brokenBindings = validateBrokenBindings(metaNodes, allRegistryKeys)
  const orphanIssues = validateOrphans(resolved)
  const contractIssues = validateTypeContracts(components, SEMANTIC_CONTRACTS)

  return [...orphans, ...brokenBindings, ...orphanIssues, ...contractIssues]
}

export const compilerHandlers = [
  http.post(`${API_BASE_URL}/compiler/validate`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as { scopeId?: string }
    const scopeId = body.scopeId ?? "automotive"
    const issues = runValidation(scopeId)
    return HttpResponse.json(issues)
  }),

  http.post(`${API_BASE_URL}/compiler/impact`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as { scopeId?: string }
    const scopeId = body.scopeId ?? "automotive"
    const issues = runValidation(scopeId)

    const brokenBindings = issues.filter((i) => i.type === "broken-binding").length
    const orphanedOverrides = issues.filter((i) => i.type === "orphaned-override").length

    return HttpResponse.json({
      affectedOems: 1,
      affectedDealers: 1,
      orphanedOverrides,
      brokenBindings,
      summary: `${issues.length} issues found`,
    })
  }),

  http.post(`${API_BASE_URL}/compiler/publish`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const body = (await request.json()) as { scopeId?: string }
    const scopeId = body.scopeId ?? "automotive"
    const issues = runValidation(scopeId)

    const hasErrors = issues.some((i) => i.severity === "error")
    const result = {
      success: !hasErrors,
      artifactVersion: getStore().publishHistory.length + 1,
      message: hasErrors ? "Publish blocked: errors found" : "Published successfully",
      issues,
    }

    if (!hasErrors) {
      getStore().publishHistory.push(result)
    }

    return HttpResponse.json(result, { status: hasErrors ? 422 : 200 })
  }),
]
