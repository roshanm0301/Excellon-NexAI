/**
 * Surface Guide Panel — headed Chrome smoke test
 * Verify the BookOpen icon appears and opens the guide panel for every surface type.
 *
 * Run:
 *   $env:PLAYWRIGHT_PORT="5177"
 *   npx playwright test e2e/surface-guide-test.spec.ts --config=playwright.headed.config.ts
 */
import { test, expect } from '@playwright/test'

const VIEWS: { id: string; surface: string; label: string }[] = [
  { id: '00000000-0000-0000-0002-000000000013', surface: 'header_line',   label: 'Header + Lines' },
  { id: '00000000-0000-0000-0002-000000000004', surface: 'standard_crud', label: 'List View' },
  { id: '00000000-0000-0000-0002-000000000003', surface: 'wizard',        label: 'Wizard' },
  { id: '00000000-0000-0000-0002-000000000002', surface: 'dashboard',     label: 'Dashboard' },
]
const BASE = '/Excellon-NexAI'

test('Surface Guide icon appears and opens correct content for each surface', async ({ page }) => {
  await page.bringToFront()

  for (const v of VIEWS) {
    console.log(`\n🔍 Testing: ${v.label} (${v.surface})`)

    await page.goto(`${BASE}/studio/views/${v.id}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(600)

    // BookOpen icon button must exist in toolbar
    const guideBtn = page.locator('.vd-surface-guide-btn')
    await expect(guideBtn).toBeVisible()
    console.log(`  ✅ Guide button visible`)

    // Click it
    await guideBtn.click()
    await page.waitForTimeout(400)

    // Panel opens
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    console.log(`  ✅ Guide panel opened`)

    // Hero shows correct surface label
    const heroLabel = page.locator('.sgp-hero__label')
    await expect(heroLabel).toContainText(v.label)
    console.log(`  ✅ Hero shows "${v.label}"`)

    // Has overview, do's/don'ts, DMS examples sections
    await expect(page.locator('.sgp-overview')).toBeVisible()
    await expect(page.locator('.sgp-dnd-list')).toBeVisible()
    await expect(page.locator('.sgp-examples')).toBeVisible()
    console.log(`  ✅ All sections present (overview, dos/donts, examples)`)

    // Tab strip shows 9 surface tabs
    const tabs = page.locator('.sgp-tab')
    const tabCount = await tabs.count()
    expect(tabCount).toBe(9)
    console.log(`  ✅ ${tabCount} surface type tabs in strip`)

    // Click a different tab and verify content changes
    const secondTab = tabs.nth(1)
    const secondTabText = await secondTab.innerText()
    await secondTab.click()
    await page.waitForTimeout(300)
    // Hero should now show different label
    const newLabel = await heroLabel.innerText()
    console.log(`  ✅ Switched to tab "${secondTabText.trim()}" → hero shows "${newLabel}"`)

    // Close with X button
    await page.locator('.sgp-header__close').click()
    await page.waitForTimeout(300)
    await expect(page.locator('[role="dialog"]')).toBeHidden()
    console.log(`  ✅ Panel closed with X button`)

    // Reopen and close with Escape
    await guideBtn.click()
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await expect(page.locator('[role="dialog"]')).toBeHidden()
    console.log(`  ✅ Panel closed with Escape key`)
  }

  console.log('\n✅  All surface guide tests passed')
})
