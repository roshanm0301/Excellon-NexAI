import { describe, it, expect } from "vitest"
import {
  getStore,
  resetStore,
  getNodesForScope,
  getNodeById,
  addNode,
  applyLatency,
  shouldError,
} from "@/mocks/store"
import type { NodeBase } from "@/domain/types"

describe("MockStore", () => {
  it("initializes with seeded nodes", () => {
    const store = getStore()
    expect(store.nodes.size).toBeGreaterThan(0)
    expect(store.registry.length).toBeGreaterThan(0)
    expect(store.shapes.size).toBeGreaterThan(0)
  })

  it("getNodesForScope returns nodes for automotive scope", () => {
    const nodes = getNodesForScope("automotive")
    expect(nodes.has("vertical")).toBe(true)
    const verticalNodes = nodes.get("vertical")!
    expect(verticalNodes.length).toBeGreaterThan(0)
  })

  it("getNodesForScope returns multi-level nodes for toyota scope", () => {
    const nodes = getNodesForScope("toyota")
    expect(nodes.has("vertical")).toBe(true)
    expect(nodes.has("tenant")).toBe(true)
  })

  it("getNodesForScope returns all levels for dealer-x", () => {
    const nodes = getNodesForScope("dealer-x")
    expect(nodes.has("vertical")).toBe(true)
    expect(nodes.has("tenant")).toBe(true)
    expect(nodes.has("org")).toBe(true)
  })

  it("getNodeById finds a seeded node", () => {
    const node = getNodeById("uuid-app-001")
    expect(node).toBeDefined()
    expect(node!.logicalKey).toBe("app.dms")
  })

  it("addNode adds to store and is retrievable", () => {
    const newNode: NodeBase = {
      id: "uuid-test-new",
      logicalKey: "test.new",
      cascadeLevel: "vertical",
      objectVersion: 1,
      audit: {
        createdBy: "test",
        createdAt: "2024-01-01T00:00:00Z",
        modifiedBy: "test",
        modifiedAt: "2024-01-01T00:00:00Z",
      },
    }
    addNode(newNode)
    expect(getNodeById("uuid-test-new")).toBeDefined()
  })

  it("resetStore restores initial state", () => {
    const store = getStore()
    store.config.latencyMs = 999
    store.publishHistory.push({
      success: true,
      artifactVersion: 99,
      message: "test",
      issues: [],
    })

    resetStore()

    const fresh = getStore()
    expect(fresh.config.latencyMs).toBe(0)
    expect(fresh.publishHistory).toHaveLength(0)
  })

  it("latency toggle works", async () => {
    const store = getStore()
    store.config.latencyMs = 0
    const start = Date.now()
    await applyLatency()
    expect(Date.now() - start).toBeLessThan(50)
  })

  it("error toggle: forceError causes shouldError to return true", () => {
    const store = getStore()
    store.config.forceError = "test"
    expect(shouldError()).toBe(true)
    store.config.forceError = null
  })

  it("error toggle: errorRate 0 returns false", () => {
    const store = getStore()
    store.config.errorRate = 0
    store.config.forceError = null
    expect(shouldError()).toBe(false)
  })
})
