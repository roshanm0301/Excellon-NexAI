import { Router } from "express"
import App from "../models/App.js"
import MetaNode from "../models/MetaNode.js"
import { toCamelCase } from "../utils/stringUtils.js"
import { buildPageScaffold } from "../utils/pageScaffold.js"

const router = Router()

// GET /api/v1/metadata/apps
router.get("/apps", async (_req, res) => {
  try {
    const apps = await App.find({})
    res.json(apps)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/v1/metadata/apps
router.post("/apps", async (req, res) => {
  try {
    const { name, vertical, description = "" } = req.body
    const now = new Date().toISOString()
    const id = `app-${Date.now()}`

    const app = await App.create({ id, name, vertical, description, createdAt: now, modifiedAt: now })

    await MetaNode.create({
      id,
      logicalKey: id,
      cascadeLevel: "vertical",
      objectVersion: 1,
      audit: { createdBy: "system", createdAt: now, modifiedBy: "system", modifiedAt: now },
      kind: "application",
      name,
      children: [],
    })

    res.status(201).json(app)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/v1/metadata/tree
router.get("/tree", async (req, res) => {
  try {
    const { editingLevel = "vertical" } = req.query
    const nodes = await MetaNode.find({})

    const byKey = new Map()
    for (const n of nodes) {
      byKey.set(n.logicalKey, n.toJSON())
    }

    const treeNodes = []
    for (const n of nodes) {
      const node = n.toJSON()
      treeNodes.push({
        id: node.id,
        logicalKey: node.logicalKey,
        kind: node.kind ?? "unknown",
        label: node.name ?? node.title ?? node.logicalKey,
        cascadeLevel: node.cascadeLevel,
        originState: node.cascadeLevel === editingLevel ? "own" : node.cascadeLevel === "vertical" ? "inherited" : "overridden",
        parentKey: null,
        children: [],
      })
    }

    res.json(buildHierarchy(treeNodes))
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

function buildHierarchy(flat) {
  const byKey = new Map()
  for (const n of flat) byKey.set(n.logicalKey, n)

  const roots = []
  for (const node of flat) {
    const parts = node.logicalKey.split(".")
    if (parts.length <= 1) {
      roots.push(node)
      continue
    }

    let placed = false
    for (let i = parts.length - 1; i > 0; i--) {
      const parentKey = parts.slice(0, i).join(".")
      const parent = byKey.get(parentKey)
      if (parent) {
        node.parentKey = parentKey
        parent.children.push(node)
        placed = true
        break
      }
    }
    if (!placed) roots.push(node)
  }

  return roots
}

// GET /api/v1/metadata/nodes/:id
router.get("/nodes/:id", async (req, res) => {
  try {
    const { id } = req.params
    const node = await MetaNode.findOne({ $or: [{ id }, { logicalKey: id }] })
    if (!node) {
      return res.status(404).json({ message: "Not found" })
    }
    res.json(node)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/v1/metadata/nodes
router.post("/nodes", async (req, res) => {
  try {
    const body = req.body
    const now = new Date().toISOString()
    const newNode = await MetaNode.create({
      id: `uuid-gen-${Date.now()}`,
      logicalKey: body.logicalKey,
      cascadeLevel: body.cascadeLevel,
      objectVersion: 1,
      audit: { createdBy: "system", createdAt: now, modifiedBy: "system", modifiedAt: now },
      kind: body.kind,
      ...(body.data ?? {}),
    })
    res.status(201).json(newNode)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/v1/metadata/pages
router.post("/pages", async (req, res) => {
  try {
    const {
      title = "Untitled Page",
      archetype = "list-report",
      moduleKey,
      entityRef,
      cascadeLevel = "vertical",
    } = req.body

    const slug = toCamelCase(title)
    const now = new Date().toISOString()
    const audit = { createdBy: "system", createdAt: now, modifiedBy: "system", modifiedAt: now }

    const scaffoldNodes = buildPageScaffold(slug, title, archetype, entityRef, cascadeLevel, audit)

    await MetaNode.insertMany(scaffoldNodes)

    if (moduleKey) {
      const moduleNode = await MetaNode.findOne({
        logicalKey: moduleKey,
        kind: "module",
      })
      if (moduleNode) {
        const pages = Array.isArray(moduleNode.pages) ? moduleNode.pages : []
        await MetaNode.updateOne({ _id: moduleNode._id }, { $set: { pages: [...pages, `page.${slug}`] } })
      }
    }

    const pageNode = scaffoldNodes[scaffoldNodes.length - 1]
    res.status(201).json(pageNode)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/v1/metadata/nodes/:logicalKey/override
router.post("/nodes/:logicalKey/override", async (req, res) => {
  try {
    const { logicalKey } = req.params
    const { level, ops } = req.body
    const now = new Date().toISOString()

    const overrideNode = await MetaNode.create({
      id: `uuid-ovr-${Date.now()}`,
      logicalKey: `${logicalKey}.override`,
      cascadeLevel: level,
      overrideOf: logicalKey,
      overrideOps: ops,
      objectVersion: 1,
      audit: { createdBy: "system", createdAt: now, modifiedBy: "system", modifiedAt: now },
    })

    const existing = await MetaNode.findOne({ $or: [{ id: logicalKey }, { logicalKey }] })
    const result = existing
      ? { ...existing.toJSON(), ...overrideNode.toJSON() }
      : overrideNode.toJSON()

    res.status(201).json(result)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
