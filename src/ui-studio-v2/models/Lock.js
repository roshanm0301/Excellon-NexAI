import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    heldBy: { type: String, required: true },
    acquiredAt: { type: String, required: true },
    expiresAt: { type: String, required: true },
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

export default mongoose.models.Lock ?? mongoose.model("Lock", schema)
