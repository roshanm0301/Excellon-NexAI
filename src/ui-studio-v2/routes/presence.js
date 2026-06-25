import { Router } from "express"
import Lock from "../models/Lock.js"

const router = Router()

// GET /api/v1/presence/:appId
router.get("/:appId", (_req, res) => {
  res.json([])
})

// POST /api/v1/presence/lock
router.post("/lock", async (req, res) => {
  try {
    const { key } = req.body
    const now = new Date()

    const existing = await Lock.findOne({ key })
    if (existing && new Date(existing.expiresAt) > now) {
      return res.status(409).json({ message: `Lock held by ${existing.heldBy}` })
    }

    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString()
    const lock = await Lock.findOneAndUpdate(
      { key },
      { key, heldBy: "system", acquiredAt: now.toISOString(), expiresAt },
      { upsert: true, new: true },
    )

    res.json(lock)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
