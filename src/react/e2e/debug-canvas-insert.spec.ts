/**
 * Diagnostic test: check why data_table cannot be inserted into canvas via double-click.
 * Run: npx playwright test e2e/debug-canvas-insert.spec.ts --config=playwright.headed.config.ts
 */
import { test } from '@playwright/test'

const BASE = '/Excellon-NexAI'
const VIEWS_URL = `${BASE}/studio/views`
const API = 'http://localhost:9080/api/v1'
const DEV_HEADERS = {
  'x-tenant-id': '00000000-0000-0000-0000-000000000001',
  'x-user-id': '00000000-0000-0000-0000-000000000001',
  'x-role': 'admin',
}

test('Diagnose: why data_table double-click fails after toolbar', async ({ page }) => {
  await page.bringToFront()

  // Capture ALL console messages from the browser
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('canInsert') || msg.text().includes('registry') || msg.text().includes('allowed')) {
      console.log(`  [BROWSER ${msg.type().toUpperCase()}]: ${msg.text()}`)
    }
  })

  // Step 1: Create a fresh product view
  const createResp = await page.request.post(`${API}/studio/views`, {
    headers: { ...DEV_HEADERS, 'Content-Type': 'application/json' },
    data: JSON.stringify({
      surface_type: 'standard_crud',
      primary_entity: 'product',
      view_label: 'Product List Debug',
      view_code: 'product_list_debug',
    }),
  })
  const view = await createResp.json()
  console.log('Created view:', view.artifact_id, 'entity:', view.primary_entity)

  // Step 2: Navigate to View Designer
  await page.goto(`${BASE}/studio/views/${view.artifact_id}/edit`)
  await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
  await page.waitForSelector('.cp-item', { timeout: 15000 })
  await page.waitForTimeout(2000)

  // Step 3: Check store state via evaluate
  const storeState = await page.evaluate(() => {
    // Try to access Zustand store state
    // Look for it in the React devtools global or window
    const anyWindow = window as Record<string, unknown>

    // Check if any store is exposed
    const storeKeys = Object.keys(anyWindow).filter(k =>
      k.includes('store') || k.includes('Store') || k.includes('zustand')
    )
    return {
      storeKeys,
      hasCanvasStore: !!anyWindow.__canvasStore,
    }
  })
  console.log('Store debug:', JSON.stringify(storeState))

  // Step 4: Check component palette items and their disabled status
  const paletteState = await page.evaluate(() => {
    const items = document.querySelectorAll('.cp-item')
    const disabled = document.querySelectorAll('.cp-item--disabled')
    const enabled = document.querySelectorAll('.cp-item:not(.cp-item--disabled)')

    const enabledList = Array.from(enabled).map(el => {
      const nameEl = el.querySelector('.cp-item__name')
      return nameEl?.textContent?.trim() ?? 'unknown'
    }).slice(0, 10)

    const disabledList = Array.from(disabled).map(el => {
      const nameEl = el.querySelector('.cp-item__name')
      return nameEl?.textContent?.trim() ?? 'unknown'
    }).slice(0, 10)

    return { total: items.length, enabled: enabled.length, disabled: disabled.length, enabledList, disabledList }
  })
  console.log('BEFORE toolbar insert - Palette state:', JSON.stringify(paletteState, null, 2))

  // Step 5: Search for toolbar and check its status
  const paletteSearch = page.locator('[data-testid="component-palette"] input')
  await paletteSearch.fill('toolbar')
  await page.waitForTimeout(600)

  const toolbarState = await page.evaluate(() => {
    const toolbarItem = document.querySelector('.cp-item:not(.cp-item--disabled)')
    const toolbarDisabled = document.querySelector('.cp-item--disabled')
    return {
      toolbarEnabled: toolbarItem?.querySelector('.cp-item__name')?.textContent,
      toolbarDisabled: toolbarDisabled?.querySelector('.cp-item__name')?.textContent,
    }
  })
  console.log('Toolbar palette state:', JSON.stringify(toolbarState))

  // Step 6: Double-click toolbar
  const toolbarItem = page.locator('.cp-item:not(.cp-item--disabled)').first()
  if (await toolbarItem.isVisible()) {
    const zonesBefore = await page.locator('[data-testid="zone-card"]').count()
    await toolbarItem.dblclick()
    await page.waitForTimeout(800)
    const zonesAfter = await page.locator('[data-testid="zone-card"]').count()
    console.log(`Toolbar double-click: zones ${zonesBefore}→${zonesAfter}`)
  }

  // Step 7: Now search for data_table and check its status
  await paletteSearch.fill('data table')
  await page.waitForTimeout(600)

  const dataTableState = await page.evaluate(() => {
    const allItems = document.querySelectorAll('.cp-item')
    return Array.from(allItems).map(el => ({
      name: el.querySelector('.cp-item__name')?.textContent,
      disabled: el.classList.contains('cp-item--disabled'),
      classes: el.className,
    }))
  })
  console.log('AFTER toolbar insert - Data table palette state:')
  dataTableState.forEach(item => {
    console.log(`  ${item.disabled ? '❌ DISABLED' : '✅ ENABLED'}: "${item.name}" [${item.classes}]`)
  })

  // Step 8: Try double-clicking data_table and check console for errors
  const dataTableItem = page.locator('.cp-item').filter({ hasText: 'Data Table' }).first()
  if (await dataTableItem.isVisible()) {
    const isDisabled = await dataTableItem.getAttribute('class').then(c => c?.includes('disabled') ?? false)
    console.log(`Data Table item disabled: ${isDisabled}`)

    if (!isDisabled) {
      const zonesBefore = await page.locator('[data-testid="zone-card"]').count()
      await dataTableItem.dblclick()
      await page.waitForTimeout(800)
      const zonesAfter = await page.locator('[data-testid="zone-card"]').count()
      console.log(`Data Table double-click: zones ${zonesBefore}→${zonesAfter}`)
    } else {
      console.log('Data Table is DISABLED — rootAllowed check failed')
    }
  }

  // Cleanup
  await page.request.delete(`${API}/studio/views/${view.artifact_id}`, { headers: DEV_HEADERS }).catch(() => {})
})
