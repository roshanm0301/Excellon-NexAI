import dotenv from "dotenv"
import { app } from "./src/server/app.ts"
import { connectDB, closeDBConnection } from "./config/db.js"

dotenv.config()

const PORT = process.env.PORT || 5000

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
