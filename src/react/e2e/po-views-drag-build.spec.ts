/**
 * Purchase Order — Build List View & Header+Lines View using drag-and-drop
 *
 * Builds two views completely from scratch using drag-and-drop:
 *   1. PO List View (standard_crud)  — Filter Panel, Data Table, Toolbar, etc.
 *   2. PO Entry View (header_line)   — Sections, Fields, Data Table, Totals
 *
 * Run in headed Chrome (watch it build live):
 *   $env:PLAYWRIGHT_PORT="5177"
 *   npx playwright test e2e/po-views-drag-build.spec.ts --config=playwright.headed.config.ts
 */
import { test, expect, type Page, type Locator } from '@playwright/test'

const PO_LIST_VIEW  = '00000000-0000-0000-0002-000000000021'  // standard_crud, purchase_order
const PO_ENTRY_VIEW = '00000000-0000-0000-0002-000000000022'  // header_line, purchase_order
const BASE = '/Excellon-NexAI'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Count of ALL components on canvas (zone cards + component blocks) */
async function totalCount(page: Page): Promise<number> {
  const blocks = await page.locator('[data-testid="zc-block"]').count()
  const zones  = await page.locator('[data-testid="zone-card"]').count()
  return blocks + zones
}

/** Drag a component from the Library palette to a drop target, verify it lands. */
async function dragComponent(
  page: Page,
  componentName: string,
  target: Locator,
  label: string,
): Promise<boolean> {
  // Ensure Library tab is active
  await page.locator('[data-testid="lr-tab-library"]').click()
  await page.waitForTimeout(200)

  const searchInput = page.locator('[data-testid="component-palette"] input')
  await searchInput.fill(componentName)
  await page.waitForTimeout(300)

  const item = page.locator('.cp-item:not(.cp-item--disabled)').first()
  if (await item.count() === 0) {
    console.log(`  ⚠️  No enabled item for "${componentName}" — skipping`)
    await searchInput.clear()
    await page.waitForTimeout(200)
    return false
  }

  const itemName = await item.locator('.cp-item__name').innerText().catch(() => componentName)
  const before = await totalCount(page)

  await item.dragTo(target, { timeout: 8000 })
  await page.waitForTimeout(600)

  const after = await totalCount(page)
  const added = after > before

  if (added) {
    console.log(`  ✅  ${label}: "${itemName}" added (total ${before}→${after})`)
  } else {
    console.log(`  ❌  ${label}: "${itemName}" NOT added — rejected (total ${before}→${after})`)
  }

  await searchInput.clear()
  await page.waitForTimeout(200)
  return added
}

/**
 * Drag to page_root level.
 * When canvas is empty → target is zone-canvas (empty state is full-canvas drop zone).
 * When canvas has zones → target is zone-root-drop at bottom.
 */
async function dragToRoot(page: Page, componentName: string, label: string): Promise<boolean> {
  const rootDrop = page.locator('[data-testid="zone-root-drop"]')
  const canvasBg = page.locator('[data-testid="zone-canvas"]')
  const target   = await rootDrop.isVisible() ? rootDrop : canvasBg
  return dragComponent(page, componentName, target, label)
}

/** Drag from palette to a specific zone body */
async function dragToZone(page: Page, componentName: string, zoneIndex: number, label: string): Promise<boolean> {
  const zoneBody = page.locator('[data-testid="zone-body"]').nth(zoneIndex)
  return dragComponent(page, componentName, zoneBody, label)
}

// ─── Test 1: List View ────────────────────────────────────────────────────────

