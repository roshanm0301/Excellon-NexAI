import { execSync, spawn } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import * as path from 'path'

const REPO_ROOT = path.resolve(__dirname, '../../../..')
const GO_SERVER_BIN = path.join(REPO_ROOT, '.test-server')

async function waitForUrl(url: string, timeoutMs = 30000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

export default async function globalSetup() {
  const goPort = process.env.PLAYWRIGHT_GO_PORT ?? '9080'
  const healthUrl = `http://127.0.0.1:${goPort}/health`

  // Check if Go server already running
  try {
    const res = await fetch(healthUrl)
    if (res.ok) {
      console.log('[global-setup] Go backend already running, skipping startup')
      return
    }
  } catch {
    // not running — start it
  }

  // Ensure postgres is running and migrations are applied
  console.log('[global-setup] Starting postgres...')
  execSync(`docker compose -f ${REPO_ROOT}/docker-compose.yml up -d postgres`, { stdio: 'inherit' })

  console.log('[global-setup] Waiting for postgres...')
  let pgReady = false
  for (let i = 0; i < 30; i++) {
    try {
      execSync(`docker compose -f ${REPO_ROOT}/docker-compose.yml exec -T postgres pg_isready -U nexai -q`, { stdio: 'pipe' })
      pgReady = true
      break
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  if (!pgReady) throw new Error('PostgreSQL did not become ready')

  console.log('[global-setup] Running migrations...')
  execSync(`docker compose -f ${REPO_ROOT}/docker-compose.yml run --rm migrate`, { stdio: 'inherit' })

  console.log('[global-setup] Applying seeds...')
  try {
    execSync(`bash ${REPO_ROOT}/db/seeds/seed_all.sh`, { stdio: 'inherit' })
  } catch (e) {
    console.warn('[global-setup] Seed warning (may already be seeded):', e)
  }

  // Build Go binary if needed
  if (!existsSync(GO_SERVER_BIN)) {
    console.log('[global-setup] Building Go server...')
    execSync(`/usr/local/go/bin/go build -o ${GO_SERVER_BIN} ${REPO_ROOT}/src/go/cmd/server/`, {
      stdio: 'inherit',
      cwd: REPO_ROOT,
    })
  }

  // Start Go server
  console.log('[global-setup] Starting Go backend...')
  const goProc = spawn(GO_SERVER_BIN, [], {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: goPort,
      DATABASE_URL: 'postgres://nexai:nexai@localhost:5433/nexai?sslmode=disable',
      NEXAI_AUTH_MODE: 'local',
      NEXAI_STUDIO_PLUGINS_ENABLED: 'false',
      NEXAI_AI_FEATURES_ENABLED: 'false',
    },
  })
  goProc.unref()

  if (goProc.pid) {
    writeFileSync(path.join(REPO_ROOT, '.test-backend.pid'), String(goProc.pid))
  }

  console.log('[global-setup] Waiting for Go backend health...')
  await waitForUrl(healthUrl, 30000)
  console.log('[global-setup] Go backend ready')
}
