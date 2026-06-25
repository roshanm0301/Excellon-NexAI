import mongoose from "mongoose"

const { Schema } = mongoose

const appSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    vertical: { type: String, required: true },
    description: { type: String, default: "" },
    createdAt: { type: String, required: true },
    modifiedAt: { type: String, required: true },
  },
  { versionKey: false },
)

const nodeSchema = new Schema(
  {
    id: { type: String, required: true, index: true },
    appId: { type: String, required: true, index: true },
    logicalKey: { type: String, required: true, index: true },
    cascadeLevel: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { versionKey: false },
)

nodeSchema.index({ appId: 1, logicalKey: 1, cascadeLevel: 1 }, { unique: true })

const versionSchema = new Schema(
  {
    appId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    env: { type: String, required: true },
    publishedAt: { type: String, required: true },
    publishedBy: { type: String, required: true },
    message: { type: String, required: true },
    issues: { type: [Schema.Types.Mixed], default: [] },
    snapshot: { type: [Schema.Types.Mixed], required: true },
  },
  { versionKey: false },
)

versionSchema.index({ appId: 1, version: 1 }, { unique: true })

const lockSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    heldBy: { type: String, required: true },
    acquiredAt: { type: String, required: true },
    expiresAt: { type: String, required: true },
  },
  { versionKey: false },
)

export const AppModel = mongoose.models.StudioApp ?? mongoose.model("StudioApp", appSchema)
export const NodeModel = mongoose.models.StudioNode ?? mongoose.model("StudioNode", nodeSchema)
export const VersionModel = mongoose.models.StudioVersion ?? mongoose.model("StudioVersion", versionSchema)
export const LockModel = mongoose.models.StudioLock ?? mongoose.model("StudioLock", lockSchema)
