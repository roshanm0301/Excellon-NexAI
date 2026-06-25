import { Router } from "express"
import MetaNode from "../models/MetaNode.js"

const router = Router()

// POST /api/v1/preview/resolve
router.post("/resolve", async (req, res) => {
  try {
    const { pageId = "", previewScopeId = "automotive", editingLevel = "vertical" } = req.body

    const nodes = await MetaNode.find({})

    const resolved = nodes.map((n) => {
      const data = n.toJSON()
      return {
        logicalKey: data.logicalKey,
        kind: data.kind ?? "unknown",
        cascadeLevel: data.cascadeLevel,
        originState: data.cascadeLevel === editingLevel ? "own" : "inherited",
        data,
      }
    })

    const filteredNodes = pageId
      ? resolved.filter((n) => n.logicalKey === pageId || n.logicalKey.startsWith(`${pageId}.`))
      : resolved

    res.json({ pageId, scopeId: previewScopeId, nodes: filteredNodes })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
