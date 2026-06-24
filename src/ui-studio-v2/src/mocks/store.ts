// Phase 4 §6 — MSW in-memory mutable store
// Keyed structures for all mock domains. Test defaults: no latency, no errors.

import type { NodeBase, CascadeLevel } from "@/domain/types"
import type { MetaNode } from "@/domain/types"
import type { RegistryHit, TypeShape, PresenceUser, Lock } from "@/services/interfaces"
import type { PublishResult } from "@/services/interfaces"
import type { ScopeEntry } from "@/mocks/fixtures/dms-app"
import {
  verticalNodes,
  tenantNodes,
  orgNodes,
  SCOPE_MAP,
} from "@/mocks/fixtures/dms-app"
import { registryHits, typeShapes } from "@/mocks/fixtures/registry"

export interface MockConfig {
  latencyMs: number
  errorRate: number
  forceError: string | null
}

export interface MockStore {
  nodes: Map<string, NodeBase>
  registry: RegistryHit[]
  shapes: Map<string, TypeShape>
  presence: Map<string, PresenceUser>
  locks: Map<string, Lock>
  publishHistory: PublishResult[]
  config: MockConfig
  scopeMap: Record<string, ScopeEntry>
}

function nodeKey(logicalKey: string, level: CascadeLevel): string {
  return `${logicalKey}:${level}`
}

function buildInitialStore(): MockStore {
  const nodes = new Map<string, NodeBase>()

  for (const node of verticalNodes) {
    nodes.set(nodeKey(node.logicalKey, node.cascadeLevel), node)
  }
  for (const node of tenantNodes) {
    nodes.set(nodeKey(node.logicalKey, node.cascadeLevel), node)
  }
  for (const node of orgNodes) {
    nodes.set(nodeKey(node.logicalKey, node.cascadeLevel), node)
  }

  return {
    nodes,
    registry: [...registryHits],
    shapes: new Map(typeShapes),
    presence: new Map(),
    locks: new Map(),
    publishHistory: [],
    config: {
      latencyMs: 0,
      errorRate: 0,
      forceError: null,
    },
    scopeMap: { ...SCOPE_MAP },
  }
}

let store = buildInitialStore()

export function getStore(): MockStore {
  return store
}

export function resetStore(): void {
  store = buildInitialStore()
}

export function getNodesForScope(scopeId: string): Map<CascadeLevel, NodeBase[]> {
  const result = new Map<CascadeLevel, NodeBase[]>()
  const entry = store.scopeMap[scopeId]
  if (!entry) return result

  const relevantScopes = [...entry.parentScopes, scopeId]

  for (const [, node] of store.nodes) {
    const scopeForLevel = findScopeForLevel(node.cascadeLevel, relevantScopes)
    if (scopeForLevel !== null) {
      const existing = result.get(node.cascadeLevel)
      if (existing) {
        existing.push(node)
      } else {
        result.set(node.cascadeLevel, [node])
      }
    }
  }

  return result
}

function findScopeForLevel(
  level: CascadeLevel,
  relevantScopes: string[],
): string | null {
  const { scopeMap } = store
  for (const s of relevantScopes) {
    const entry = scopeMap[s]
    if (entry && entry.level === level) return s
  }
  return null
}

export function getNodeById(id: string): NodeBase | undefined {
  for (const [, node] of store.nodes) {
    if (node.id === id || node.logicalKey === id) return node
  }
  return undefined
}

export function getAllMetaNodes(): MetaNode[] {
  const result: MetaNode[] = []
  for (const [, node] of store.nodes) {
    if ("kind" in node) {
      result.push(node as MetaNode)
    }
  }
  return result
}

export function addNode(node: NodeBase): void {
  store.nodes.set(nodeKey(node.logicalKey, node.cascadeLevel), node)
}

export async function applyLatency(): Promise<void> {
  if (store.config.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, store.config.latencyMs))
  }
}

export function shouldError(): boolean {
  if (store.config.forceError) return true
  if (store.config.errorRate > 0) return Math.random() < store.config.errorRate
  return false
}
