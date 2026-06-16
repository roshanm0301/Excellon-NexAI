import { readFileSync, existsSync, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '../../../..')
const PID_FILE = path.join(REPO_ROOT, '.test-backend.pid')

export default async function globalTeardown() {
  if (existsSync(PID_FILE)) {
    try {
      const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10)
      process.kill(pid, 'SIGTERM')
      console.log(`[global-teardown] Killed Go backend (PID ${pid})`)
    } catch {
      // already gone
    }
    unlinkSync(PID_FILE)
  }
}
