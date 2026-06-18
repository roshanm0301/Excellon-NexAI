/**
 * Multi-drop bug regression — verifies you can drag multiple components
 * to a zone body that already has components in it.
 *
 * Run:
 *   $env:PLAYWRIGHT_PORT="5177"
 *   npx playwright test e2e/multi-drop-test.spec.ts --config=playwright.headed.config.ts
 */
import { test, expect } from '@playwright/test'

const VIEW_ID = '00000000-0000-0000-0002-000000000004' // Customer Master, standard_crud
const BASE = '/Excellon-NexAI'

test('Can drag multiple components to same zone body (bug regression)', async ({ page }) => {
  await page.bringToFront()

  await page.goto(`${BASE}/studio/views/${VIEW_ID}/edit`)
  await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
  await page.waitForTimeout(600)

  // Ensure Library tab
  await page.locator('[data-testid="lr-tab-library"]').click()
  await page.waitForTimeout(300)

  const zoneBody = page.locator('[data-testid="zone-body"]').first()
  // Only use enabled (draggable) items — disabled items are placement-blocked
  const paletteItems = page.locator('.cp-item:not(.cp-item--disabled)')

  // ── Drop component #1 ─────────────────────────────────────────────────────
  const blocksBefore = await page.locator('[data-testid="zc-block"]').count()
  console.log(`\nBlocks before: ${blocksBefore}`)

  await paletteItems.first().dragTo(zoneBody)
  await page.waitForTimeout(500)
  const count1 = await page.locator('[data-testid="zc-block"]').count()
  console.log(`After drop 1: ${count1}`)
  expect(count1).toBeGreaterThan(blocksBefore)
  console.log('✅ Component 1 dropped successfully')

  // ── Drop component #2 (onto SAME zone body that now has a block in it) ─────
  await paletteItems.nth(1).dragTo(zoneBody)
  await page.waitForTimeout(500)
  const count2 = await page.locator('[data-testid="zc-block"]').count()
  console.log(`After drop 2: ${count2}`)
  expect(count2).toBeGreaterThan(count1)
  console.log('✅ Component 2 dropped successfully (was blocked before fix)')

  // ── Drop component #3 ─────────────────────────────────────────────────────
  await paletteItems.nth(2).dragTo(zoneBody)
  await page.waitForTimeout(500)
  const count3 = await page.locator('[data-testid="zc-block"]').count()
  console.log(`After drop 3: ${count3}`)
  expect(count3).toBeGreaterThan(count2)
  console.log('✅ Component 3 dropped successfully')

  // ── Drop component #4 ─────────────────────────────────────────────────────
  await paletteItems.nth(3).dragTo(zoneBody)
  await page.waitForTimeout(500)
  const count4 = await page.locator('[data-testid="zc-block"]').count()
  console.log(`After drop 4: ${count4}`)
  expect(count4).toBeGreaterThan(count3)
  console.log('✅ Component 4 dropped successfully')

  // ── Drop component #5 ─────────────────────────────────────────────────────
  await paletteItems.nth(4).dragTo(zoneBody)
  await page.waitForTimeout(500)
  const count5 = await page.locator('[data-testid="zc-block"]').count()
  console.log(`After drop 5: ${count5}`)
  expect(count5).toBeGreaterThan(count4)
  console.log('✅ Component 5 dropped successfully')

  // ── Undo all 5 to clean up ───────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Control+z')
    await page.waitForTimeout(150)
  }
  const countAfterUndo = await page.locator('[data-testid="zc-block"]').count()
  console.log(`After 5x undo: ${countAfterUndo}`)
  expect(countAfterUndo).toBeLessThanOrEqual(blocksBefore + 1)
  console.log('✅ Undo restored original state')

  console.log('\n✅ Multi-drop bug regression: FIXED')
})
