import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    logicalKey: { type: String, required: true },
    cascadeLevel: { type: String, required: true },
  },
  {
    strict: false,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id
        return ret
      },
    },
  },
)

schema.index({ logicalKey: 1, cascadeLevel: 1 })

export default mongoose.models.MetaNode ?? mongoose.model("MetaNode", schema)
