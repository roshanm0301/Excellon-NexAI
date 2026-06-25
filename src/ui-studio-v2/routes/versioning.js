import { Router } from "express"
import VersionHistory from "../models/VersionHistory.js"

const router = Router()

// GET /api/v1/versioning/:appId/versions
router.get("/:appId/versions", async (req, res) => {
  try {
    const { appId } = req.params
    const records = await VersionHistory.find({ appId }).sort({ version: 1 })
    const versions = records.map((r) => ({
      version: r.version,
      env: r.env,
      publishedAt: r.publishedAt,
      publishedBy: r.publishedBy,
      message: r.message,
    }))
    res.json(versions)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/v1/versioning/:appId/diff
router.post("/:appId/diff", async (req, res) => {
  try {
    const { v1, v2 } = req.body
    res.json({
      v1,
      v2,
      entries: [
        {
          logicalKey: "dms-app.main-module.vehicle-list",
          kind: "component",
          changeType: "modified",
          before: { props: { columns: 3 } },
          after: { props: { columns: 4 } },
        },
      ],
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/v1/versioning/:appId/promote
router.post("/:appId/promote", async (req, res) => {
  try {
    const { appId } = req.params
    const { fromEnv, toEnv, version } = req.body

    const count = await VersionHistory.countDocuments({ appId })
    const artifactVersion = count + 1
    const now = new Date().toISOString()

    await VersionHistory.create({
      appId,
      version: artifactVersion,
      env: toEnv,
      publishedAt: now,
      publishedBy: "system",
      message: `Promoted v${version} from ${fromEnv} to ${toEnv}`,
      success: true,
      artifactVersion,
      issues: [],
    })

    res.json({ success: true, artifactVersion, message: `Promoted v${version} from ${fromEnv} to ${toEnv}`, issues: [] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/v1/versioning/:appId/rollback
router.post("/:appId/rollback", async (req, res) => {
  try {
    const { appId } = req.params
    const { targetVersion } = req.body

    const existing = await VersionHistory.findOne({ appId, version: targetVersion })
    if (!existing) {
      return res.status(404).json({ success: false, artifactVersion: 0, message: "Version not found", issues: [] })
    }

    const count = await VersionHistory.countDocuments({ appId })
    const artifactVersion = count + 1
    const now = new Date().toISOString()

    await VersionHistory.create({
      appId,
      version: artifactVersion,
      env: existing.env,
      publishedAt: now,
      publishedBy: "system",
      message: `Rolled back to v${targetVersion}`,
      success: true,
      artifactVersion,
      issues: [],
    })

    res.json({ success: true, artifactVersion, message: `Rolled back to v${targetVersion}`, issues: [] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
