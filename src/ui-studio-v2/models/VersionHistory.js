import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    appId: { type: String, required: true },
    version: { type: Number, required: true },
    env: { type: String, default: "dev" },
    publishedAt: { type: String },
    publishedBy: { type: String, default: "system" },
    message: { type: String },
    success: { type: Boolean, default: true },
    artifactVersion: { type: Number },
    issues: { type: Array, default: [] },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id
        return ret
      },
    },
  },
)

schema.index({ appId: 1, version: 1 })

export default mongoose.models.VersionHistory ?? mongoose.model("VersionHistory", schema)
