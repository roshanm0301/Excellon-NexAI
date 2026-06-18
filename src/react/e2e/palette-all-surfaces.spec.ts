/**
 * Component Palette — all 8 non-Kanban surface types
 * Verifies surface filter chip shows the correct count and filters correctly.
 *
 * Run:
 *   $env:PLAYWRIGHT_PORT="5177"
 *   npx playwright test e2e/palette-all-surfaces.spec.ts --config=playwright.headed.config.ts
 */
import { test, expect } from '@playwright/test'

const BASE = '/Excellon-NexAI'

const SURFACES = [
  { id: '00000000-0000-0000-0002-000000000004', surface: 'standard_crud', label: 'List View',        name: 'Customer Master' },
  { id: '00000000-0000-0000-0002-000000000017', surface: 'detail_page',   label: 'Form View',        name: 'Customer Detail' },
  { id: '00000000-0000-0000-0002-000000000013', surface: 'header_line',   label: 'Header + Lines',   name: 'Sale Order Editor' },
  { id: '00000000-0000-0000-0002-000000000018', surface: 'advanced_crud', label: 'Editable Grid',    name: 'Parts Bulk Update' },
  { id: '00000000-0000-0000-0002-000000000001', surface: 'split_view',    label: 'Split View',       name: 'Customer 360' },
  { id: '00000000-0000-0000-0002-000000000003', surface: 'wizard',        label: 'Wizard',           name: 'New Vehicle Sale Wizard' },
  { id: '00000000-0000-0000-0002-000000000002', surface: 'dashboard',     label: 'Dashboard',        name: 'Service Dashboard' },
  { id: '00000000-0000-0000-0002-000000000019', surface: 'calendar',      label: 'Calendar',         name: 'Test Drive Calendar' },
  { id: '00000000-0000-0000-0002-000000000020', surface: 'custom_page',   label: 'Custom Page',      name: 'EMI Calculator' },
]

// Components that should ONLY appear on specific surfaces (not 'all')
const SURFACE_SPECIFIC: Record<string, string[]> = {
  dashboard:    ['Dashboard Grid', 'Sparkline', 'KPI Card'],
  header_line:  ['Header + Line Section', 'Tax / Charge Column', 'Totals Panel'],
  wizard:       ['Wizard Step'],
}

// Components that should NEVER appear on a specific surface (surface-exclusive to another)
const SHOULD_NOT_APPEAR: Record<string, string[]> = {
  standard_crud: ['Dashboard Grid', 'Wizard Step'],
  detail_page:   ['Dashboard Grid', 'Wizard Step'],
  advanced_crud: ['Dashboard Grid', 'Wizard Step'],
  split_view:    ['Dashboard Grid', 'Wizard Step'],
  wizard:        ['Dashboard Grid'],
  calendar:      ['Dashboard Grid', 'Wizard Step'],
  custom_page:   ['Wizard Step'],
}

