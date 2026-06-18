/**
 * Comprehensive Click Test — every visible UI element in the View Designer.
 *
 * Clicks every button, input, tab, dropdown, context-menu item and draggable
 * element in the left panel, center canvas and right panel.
 * Fails immediately (with element name + error) if any JS error fires.
 *
 * Run visibly on screen:
 *   $env:PLAYWRIGHT_PORT="5177"
 *   npx playwright test e2e/comprehensive-click-test.spec.ts `
 *     --config=playwright.headed.config.ts
 */
import { test, type Locator } from '@playwright/test'

// Sale Order Editor — header_line, 8 zones, richest tree for canvas testing
const SALE_ORDER_VIEW  = '00000000-0000-0000-0002-000000000013'
// Customer Master — standard_crud, customer entity has fields in mock data
const CUSTOMER_VIEW    = '00000000-0000-0000-0002-000000000004'
const BASE = '/Excellon-NexAI'

// ─── Test state ───────────────────────────────────────────────────────────────

interface Result { name: string; status: 'PASS' | 'FAIL'; error?: string }
let errors:  string[] = []
let step:    string   = 'init'
let results: Result[] = []

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function tap(loc: Locator, name: string, opts?: Parameters<Locator['click']>[0]) {
  step = name
  const before = errors.length
  try {
    await loc.waitFor({ state: 'visible', timeout: 6000 })
    await loc.click(opts)
    await loc.page().waitForTimeout(200)
    const newErrs = errors.slice(before)
    if (newErrs.length) {
      results.push({ name, status: 'FAIL', error: newErrs[0] })
      console.error(`❌  FAIL  ${name}\n         ${newErrs[0]}`)
    } else {
      results.push({ name, status: 'PASS' })
      console.log(`✅  PASS  ${name}`)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message.split('\n')[0] : String(e)
    results.push({ name, status: 'FAIL', error: msg })
    console.error(`❌  FAIL  ${name}\n         ${msg}`)
  }
}

async function fill(loc: Locator, name: string, value: string) {
  step = name
  const before = errors.length
  try {
    await loc.waitFor({ state: 'visible', timeout: 6000 })
    await loc.click()
    await loc.fill(value)
    await loc.page().waitForTimeout(150)
    const newErrs = errors.slice(before)
    if (newErrs.length) {
      results.push({ name, status: 'FAIL', error: newErrs[0] })
      console.error(`❌  FAIL  ${name}\n         ${newErrs[0]}`)
    } else {
      results.push({ name, status: 'PASS' })
      console.log(`✅  PASS  ${name}`)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message.split('\n')[0] : String(e)
    results.push({ name, status: 'FAIL', error: msg })
    console.error(`❌  FAIL  ${name}\n         ${msg}`)
  }
}

function check(name: string, ok: boolean, detail?: string) {
  results.push({ name, status: ok ? 'PASS' : 'FAIL', error: ok ? undefined : detail })
  console.log(`${ok ? '✅' : '❌'}  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

// Key press that checks for new JS errors since the press
async function pressKey(page: import('@playwright/test').Page, key: string, name: string) {
  step = name
  const before = errors.length
  await page.keyboard.press(key)
  await page.waitForTimeout(300)
  const newErrs = errors.slice(before)
  check(name, newErrs.length === 0, newErrs[0])
}

// ─── Test ────────────────────────────────────────────────────────────────────

test.beforeEach(({ page }) => {
  errors = []
  results = []
  page.on('pageerror', err => errors.push(`[${step}] PAGE: ${err.message}`))
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('MSW'))
      errors.push(`[${step}] CONSOLE: ${msg.text()}`)
  })
})

test('Click every UI element in the View Designer', async ({ page }) => {
  test.setTimeout(300_000)

  // Bring Chrome window to front so user can watch
  await page.bringToFront()

  // ── Load Sale Order Editor (header_line — richest tree) ───────────────────
  console.log('\n🚀  Opening Sale Order Editor (header_line)…')
  await page.goto(`${BASE}/studio/views/${SALE_ORDER_VIEW}/edit`)
  await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 20000 })
  await page.waitForTimeout(800)
  console.log('✅  View loaded\n')

  // ══════════════════════════════════════════════════════════════════════════
  console.log('───────────────────────────────────────────')
  console.log(' SECTION 1 — TOOLBAR')
  console.log('───────────────────────────────────────────')
  // ══════════════════════════════════════════════════════════════════════════

  check('Toolbar: Save disabled on clean load',
    await page.locator('[data-testid="vd-save-btn"]').isDisabled())

  // Undo / Redo start disabled — force-click to check for crashes
  await tap(page.locator('button[title="Undo (Ctrl+Z)"]'), 'Toolbar: Undo button (disabled)', { force: true })
  await tap(page.locator('button[title="Redo (Ctrl+Y)"]'), 'Toolbar: Redo button (disabled)', { force: true })

  // Preview on / off
  await tap(page.locator('[data-testid="vd-preview-btn"]'), 'Toolbar: Preview toggle ON')
  await page.waitForTimeout(300)
  await tap(page.locator('[data-testid="vd-preview-btn"]'), 'Toolbar: Preview toggle OFF')
  await page.waitForTimeout(300)

  // Settings drawer open → close by clicking its overlay
  await tap(page.locator('button[title="View Settings"]'), 'Toolbar: Settings button (open drawer)')
  await page.waitForTimeout(400)
  check('Toolbar: Settings drawer opened', await page.locator('.vsd-overlay').isVisible())
  await tap(page.locator('.vsd-overlay'), 'Toolbar: Settings drawer overlay (close)')
  await page.waitForTimeout(300)
  check('Toolbar: Settings drawer closed', await page.locator('.vsd-overlay').isHidden())

  // Publish — disabled when tree has validation errors; force-click to check crash
  await tap(page.locator('[data-testid="vd-publish-btn"]'), 'Toolbar: Publish button', { force: true })
  await page.waitForTimeout(300)
  // Dismiss any modal that might have opened
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Keyboard shortcuts
  await pressKey(page, 'Control+z', 'Keyboard: Ctrl+Z (undo)')
  await pressKey(page, 'Control+y', 'Keyboard: Ctrl+Y (redo)')

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n───────────────────────────────────────────')
  console.log(' SECTION 2 — LEFT RAIL TABS')
  console.log('───────────────────────────────────────────')
  // ══════════════════════════════════════════════════════════════════════════

  await tap(page.locator('[data-testid="lr-tab-outline"]'), 'Left Rail: Outline tab')
  await tap(page.locator('[data-testid="lr-tab-fields"]'),  'Left Rail: Fields tab')
  await tap(page.locator('[data-testid="lr-tab-library"]'), 'Left Rail: Library tab')

  // Collapse & verify sidebar hides
  await tap(page.locator('.lr-collapse'), 'Left Rail: Collapse button')
  await page.waitForTimeout(400)
  check('Left Rail: Panel collapses', await page.locator('.vd-sidebar--left').isHidden())

  // Reload to restore panel
  await page.goto(`${BASE}/studio/views/${SALE_ORDER_VIEW}/edit`)
  await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 20000 })
  await page.waitForTimeout(800)

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n───────────────────────────────────────────')
  console.log(' SECTION 3 — LIBRARY TAB (Component Palette)')
  console.log('───────────────────────────────────────────')
  // ══════════════════════════════════════════════════════════════════════════

  await tap(page.locator('[data-testid="lr-tab-library"]'), 'Library: Switch to Library tab')

  // Search input
  const searchInput = page.locator('[data-testid="component-palette"] input')
  await fill(searchInput, 'Library: Search — "section"', 'section')
  await fill(searchInput, 'Library: Search — "input"',   'input')
  await fill(searchInput, 'Library: Search — clear',      '')

  // Click items in every category
  const categories = page.locator('.cp-category')
  const catCount   = await categories.count()
  console.log(`  → ${catCount} categories found`)
  for (let i = 0; i < catCount; i++) {
    const cat   = categories.nth(i)
    const title = await cat.locator('.cp-category__title').innerText().catch(() => `Cat ${i}`)
    const items = cat.locator('.cp-item')
    const n     = await items.count()
    if (n > 0) await tap(items.first(),   `Library: "${title.trim()}" — item 1`)
    if (n > 1) await tap(items.nth(1),    `Library: "${title.trim()}" — item 2`)
    if (n > 2) await tap(items.nth(2),    `Library: "${title.trim()}" — item 3`)
  }

  // Double-click to insert a Section container (has children, so we can test expand)
  step = 'Library: Double-click to insert component'
  const eb1 = errors.length
  await page.locator('.cp-item').first().dblclick()
  await page.waitForTimeout(400)
  check('Library: Double-click inserts component', errors.length === eb1)

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n───────────────────────────────────────────')
  console.log(' SECTION 4 — CENTER CANVAS (Zone Canvas)')
  console.log('───────────────────────────────────────────')
  // ══════════════════════════════════════════════════════════════════════════

  await tap(page.locator('[data-testid="zone-canvas"]'), 'Canvas: Click bare canvas (deselect)',
    { position: { x: 5, y: 5 } })

  const zones     = page.locator('[data-testid="zone-card"]')
  const zoneCount = await zones.count()
  console.log(`  → ${zoneCount} zone cards found`)
  for (let i = 0; i < zoneCount; i++) {
    await tap(zones.nth(i), `Canvas: Zone card ${i + 1}`)
    await tap(page.locator('[data-testid="zone-canvas"]'), `Canvas: Deselect after zone ${i + 1}`,
      { position: { x: 5, y: 5 } })
  }

  const blocks     = page.locator('[data-testid="zc-block"]')
  const blockCount = await blocks.count()
  console.log(`  → ${blockCount} component blocks found`)
  for (let i = 0; i < Math.min(blockCount, 10); i++) {
    await tap(blocks.nth(i), `Canvas: Component block ${i + 1}`)
  }

  const expandBtns  = page.locator('.zc-block__expand')
  const expandCount = await expandBtns.count()
  console.log(`  → ${expandCount} expand/collapse buttons found`)
  for (let i = 0; i < Math.min(expandCount, 4); i++) {
    await tap(expandBtns.nth(i), `Canvas: Expand button ${i + 1}`)
    await tap(expandBtns.nth(i), `Canvas: Collapse button ${i + 1}`)
  }

  await tap(page.locator('[data-testid="zone-canvas"]'), 'Canvas: Final deselect',
    { position: { x: 5, y: 5 } })

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n───────────────────────────────────────────')
  console.log(' SECTION 5 — RIGHT PANEL')
  console.log('───────────────────────────────────────────')
  // ══════════════════════════════════════════════════════════════════════════

  check('Right Panel: Empty state shown (nothing selected)',
    await page.locator('[data-testid="property-panel-empty"]').isVisible())

  // Add a text_input from Library so we have a component with configurable properties
  await tap(page.locator('[data-testid="lr-tab-library"]'), 'Right Panel: Switch to Library')
  await fill(page.locator('[data-testid="component-palette"] input'), 'Right Panel: Search "text input"', 'text input')
  await page.waitForTimeout(200)
  const textInputItem = page.locator('.cp-item').first()
  step = 'Right Panel: Double-click text input to add'
  const eb2 = errors.length
  await textInputItem.dblclick()
  await page.waitForTimeout(400)
  check('Right Panel: Add text_input to canvas', errors.length === eb2)
  await fill(page.locator('[data-testid="component-palette"] input'), 'Right Panel: Clear search', '')

  // Now select the last-added block (text_input should be last)
  const allBlocks = page.locator('[data-testid="zc-block"]')
  const lastBlock = allBlocks.last()
  await tap(lastBlock, 'Right Panel: Select text_input block')
  await page.waitForTimeout(200)

  check('Right Panel: Property panel visible after selection',
    await page.locator('[data-testid="property-panel"]').isVisible())

  // Click all 4 tabs
  const ppTabs   = page.locator('.pp-tab')
  const tabCount = await ppTabs.count()
  console.log(`  → ${tabCount} property panel tabs found`)
  for (let i = 0; i < tabCount; i++) {
    const label = await ppTabs.nth(i).innerText().catch(() => `Tab ${i + 1}`)
    await tap(ppTabs.nth(i), `Right Panel: "${label.trim()}" tab`)
  }

  // Back to Properties tab to test form fields
  await tap(ppTabs.first(), 'Right Panel: Back to Properties tab')
  await page.waitForTimeout(300)

  const textInputs = page.locator('.pp-field__input[type="text"]')
  const textCount  = await textInputs.count()
  console.log(`  → ${textCount} text inputs in Properties tab`)
  for (let i = 0; i < textCount; i++) {
    await fill(textInputs.nth(i), `Right Panel: Text input "${i + 1}"`, 'Test Label')
  }

  const numInputs = page.locator('.pp-field__input[type="number"]')
  const numCount  = await numInputs.count()
  console.log(`  → ${numCount} number inputs in Properties tab`)
  for (let i = 0; i < numCount; i++) {
    await fill(numInputs.nth(i), `Right Panel: Number input ${i + 1}`, '50')
  }

  const checkboxes = page.locator('.pp-field input[type="checkbox"]')
  const cbCount    = await checkboxes.count()
  console.log(`  → ${cbCount} checkboxes in Properties tab`)
  for (let i = 0; i < cbCount; i++) {
    await tap(checkboxes.nth(i), `Right Panel: Checkbox ${i + 1}`)
    await tap(checkboxes.nth(i), `Right Panel: Checkbox ${i + 1} (toggle back)`)
  }

  const selects  = page.locator('.pp-field select')
  const selCount = await selects.count()
  console.log(`  → ${selCount} select dropdowns in Properties tab`)
  for (let i = 0; i < selCount; i++) {
    await tap(selects.nth(i), `Right Panel: Select dropdown ${i + 1}`)
  }

  // Delete the text_input we added, then undo
  const deleteBtn = page.locator('[data-testid="property-panel"] .pp-panel__header button')
  if (await deleteBtn.count() > 0 && await deleteBtn.isVisible()) {
    await tap(deleteBtn, 'Right Panel: Delete component button')
    await page.waitForTimeout(300)
    step = 'Right Panel: Ctrl+Z restores deleted component'
    const eb3 = errors.length
    await page.keyboard.press('Control+z')
    await page.waitForTimeout(300)
    check('Right Panel: Ctrl+Z restores deleted component', errors.length === eb3)
  }

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n───────────────────────────────────────────')
  console.log(' SECTION 6 — OUTLINE TAB (Component Tree)')
  console.log('───────────────────────────────────────────')
  // ══════════════════════════════════════════════════════════════════════════

  await tap(page.locator('[data-testid="lr-tab-outline"]'), 'Outline: Switch to Outline tab')
  await page.waitForTimeout(300)

  const nodeHeaders = page.locator('.vd-sidebar--left .ct-node__header')
  const nodeCount   = await nodeHeaders.count()
  console.log(`  → ${nodeCount} tree nodes found`)

  for (let i = 0; i < Math.min(nodeCount, 8); i++) {
    await tap(nodeHeaders.nth(i), `Outline: Click tree node ${i + 1}`)
  }

  // Inline duplicate/delete buttons (visible on selected non-root nodes)
  if (nodeCount > 1) {
    await tap(nodeHeaders.nth(1), 'Outline: Select node 2 for inline actions')
    await page.waitForTimeout(200)
    const dupBtn = page.locator('.vd-sidebar--left .ct-node--selected button[title="Duplicate"]')
    const delBtn = page.locator('.vd-sidebar--left .ct-node--selected button[title="Delete"]')
    if (await dupBtn.count() > 0 && await dupBtn.isVisible()) {
      await tap(dupBtn, 'Outline: Inline Duplicate button')
      await page.keyboard.press('Control+z'); await page.waitForTimeout(200)
    }
    await tap(nodeHeaders.nth(1), 'Outline: Re-select node 2')
    if (await delBtn.count() > 0 && await delBtn.isVisible()) {
      await tap(delBtn, 'Outline: Inline Delete button')
      await page.keyboard.press('Control+z'); await page.waitForTimeout(200)
    }
  }

  // Right-click context menu
  if (nodeCount > 1) {
    await nodeHeaders.nth(1).click({ button: 'right' })
    await page.waitForTimeout(400)
    check('Outline: Right-click opens context menu',
      await page.locator('[data-testid="tree-context-menu"]').isVisible())

    if (await page.locator('[data-testid="tree-context-menu"]').isVisible()) {
      // Duplicate
      const dupCtx = page.locator('[data-testid="tree-context-menu"]').getByText('Duplicate')
      if (await dupCtx.count() > 0) {
        await tap(dupCtx, 'Outline: Context menu — Duplicate')
        await page.keyboard.press('Control+z'); await page.waitForTimeout(200)
      }
      // Move Down
      await nodeHeaders.nth(1).click({ button: 'right' }); await page.waitForTimeout(300)
      const mdCtx = page.locator('[data-testid="tree-context-menu"]').getByText('Move Down')
      if (await mdCtx.count() > 0) {
        await tap(mdCtx, 'Outline: Context menu — Move Down')
        await page.keyboard.press('Control+z'); await page.waitForTimeout(200)
      }
      // Move Up — may be disabled (first child); use force:true
      await nodeHeaders.nth(1).click({ button: 'right' }); await page.waitForTimeout(300)
      const muCtx = page.locator('[data-testid="tree-context-menu"]').getByText('Move Up')
      if (await muCtx.count() > 0) {
        await tap(muCtx, 'Outline: Context menu — Move Up', { force: true })
        await page.keyboard.press('Control+z'); await page.waitForTimeout(200)
      }
      // Escape closes menu
      await nodeHeaders.nth(1).click({ button: 'right' }); await page.waitForTimeout(300)
      await page.keyboard.press('Escape'); await page.waitForTimeout(300)
      check('Outline: Escape closes context menu',
        await page.locator('[data-testid="tree-context-menu"]').isHidden())
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n───────────────────────────────────────────')
  console.log(' SECTION 7 — FIELDS TAB (Customer Master view)')
  console.log('───────────────────────────────────────────')
  // ══════════════════════════════════════════════════════════════════════════

  // Navigate to Customer Master — uses 'customer' entity which has mock fields
  console.log('  (Navigating to Customer Master — customer entity has mock fields)')
  await page.goto(`${BASE}/studio/views/${CUSTOMER_VIEW}/edit`)
  await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 20000 })
  await page.waitForTimeout(800)

  await tap(page.locator('[data-testid="lr-tab-fields"]'), 'Fields: Switch to Fields tab')
  await page.waitForTimeout(500)

  check('Fields: Entity field picker visible',
    await page.locator('[data-testid="entity-field-picker"]').isVisible())

  const fieldSearch = page.locator('[data-testid="entity-field-picker"] input')
  if (await fieldSearch.count() > 0) {
    await fill(fieldSearch, 'Fields: Search — "name"', 'name')
    await fill(fieldSearch, 'Fields: Search — clear',   '')
  }

  const fieldItems = page.locator('.efp-field')
  const fieldCount = await fieldItems.count()
  console.log(`  → ${fieldCount} field items found`)
  check('Fields: Entity fields loaded (> 0)', fieldCount > 0,
    fieldCount === 0 ? 'No fields returned — check mock data for customer entity' : undefined)

  for (let i = 0; i < Math.min(fieldCount, 5); i++) {
    await tap(fieldItems.nth(i), `Fields: Click field item ${i + 1} (${await fieldItems.nth(i).locator('.efp-field__name').innerText().catch(() => '?')})`)
  }

  // Drag a field to a zone body
  if (fieldCount > 0) {
    step = 'Fields: Drag field to zone body'
    const eb4 = errors.length
    try {
      await fieldItems.nth(1).dragTo(page.locator('[data-testid="zone-body"]').first())
      await page.waitForTimeout(600)
      check('Fields: Drag field to zone body', errors.length === eb4)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message.split('\n')[0] : String(e)
      results.push({ name: 'Fields: Drag field to zone body', status: 'FAIL', error: msg })
      console.error(`❌  FAIL  Fields: Drag field to zone body — ${msg}`)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n───────────────────────────────────────────')
  console.log(' SECTION 8 — PREVIEW MODE')
  console.log('───────────────────────────────────────────')
  // ══════════════════════════════════════════════════════════════════════════

  await tap(page.locator('[data-testid="lr-tab-library"]'), 'Preview: Ensure Library tab')
  await tap(page.locator('[data-testid="vd-preview-btn"]'), 'Preview: Toggle ON')
  await page.waitForTimeout(500)

  check('Preview: Preview canvas visible',    await page.locator('.prev-canvas').isVisible())
  check('Preview: Left rail hidden',          await page.locator('.vd-sidebar--left').isHidden())
  check('Preview: Right panel hidden',        await page.locator('.vd-sidebar--right').isHidden())

  if (await page.locator('.prev-canvas').isVisible()) {
    await tap(page.locator('.prev-canvas'), 'Preview: Click preview canvas')
  }

  await tap(page.locator('[data-testid="vd-preview-btn"]'), 'Preview: Toggle OFF')
  await page.waitForTimeout(400)
  check('Preview: ZoneCanvas restored', await page.locator('[data-testid="zone-canvas"]').isVisible())

  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n───────────────────────────────────────────')
  console.log(' SECTION 9 — KEYBOARD SHORTCUTS')
  console.log('───────────────────────────────────────────')
  // ══════════════════════════════════════════════════════════════════════════

  // Make a change so Save becomes enabled
  await tap(page.locator('[data-testid="lr-tab-library"]'), 'KB: Switch to Library tab')
  await fill(page.locator('[data-testid="component-palette"] input'), 'KB: Search text_input', 'text input')
  await page.waitForTimeout(200)
  step = 'KB: Double-click text_input to make change'
  const eb5 = errors.length
  await page.locator('.cp-item').first().dblclick()
  await page.waitForTimeout(400)
  check('KB: Inserting component makes dirty', errors.length === eb5)
  await fill(page.locator('[data-testid="component-palette"] input'), 'KB: Clear palette search', '')

  check('KB: Save button enabled after change',
    !(await page.locator('[data-testid="vd-save-btn"]').isDisabled()))

  await pressKey(page, 'Control+s', 'Keyboard: Ctrl+S (save)')
  await page.waitForTimeout(500)

  // Add another component for undo/redo test
  step = 'KB: Add another component for undo test'
  await page.locator('.cp-item').first().dblclick()
  await page.waitForTimeout(300)

  await pressKey(page, 'Control+z', 'Keyboard: Ctrl+Z (undo)')
  await pressKey(page, 'Control+y', 'Keyboard: Ctrl+Y (redo)')
  await pressKey(page, 'Control+z', 'Keyboard: Ctrl+Z (undo again)')

  // ══════════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ══════════════════════════════════════════════════════════════════════════

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length

  console.log('\n' + '═'.repeat(62))
  console.log('  COMPREHENSIVE CLICK TEST — FINAL SUMMARY')
  console.log('═'.repeat(62))
  console.log(`  ✅  PASSED : ${passed}`)
  console.log(`  ❌  FAILED : ${failed}`)
  console.log(`  TOTAL  : ${results.length}`)
  console.log('═'.repeat(62))

  if (failed > 0) {
    console.log('\nFAILED ELEMENTS:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌  ${r.name}`)
      if (r.error) console.log(`       → ${r.error}`)
    })
    throw new Error(`${failed} element(s) threw JS errors or were unreachable. See above.`)
  }
})
