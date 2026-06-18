/**
 * Headed Playwright config — runs Chrome visibly on screen with slow motion.
 * Use for manual inspection and comprehensive click testing.
 *
 * Usage:
 *   $env:PLAYWRIGHT_PORT="5177"
 *   npx playwright test --config=playwright.headed.config.ts
 */
import { defineConfig, devices } from '@playwright/test'

const port  = Number(process.env.PLAYWRIGHT_PORT ?? 5177)
const host  = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const base  = process.env.VITE_BASE_PATH ?? '/Excellon-NexAI/'
const baseURL = `http://${host}:${port}${base}`

export default defineConfig({
  testDir:        './e2e',
  outputDir:      './test-results/headed',
  timeout:        300_000,   // 5 min — slowMo adds delay to every action
  expect:         { timeout: 20_000 },
  fullyParallel:  false,
  workers:        1,
  reporter:       [['list']],

  use: {
    baseURL,
    headless:      false,
    slowMo:        500,         // 500 ms between each action — clearly visible on screen
    actionTimeout: 8_000,       // 8 s max per click/fill — prevents hanging on disabled elements
    trace:         'on',
    screenshot:    'on',
    video:         'on',
    viewport:      { width: 1440, height: 900 },
  },

  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--start-maximized',       // open Chrome maximized
            '--disable-infobars',      // no "Chrome is being controlled" bar
          ],
        },
      },
    },
  ],

  webServer: {
    command:             `npm run dev -- --host ${host} --port ${port}`,
    url:                 baseURL,
    reuseExistingServer: true,   // reuse running server at 5177
    timeout:             60_000,
    env: {
      VITE_MSW:       'true',
      VITE_BASE_PATH: base,
    },
  },
})