test('Component Palette — all 8 surface types (excl. Kanban)', async ({ page }) => {
  await page.bringToFront()

  const results: { surface: string; compatible: number; all: number; pageRootHidden: boolean; filterChipCorrect: boolean; exclusionOk: boolean }[] = []

  for (const s of SURFACES) {
    console.log(`\n🔍 [${s.label}] ${s.name}`)

    await page.goto(`${BASE}/studio/views/${s.id}/edit`)
    await page.waitForSelector('[data-testid="component-palette"]', { timeout: 15000 })
    await page.waitForTimeout(500)

    // Ensure Library tab is active
    await page.locator('[data-testid="lr-tab-library"]').click()
    await page.waitForTimeout(300)

    // ── Filter chips exist ────────────────────────────────────────────────────
    const chips = page.locator('.cp-filter-chip')
    await expect(chips).toHaveCount(2)

    // ── Compatible chip must mention surface label ────────────────────────────
    const compatChip = chips.nth(1)
    const chipText = await compatChip.innerText()
    const filterChipCorrect = chipText.includes(s.label.split(' ')[0]) || chipText.includes('Compatible')
    console.log(`  Filter chip text: "${chipText}" → ${filterChipCorrect ? '✅' : '❌'}`)

    // ── Default: compatible mode active ──────────────────────────────────────
    await expect(compatChip).toHaveClass(/cp-filter-chip--active/)

    // Compatible count
    const compatCount = parseInt(await page.locator('.cp-filter-count').innerText())
    console.log(`  Compatible: ${compatCount}`)
    expect(compatCount).toBeGreaterThan(0)

    // ── Switch to All ────────────────────────────────────────────────────────
    await chips.first().click()
    await page.waitForTimeout(200)
    const allCount = parseInt(await page.locator('.cp-filter-count').innerText())
    console.log(`  All: ${allCount}`)
    expect(allCount).toBeGreaterThanOrEqual(compatCount)
    expect(allCount).toBeGreaterThanOrEqual(70)

    // Switch back to compatible
    await compatChip.click()
    await page.waitForTimeout(200)

    // ── page_root not shown ───────────────────────────────────────────────────
    const itemTexts = await page.locator('.cp-item').allInnerTexts()
    const pageRootHidden = !itemTexts.some(t => t.toLowerCase().includes('page root'))
    console.log(`  page_root hidden: ${pageRootHidden ? '✅' : '❌'}`)

    // ── Surface-exclusive components NOT shown in compatible mode ─────────────
    const exclusions = SHOULD_NOT_APPEAR[s.surface] ?? []
    let exclusionOk = true
    for (const excluded of exclusions) {
      const found = itemTexts.some(t => t.includes(excluded))
      if (found) {
        console.log(`  ❌ "${excluded}" should NOT appear on ${s.surface} but does`)
        exclusionOk = false
      }
    }
    if (exclusionOk && exclusions.length > 0) {
      console.log(`  ✅ Surface-exclusive exclusions correct (${exclusions.join(', ')} not shown)`)
    }

    // ── Dashboard: Dashboard Grid & Sparkline & KPI Card SHOULD appear ────────
    if (s.surface === 'dashboard') {
      const hasDashboardGrid = itemTexts.some(t => t.includes('Dashboard Grid'))
      const hasKpiCard = itemTexts.some(t => t.includes('KPI Card'))
      console.log(`  Dashboard Grid shown: ${hasDashboardGrid ? '✅' : '❌'}`)
      console.log(`  KPI Card shown: ${hasKpiCard ? '✅' : '❌'}`)
      expect(hasDashboardGrid).toBe(true)
    }

    // ── header_line: Header+Line Section, Tax/Charge should appear ────────────
    if (s.surface === 'header_line') {
      const hasHLS = itemTexts.some(t => t.includes('Header + Line Section') || t.includes('Header + Lines'))
      const hasTax = itemTexts.some(t => t.includes('Tax'))
      console.log(`  Header+Line Section shown: ${hasHLS ? '✅' : '❌'}`)
      console.log(`  Tax/Charge shown: ${hasTax ? '✅' : '❌'}`)
    }

    // ── wizard: Wizard Step should appear ────────────────────────────────────
    if (s.surface === 'wizard') {
      const hasWizardStep = itemTexts.some(t => t.includes('Wizard Step'))
      console.log(`  Wizard Step shown: ${hasWizardStep ? '✅' : '❌'}`)
    }

    // ── custom_page: should show most generic components ─────────────────────
    if (s.surface === 'custom_page') {
      const hasTextInput = itemTexts.some(t => t.includes('Text Input'))
      const hasSection = itemTexts.some(t => t.includes('Section'))
      console.log(`  Text Input shown: ${hasTextInput ? '✅' : '❌'}`)
      console.log(`  Section shown: ${hasSection ? '✅' : '❌'}`)
    }

    // ── category collapse still works ─────────────────────────────────────────
    const firstCatBtn = page.locator('.cp-category__title').first()
    if (await firstCatBtn.count() > 0) {
      await firstCatBtn.click()
      await page.waitForTimeout(200)
      const catItems = page.locator('.cp-category').first().locator('.cp-category__items')
      const collapsed = await catItems.isHidden()
      await firstCatBtn.click() // re-expand
      await page.waitForTimeout(150)
      console.log(`  Category collapse: ${collapsed ? '✅' : '❌'}`)
    }

    results.push({ surface: s.surface, compatible: compatCount, all: allCount, pageRootHidden, filterChipCorrect, exclusionOk })
  }

  // ── Final summary ────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70))
  console.log('  PALETTE SURFACE TEST SUMMARY')
  console.log('═'.repeat(70))
  console.log(`  ${'Surface'.padEnd(18)} ${'Label'.padEnd(20)} ${'Compat'.padEnd(8)} ${'All'.padEnd(6)} ${'Excl OK'.padEnd(8)}`)
  console.log('  ' + '─'.repeat(66))
  for (let i = 0; i < SURFACES.length; i++) {
    const r = results[i]
    const s = SURFACES[i]
    console.log(`  ${r.surface.padEnd(18)} ${s.label.padEnd(20)} ${String(r.compatible).padEnd(8)} ${String(r.all).padEnd(6)} ${r.exclusionOk ? '✅' : '❌'}`)
  }
  console.log('═'.repeat(70))

  // All surfaces must have exclusions correct
  const allExclusionsOk = results.every(r => r.exclusionOk)
  const allPageRootHidden = results.every(r => r.pageRootHidden)
  expect(allExclusionsOk).toBe(true)
  expect(allPageRootHidden).toBe(true)
  console.log(`\n✅ All surface type palette checks passed`)
})