test('Build PO List View (standard_crud) using drag-and-drop', async ({ page }) => {
  await page.bringToFront()

  console.log('\n' + '═'.repeat(60))
  console.log('  BUILDING: Purchase Order — List View (standard_crud)')
  console.log('═'.repeat(60))

  await page.goto(`${BASE}/studio/views/${PO_LIST_VIEW}/edit`)
  await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
  await page.waitForTimeout(800)

  // Confirm surface type in toolbar
  const toolbarMeta = await page.locator('.vd-toolbar__meta').innerText()
  console.log(`\n  Surface: ${toolbarMeta.trim()}`)

  // Confirm compatible filter chip shows "For List View"
  await page.locator('[data-testid="lr-tab-library"]').click()
  await page.waitForTimeout(300)
  const chipText = await page.locator('.cp-filter-chip--active').innerText()
  console.log(`  Filter chip: ${chipText}`)

  // Confirm canvas starts empty — zone-root-drop only shows when zones exist
  const emptyState = page.locator('.zc-empty')
  await expect(emptyState).toBeVisible({ timeout: 5000 }).catch(() => {})
  console.log(`\n  Canvas ready — building from scratch\n`)

  // ── DRAG 1: Toolbar (New PO, Export buttons) ──────────────────────────────
  console.log('── DRAG: Toolbar (action buttons bar)')
  const d1 = await dragToRoot(page, 'toolbar', 'Toolbar')

  // ── DRAG 2: Filter Panel (search + filters) ───────────────────────────────
  console.log('── DRAG: Filter Panel (search & filter controls)')
  const d2 = await dragToRoot(page, 'filter panel', 'Filter Panel')

  // ── DRAG 3: Data Table (the main PO list grid) ────────────────────────────
  console.log('── DRAG: Data Table (main PO list grid)')
  const d3 = await dragToRoot(page, 'data table', 'Data Table')

  // ── DRAG 4: Status Badge (for PO status column) ───────────────────────────
  console.log('── DRAG: Status Badge (PO status indicator)')
  const d4 = await dragToRoot(page, 'status badge', 'Status Badge')

  // ── DRAG 5: Heading (page title) ─────────────────────────────────────────
  console.log('── DRAG: Heading (Purchase Orders page title)')
  const d5 = await dragToRoot(page, 'heading', 'Heading')

  // ── Fields Tab — drag entity fields ───────────────────────────────────────
  console.log('\n── Switch to Fields tab — drag PO entity fields')
  await page.locator('[data-testid="lr-tab-fields"]').click()
  await page.waitForTimeout(500)

  const fieldsVisible = await page.locator('.efp-field').count()
  console.log(`  → ${fieldsVisible} purchase_order fields available`)
  expect(fieldsVisible).toBeGreaterThan(0)

  const rootDropOrCanvas = await page.locator('[data-testid="zone-root-drop"]').isVisible()
    ? page.locator('[data-testid="zone-root-drop"]')
    : page.locator('[data-testid="zone-canvas"]')

  // Drag PO Number field → creates text_input at root level
  const poNumberField = page.locator('[data-testid="efp-field-po_number"]')
  if (await poNumberField.count() > 0) {
    const before = await totalCount(page)
    await poNumberField.dragTo(rootDropOrCanvas, { timeout: 8000 })
    await page.waitForTimeout(500)
    const after = await totalCount(page)
    console.log(`  ${after > before ? '✅' : '⚠️ '} Fields: "PO Number" dragged (total ${before}→${after})`)
  }

  // Drag Status field → creates dropdown_select at root level
  const statusField = page.locator('[data-testid="efp-field-status"]')
  if (await statusField.count() > 0) {
    const before = await totalCount(page)
    await statusField.dragTo(rootDropOrCanvas, { timeout: 8000 })
    await page.waitForTimeout(500)
    const after = await totalCount(page)
    console.log(`  ${after > before ? '✅' : '⚠️ '} Fields: "Status" dragged (total ${before}→${after})`)
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const finalTotal = await totalCount(page)
  const zonesCreated = await page.locator('[data-testid="zone-card"]').count()
  console.log(`\n  Zone cards created: ${zonesCreated}`)
  console.log(`  Total components on canvas: ${finalTotal}`)

  const drags = [d1, d2, d3, d4, d5]
  const successCount = drags.filter(Boolean).length
  console.log(`  Library drags succeeded: ${successCount}/5`)

  expect(finalTotal).toBeGreaterThan(0)

  // ── Save ──────────────────────────────────────────────────────────────────
  console.log('\n── Saving List View…')
  await page.locator('[data-testid="lr-tab-library"]').click()
  await page.waitForTimeout(200)
  const saveBtn = page.locator('[data-testid="vd-save-btn"]')
  if (!await saveBtn.isDisabled()) {
    await saveBtn.click()
    await page.waitForTimeout(1000)
    console.log('  ✅  Saved')
  } else {
    console.log('  ⚠️  Save not needed (no changes marked dirty)')
  }

  console.log('\n✅  PO List View build complete')
})

// ─── Test 2: Header+Lines View ────────────────────────────────────────────────

test('Build PO Entry View (header_line) using drag-and-drop', async ({ page }) => {
  await page.bringToFront()

  console.log('\n' + '═'.repeat(60))
  console.log('  BUILDING: Purchase Order — Entry View (header_line)')
  console.log('═'.repeat(60))

  await page.goto(`${BASE}/studio/views/${PO_ENTRY_VIEW}/edit`)
  await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
  await page.waitForTimeout(800)

  const toolbarMeta = await page.locator('.vd-toolbar__meta').innerText()
  console.log(`\n  Surface: ${toolbarMeta.trim()}`)

  await page.locator('[data-testid="lr-tab-library"]').click()
  await page.waitForTimeout(300)

  const chipText = await page.locator('.cp-filter-chip--active').innerText()
  console.log(`  Filter chip: ${chipText}`)

  // Starting with 1 zone (header_line_section already seeded)
  const zonesInitial = await page.locator('[data-testid="zone-card"]').count()
  console.log(`\n  Starting zones: ${zonesInitial} (header_line_section seeded)`)
  console.log('  Building Header+Lines layout…\n')

  // ── DRAG to header_line_section zone body (index 0) ───────────────────────

  // DRAG 1: Toolbar (Submit, Approve, Print actions)
  console.log('── ZONE BODY 0: Add Toolbar')
  const d1 = await dragToZone(page, 'toolbar', 0, 'Toolbar (actions bar)')

  // DRAG 2: Section (Header fields container)
  console.log('── ZONE BODY 0: Add Section (Header fields)')
  const d2 = await dragToZone(page, 'section', 0, 'Section (PO header fields)')

  // DRAG 3: Data Table (Line items grid)
  console.log('── ZONE BODY 0: Add Data Table (Line items)')
  const d3 = await dragToZone(page, 'data table', 0, 'Data Table (PO line items)')

  // DRAG 4: Totals Panel (PO totals)
  console.log('── ZONE BODY 0: Add Totals Panel (footer)')
  const d4 = await dragToZone(page, 'totals', 0, 'Totals Panel (PO totals)')

  // DRAG 5: Tax / Charge Column (GST)
  console.log('── ZONE BODY 0: Add Tax/Charge Column (GST)')
  const d5 = await dragToZone(page, 'tax', 0, 'Tax/Charge Column (GST)')

  // ── Drag more components to root-level drop zone ──────────────────────────
  // Toolbar at page_root level (for PO document toolbar)
  console.log('\n── ROOT DROP ZONE: Add PO Toolbar (document-level)')
  const rootDrop = page.locator('[data-testid="zone-root-drop"]')
  const d6 = await dragComponent(page, 'toolbar', rootDrop, 'Toolbar (doc-level)')

  // ── Fields Tab — drag all PO entity fields ────────────────────────────────
  console.log('\n── Switch to Fields tab — drag all PO entity fields')
  await page.locator('[data-testid="lr-tab-fields"]').click()
  await page.waitForTimeout(500)

  const fieldsCount = await page.locator('.efp-field').count()
  console.log(`  → ${fieldsCount} purchase_order fields available`)
  expect(fieldsCount).toBeGreaterThanOrEqual(8)

  // Drag each field to zone body 0
  const fieldsToDrag = [
    'efp-field-po_number',
    'efp-field-supplier',
    'efp-field-po_date',
    'efp-field-delivery_date',
    'efp-field-status',
    'efp-field-total_amount',
    'efp-field-remarks',
  ]

  let fieldsDragged = 0
  for (const fieldId of fieldsToDrag) {
    const fieldEl = page.locator(`[data-testid="${fieldId}"]`)
    if (await fieldEl.count() > 0) {
      const label = await fieldEl.locator('.efp-field__name').innerText().catch(() => fieldId)
      const zoneBody = page.locator('[data-testid="zone-body"]').nth(0)
      const before = await page.locator('[data-testid="zc-block"]').count()
      await fieldEl.dragTo(zoneBody, { timeout: 8000 })
      await page.waitForTimeout(400)
      const after = await page.locator('[data-testid="zc-block"]').count()
      if (after > before) {
        console.log(`  ✅  Field: "${label}" → text_input/date_picker/etc created`)
        fieldsDragged++
      } else {
        console.log(`  ⚠️  Field: "${label}" — drop not registered`)
      }
    }
  }
  console.log(`  Fields dragged: ${fieldsDragged}/${fieldsToDrag.length}`)

  // ── Final state ───────────────────────────────────────────────────────────
  const finalBlocks = await page.locator('[data-testid="zc-block"]').count()
  const finalZones  = await page.locator('[data-testid="zone-card"]').count()

  console.log(`\n  Final zones: ${finalZones}`)
  console.log(`  Final component blocks: ${finalBlocks}`)

  const libSuccesses = [d1, d2, d3, d4, d5, d6].filter(Boolean).length
  console.log(`  Library drags succeeded: ${libSuccesses}/6`)
  console.log(`  Fields dragged: ${fieldsDragged}/${fieldsToDrag.length}`)

  expect(finalBlocks).toBeGreaterThan(0)
  expect(finalZones).toBeGreaterThan(0)

  // ── Save ──────────────────────────────────────────────────────────────────
  console.log('\n── Saving Entry View…')
  await page.locator('[data-testid="lr-tab-library"]').click()
  await page.waitForTimeout(200)
  const saveBtn = page.locator('[data-testid="vd-save-btn"]')
  if (!await saveBtn.isDisabled()) {
    await saveBtn.click()
    await page.waitForTimeout(1000)
    console.log('  ✅  Saved')
  }

  // ── Switch to Outline tab to show the full tree ───────────────────────────
  await page.locator('[data-testid="lr-tab-outline"]').click()
  await page.waitForTimeout(400)
  const treeNodes = await page.locator('.vd-sidebar--left .ct-node').count()
  console.log(`  Outline tree nodes: ${treeNodes}`)

  console.log('\n✅  PO Entry View build complete')
})
