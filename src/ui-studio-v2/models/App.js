import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    vertical: { type: String, required: true },
    description: { type: String, default: "" },
    createdAt: { type: String },
    modifiedAt: { type: String },
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

export default mongoose.models.App ?? mongoose.model("App", schema)
