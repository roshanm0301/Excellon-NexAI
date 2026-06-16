import { defineConfig, devices } from '@playwright/test'

const basePath = process.env.VITE_BASE_PATH ?? '/Excellon-NexAI/'
const vitePort = Number(process.env.PLAYWRIGHT_VITE_PORT ?? 5174)
const goPort = Number(process.env.PLAYWRIGHT_GO_PORT ?? 9080)
const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const baseURL = `http://${host}:${vitePort}${basePath}`
const goBaseURL = `http://${host}:${goPort}`

export default defineConfig({
  testDir: './e2e/integration',
  outputDir: './test-results/integration',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-integration', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      'x-tenant-id': '00000000-0000-0000-0000-000000000001',
      'x-user-id': '00000000-0000-0000-0000-000000000001',
      'x-role': 'admin',
    },
  },
  projects: [
    {
      name: 'chrome-integration',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  globalSetup: './e2e/integration/global-setup.ts',
  globalTeardown: './e2e/integration/global-teardown.ts',
  webServer: [
    {
      command: `PORT=${goPort} DATABASE_URL="postgres://nexai:nexai@localhost:5433/nexai?sslmode=disable" NEXAI_AUTH_MODE=local NEXAI_STUDIO_PLUGINS_ENABLED=false NEXAI_AI_FEATURES_ENABLED=false /home/user/Excellon-NexAI/.test-server`,
      url: `${goBaseURL}/health`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --host ${host} --port ${vitePort}`,
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        VITE_MSW: 'false',
        VITE_AUTH_MODE: 'local',
        VITE_BASE_PATH: basePath,
        VITE_API_URL: `http://${host}:${goPort}`,
      },
    },
  ],
})
