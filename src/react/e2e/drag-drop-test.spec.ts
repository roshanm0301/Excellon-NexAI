/**
 * Drag-Drop Test — drag every palette component to the canvas and verify.
 *
 * For each component in the Library palette:
 *   1. Drag from palette → drop on first available zone body
 *   2. Check if a new component block appeared (drop accepted)
 *   3. Check for JS errors
 *   4. Undo so canvas stays clean for next drag
 *
 * Run:
 *   $env:PLAYWRIGHT_PORT="5177"
 *   npx playwright test e2e/drag-drop-test.spec.ts --config=playwright.headed.config.ts
 */
import { test } from '@playwright/test'

// Sale Order Editor — header_line, many zones so drops are more likely to succeed
const SALE_ORDER_VIEW = '00000000-0000-0000-0002-000000000013'
const BASE = '/Excellon-NexAI'

interface DragResult {
  component: string
  accepted: boolean   // block count increased
  error?: string
  note?: string
}

test.beforeEach(({ page }) => {
  // collect any page-level JS errors
  page.on('pageerror', err => {
    console.error(`  ⚡ PAGE ERROR: ${err.message}`)
  })
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('MSW'))
      console.error(`  ⚡ CONSOLE ERROR: ${msg.text()}`)
  })
})

test('Drag every palette component onto the canvas', async ({ page }) => {
  test.setTimeout(600_000) // 10 min for ~76 components

  const results: DragResult[] = []
  const pageErrors: string[] = []

  page.on('pageerror', err => pageErrors.push(err.message))
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('MSW'))
      pageErrors.push(msg.text())
  })

  // ── Load view ──────────────────────────────────────────────────────────────
  // Bring Chrome window to front so user can watch
  await page.bringToFront()

  console.log('\n🚀  Opening Sale Order Editor (header_line)…')
  await page.goto(`${BASE}/studio/views/${SALE_ORDER_VIEW}/edit`)
  await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 20000 })
  await page.waitForTimeout(800)
  console.log('✅  View loaded\n')

  // Switch to Library tab
  await page.locator('[data-testid="lr-tab-library"]').click()
  await page.waitForTimeout(400)

  // Get all components in the palette
  const allItems = page.locator('.cp-item')
  const totalComponents = await allItems.count()
  console.log(`Found ${totalComponents} components in palette\n`)
  console.log('═'.repeat(60))

  // First zone body — primary drop target
  const primaryZone = page.locator('[data-testid="zone-body"]').first()

  for (let i = 0; i < totalComponents; i++) {
    // Re-fetch item each iteration (DOM may change after undo)
    const item     = page.locator('.cp-item').nth(i)
    const name     = await item.locator('.cp-item__name').innerText().catch(() => `Component ${i + 1}`)
    const disabled = await item.getAttribute('aria-disabled') === 'true'

    const blocksBefore = await page.locator('[data-testid="zc-block"]').count()
    const errsBefore   = pageErrors.length

    if (disabled) {
      results.push({ component: name, accepted: false, note: 'disabled (placement rule)' })
      console.log(`⊘  SKIP     [${i + 1}/${totalComponents}] ${name} — disabled by placement rules`)
      continue
    }

    console.log(`🖱  Dragging  [${i + 1}/${totalComponents}] ${name}…`)

    try {
      await item.dragTo(primaryZone, { timeout: 5000 })
      await page.waitForTimeout(400)

      const blocksAfter  = await page.locator('[data-testid="zc-block"]').count()
      const newErrors    = pageErrors.slice(errsBefore)
      const accepted     = blocksAfter > blocksBefore

      if (newErrors.length > 0) {
        results.push({ component: name, accepted, error: newErrors[0] })
        console.error(`❌  ERROR    [${i + 1}/${totalComponents}] ${name}`)
        console.error(`             JS Error: ${newErrors[0]}`)
      } else if (accepted) {
        results.push({ component: name, accepted: true })
        console.log(`✅  ACCEPTED [${i + 1}/${totalComponents}] ${name} (${blocksBefore} → ${blocksAfter} blocks)`)
      } else {
        results.push({ component: name, accepted: false, note: 'rejected by placement rules' })
        console.log(`⊘  REJECTED [${i + 1}/${totalComponents}] ${name} — placement rules blocked drop`)
      }

      // Undo to keep canvas clean for next drag
      if (accepted) {
        await page.keyboard.press('Control+z')
        await page.waitForTimeout(250)
      }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message.split('\n')[0] : String(e)
      results.push({ component: name, accepted: false, error: msg })
      console.error(`❌  FAIL     [${i + 1}/${totalComponents}] ${name} — ${msg}`)
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const accepted  = results.filter(r => r.accepted)
  const rejected  = results.filter(r => !r.accepted && !r.error && r.note)
  const errored   = results.filter(r => r.error)
  const skipped   = results.filter(r => r.note === 'disabled (placement rule)')

  console.log('\n' + '═'.repeat(62))
  console.log('  DRAG-DROP TEST — FINAL SUMMARY')
  console.log('═'.repeat(62))
  console.log(`  ✅  Accepted by canvas  : ${accepted.length}`)
  console.log(`  ⊘   Rejected (rules)    : ${rejected.length + skipped.length}`)
  console.log(`  ❌  JS errors on drop   : ${errored.length}`)
  console.log(`  TOTAL components        : ${totalComponents}`)
  console.log('═'.repeat(62))

  if (accepted.length > 0) {
    console.log('\n✅  ACCEPTED:')
    accepted.forEach(r => console.log(`     ${r.component}`))
  }

  if (rejected.length + skipped.length > 0) {
    console.log('\n⊘   REJECTED/SKIPPED (placement rules — expected):')
    ;[...rejected, ...skipped].forEach(r => console.log(`     ${r.component} — ${r.note}`))
  }

  if (errored.length > 0) {
    console.log('\n❌  JS ERRORS (bugs):')
    errored.forEach(r => {
      console.log(`     ${r.component}`)
      console.log(`       → ${r.error}`)
    })
    throw new Error(`${errored.length} component(s) threw JS errors during drag-drop.`)
  }

  if (accepted.length === 0 && skipped.length < totalComponents) {
    throw new Error('No components were accepted by the canvas — drag-drop may be broken.')
  }
})
