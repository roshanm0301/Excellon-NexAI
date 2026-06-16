import { defineConfig, devices } from '@playwright/test'

const basePath = process.env.VITE_BASE_PATH ?? '/Excellon-NexAI/'
const port = Number(process.env.PLAYWRIGHT_PORT ?? 5173)
const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const baseURL = `http://${host}:${port}${basePath}`

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --host ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_MSW: 'true',
      VITE_BASE_PATH: basePath,
    },
  },
})
