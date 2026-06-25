import mongoose from "mongoose"

let isShuttingDown = false

mongoose.set("strictQuery", true)

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected")
})

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error.message)
})

mongoose.connection.on("disconnected", () => {
  if (!isShuttingDown) {
    console.warn("MongoDB disconnected")
  }
})

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected")
})

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined. Add it to your .env file.")
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    })

    return mongoose.connection
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message)
    throw error
  }
}

export async function closeDBConnection() {
  try {
    isShuttingDown = true
    await mongoose.connection.close()
    console.log("MongoDB connection closed")
  } catch (error) {
    console.error("Error while closing MongoDB connection:", error.message)
    throw error
  }
}
