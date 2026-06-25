import dotenv from "dotenv"
import express from "express"
import { connectDB, closeDBConnection } from "./config/db.js"
import metadataRouter from "./routes/metadata.js"
import compilerRouter from "./routes/compiler.js"
import registryRouter from "./routes/registry.js"
import versioningRouter from "./routes/versioning.js"
import presenceRouter from "./routes/presence.js"
import previewRouter from "./routes/preview.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ui-studio-v2-api",
    environment: process.env.NODE_ENV || "development",
  })
})

app.use("/api/v1/metadata", metadataRouter)
app.use("/api/v1/compiler", compilerRouter)
app.use("/api/v1/registry", registryRouter)
app.use("/api/v1/versioning", versioningRouter)
app.use("/api/v1/presence", presenceRouter)
app.use("/api/v1/preview", previewRouter)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
})

app.use((error, _req, res, _next) => {
  console.error("Unhandled server error:", error)
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
  })
})

async function startServer() {
  try {
    await connectDB()

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`)

      server.close(async () => {
        try {
          await closeDBConnection()
          process.exit(0)
        } catch {
          process.exit(1)
        }
      })
    }

    process.on("SIGINT", () => shutdown("SIGINT"))
    process.on("SIGTERM", () => shutdown("SIGTERM"))
  } catch (error) {
    console.error("Server startup failed:", error.message)
    process.exit(1)
  }
}

startServer()
