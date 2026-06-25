import express from "express"
import type { CascadeLevel, MetaNode, NodeBase } from "../domain/types"
import { resolveCascade } from "../domain/cascade"
import { registryHits, typeShapes } from "./reference/registry"
import { CURRENT_USER_ID, seedPresenceUsers } from "./reference/presence"
import {
  ensureSeedData,
  listApps,
  createApp,
  getLayeredNodes,
  getNodeByIdOrLogicalKey,
  createNode,
  createPage,
  createOverrideNode,
  computePublishResult,
  listVersions,
  getVersion,
  createVersion,
  snapshotAppNodes,
  listLocks,
  upsertLock,
} from "./db"
import { buildTreeNodes, buildResolvedModel, diffSnapshots, runValidationForNodes } from "./state"

export const app = express()

app.use(express.json())

app.use(async (_req, _res, next) => {
  try {
    await ensureSeedData()
    next()
  } catch (error) {
    next(error)
  }
})

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ui-studio-v2-api",
    environment: process.env.NODE_ENV || "development",
  })
})

app.get("/api/v1/metadata/apps", async (_req, res, next) => {
  try {
    res.json(await listApps())
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/metadata/apps", async (req, res, next) => {
  try {
    const created = await createApp(req.body)
    res.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

app.get("/api/v1/metadata/tree", async (req, res, next) => {
  try {
    const scopeId = String(req.query.scopeId ?? "")
    const appId = String(req.query.appId ?? "app.dms")
    const editingLevel = String(req.query.editingLevel ?? "vertical") as CascadeLevel
    const layeredNodes = await getLayeredNodes(appId, scopeId)
    const allNodes: NodeBase[] = []
    for (const [, nodes] of layeredNodes) {
      allNodes.push(...nodes)
    }
    res.json(buildTreeNodes(allNodes, editingLevel))
  } catch (error) {
    next(error)
  }
})

app.get("/api/v1/metadata/nodes/:id", async (req, res, next) => {
  try {
    const node = await getNodeByIdOrLogicalKey(req.params.id)
    if (!node) {
      res.status(404).json({ message: "Not found" })
      return
    }
    res.json(node)
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/metadata/nodes", async (req, res, next) => {
  try {
    const appId = String(req.body.appId ?? "app.dms")
    const node = await createNode(appId, req.body)
    res.status(201).json(node)
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/metadata/pages", async (req, res, next) => {
  try {
    const page = await createPage(req.body)
    res.status(201).json(page)
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/metadata/nodes/:logicalKey/override", async (req, res, next) => {
  try {
    const appId = String(req.body.appId ?? "app.dms")
    const overrideNode = await createOverrideNode(
      appId,
      req.params.logicalKey,
      req.body.level as CascadeLevel,
      req.body.ops ?? [],
    )
    const existing = await getNodeByIdOrLogicalKey(req.params.logicalKey)
    res.status(201).json(existing ? { ...existing, ...overrideNode } : overrideNode)
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/preview/resolve", async (req, res, next) => {
  try {
    const appId = String(req.body.appId ?? "app.dms")
    const pageId = String(req.body.pageId ?? "")
    const previewScopeId = String(req.body.previewScopeId ?? "automotive")
    const editingLevel = String(req.body.editingLevel ?? "vertical") as CascadeLevel
    const layeredNodes = await getLayeredNodes(appId, previewScopeId)
    const { resolved } = resolveCascade(layeredNodes)
    res.json(buildResolvedModel(resolved, pageId, previewScopeId, editingLevel))
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/compiler/validate", async (req, res, next) => {
  try {
    const appId = String(req.body.appId ?? "app.dms")
    const scopeId = String(req.body.scopeId ?? "automotive")
    const layeredNodes = await getLayeredNodes(appId, scopeId)
    res.json(runValidationForNodes(layeredNodes))
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/compiler/impact", async (req, res, next) => {
  try {
    const appId = String(req.body.appId ?? "app.dms")
    const scopeId = String(req.body.scopeId ?? "automotive")
    const layeredNodes = await getLayeredNodes(appId, scopeId)
    const issues = runValidationForNodes(layeredNodes)
    res.json({
      affectedOems: 1,
      affectedDealers: 1,
      orphanedOverrides: issues.filter((issue) => issue.type === "orphaned-override").length,
      brokenBindings: issues.filter((issue) => issue.type === "broken-binding").length,
      summary: `${issues.length} issues found`,
    })
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/compiler/publish", async (req, res, next) => {
  try {
    const appId = String(req.body.appId ?? "app.dms")
    const targetEnv = String(req.body.targetEnv ?? "dev")
    const scopeId = String(req.body.scopeId ?? "automotive")
    const result = await computePublishResult(appId, targetEnv, scopeId)
    res.status(result.success ? 200 : 422).json(result)
  } catch (error) {
    next(error)
  }
})

app.get("/api/v1/versioning/:appId/versions", async (req, res, next) => {
  try {
    const versions = await listVersions(req.params.appId)
    res.json(
      versions.map((version) => ({
        version: version.version,
        env: version.env,
        publishedAt: version.publishedAt,
        publishedBy: version.publishedBy,
        message: version.message,
      })),
    )
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/versioning/:appId/diff", async (req, res, next) => {
  try {
    const first = await getVersion(req.params.appId, Number(req.body.v1))
    const second = await getVersion(req.params.appId, Number(req.body.v2))
    if (!first || !second) {
      res.status(404).json({ message: "Version not found" })
      return
    }
    res.json({
      v1: Number(req.body.v1),
      v2: Number(req.body.v2),
      entries: diffSnapshots(first.snapshot as NodeBase[], second.snapshot as NodeBase[]),
    })
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/versioning/:appId/promote", async (req, res, next) => {
  try {
    const version = await getVersion(req.params.appId, Number(req.body.version))
    const snapshot = version ? (version.snapshot as NodeBase[]) : await snapshotAppNodes(req.params.appId)
    const result = await createVersion(
      req.params.appId,
      String(req.body.toEnv ?? "staging"),
      `Promoted v${req.body.version} from ${req.body.fromEnv} to ${req.body.toEnv}`,
      [],
      snapshot,
    )
    res.json(result)
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/versioning/:appId/rollback", async (req, res, next) => {
  try {
    const target = await getVersion(req.params.appId, Number(req.body.targetVersion))
    if (!target) {
      res.status(404).json({
        success: false,
        artifactVersion: 0,
        message: "Version not found",
        issues: [],
      })
      return
    }
    const result = await createVersion(
      req.params.appId,
      String(req.body.env ?? "dev"),
      `Rolled back to v${req.body.targetVersion}`,
      [],
      target.snapshot as NodeBase[],
    )
    res.json(result)
  } catch (error) {
    next(error)
  }
})

app.get("/api/v1/presence/:appId", async (_req, res, next) => {
  try {
    const activeLocks = (await listLocks()).filter((lock) => new Date(lock.expiresAt) > new Date())
    const users = seedPresenceUsers.map((user) => ({
      ...user,
      lockedKeys: activeLocks.filter((lock) => lock.heldBy === user.userId).map((lock) => lock.key),
      lastSeen: new Date().toISOString(),
    }))
    res.json(users)
  } catch (error) {
    next(error)
  }
})

app.post("/api/v1/presence/lock", async (req, res, next) => {
  try {
    const existingLocks = await listLocks()
    const existing = existingLocks.find((lock) => lock.key === req.body.key)
    if (existing && new Date(existing.expiresAt) > new Date()) {
      res.status(409).json({ message: `Lock held by ${existing.heldBy}` })
      return
    }

    const now = new Date()
    const lock = {
      key: String(req.body.key),
      heldBy: CURRENT_USER_ID,
      acquiredAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    }
    await upsertLock(lock)
    res.json(lock)
  } catch (error) {
    next(error)
  }
})

app.get("/api/v1/registry/search", (req, res) => {
  const query = String(req.query.q ?? "").toLowerCase()
  if (!query) {
    res.json(registryHits)
    return
  }

  const filtered = registryHits.filter((hit) =>
    hit.ref.toLowerCase().includes(query)
    || hit.name.toLowerCase().includes(query)
    || (hit.description?.toLowerCase().includes(query) ?? false),
  )
  res.json(filtered)
})

app.get("/api/v1/registry/shape/:ref", (req, res) => {
  const shape = typeShapes.get(req.params.ref)
  if (!shape) {
    res.status(404).json({ message: `Shape not found: ${req.params.ref}` })
    return
  }
  res.json(shape)
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
})

app.use((error: { statusCode?: number; message?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled server error:", error)
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
  })
})
