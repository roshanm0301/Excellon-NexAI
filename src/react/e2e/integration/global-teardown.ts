import { readFileSync, existsSync, unlinkSync } from 'fs'
import * as path from 'path'

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
