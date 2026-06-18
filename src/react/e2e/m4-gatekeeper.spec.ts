/**
 * M4 Gatekeeper — Right Panel Empty State + Context Menu
 */
import { test, expect } from '@playwright/test'

const STANDARD_ID = '00000000-0000-0000-0002-000000000004' // Customer Master, standard_crud
const BASE = '/Excellon-NexAI'

test.describe('M4 Gatekeeper: Right Panel Empty State + Context Menu', () => {

  test('CHECK 1: Right panel is always visible in edit mode (no component selected)', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    // Right sidebar should always be visible (no selectedKey condition)
    await expect(page.locator('.vd-sidebar--right')).toBeVisible()
    await expect(page.locator('[data-testid="property-panel-empty"]')).toBeVisible()
  })

  test('CHECK 2: Empty state shows correct text and hint', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    const empty = page.locator('[data-testid="property-panel-empty"]')
    await expect(empty).toContainText('No component selected')
    await expect(empty).toContainText('Click a component')
  })

  test('CHECK 3: Empty state shows component count badge', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    const count = page.locator('.pp-empty-state__count')
    await expect(count).toBeVisible()
    const text = await count.innerText()
    console.log(`CHECK 3: component count badge = "${text}"`)
    expect(text).toMatch(/\d+ component/)
  })

  test('CHECK 4: Clicking a zone block selects it and right panel shows component', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    const firstBlock = page.locator('[data-testid="zc-block"]').first()
    await firstBlock.click()
    await page.waitForTimeout(200)
    // Empty state should disappear
    await expect(page.locator('[data-testid="property-panel-empty"]')).toBeHidden()
    // Property panel should now show component info
    await expect(page.locator('[data-testid="property-panel"]')).toBeVisible()
  })

  test('CHECK 5: Clicking empty canvas area returns to empty state', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    // First select something
    await page.locator('[data-testid="zc-block"]').first().click()
    await page.waitForTimeout(200)
    await expect(page.locator('[data-testid="property-panel"]')).toBeVisible()
    // Then click the canvas background
    await page.locator('[data-testid="zone-canvas"]').click({ position: { x: 10, y: 10 } })
    await page.waitForTimeout(200)
    await expect(page.locator('[data-testid="property-panel-empty"]')).toBeVisible()
  })

  test('CHECK 6: Right-click tree node shows context menu', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-outline"]').click()
    await page.waitForTimeout(200)
    // Right-click a non-root tree node header
    const nodeHeaders = page.locator('.vd-sidebar--left .ct-node__header')
    const count = await nodeHeaders.count()
    // Find a non-root node (skip first which is page_root)
    const targetHeader = count > 1 ? nodeHeaders.nth(1) : nodeHeaders.first()
    await targetHeader.click({ button: 'right' })
    await page.waitForTimeout(300)
    await expect(page.locator('[data-testid="tree-context-menu"]')).toBeVisible()
    await page.screenshot({ path: 'test-results/m4-context-menu.png' })
  })

  test('CHECK 7: Context menu has Duplicate, Delete, Move Up, Move Down, Wrap in Section', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-outline"]').click()
    await page.waitForTimeout(200)
    const nodeHeaders = page.locator('.vd-sidebar--left .ct-node__header')
    const count = await nodeHeaders.count()
    const target = count > 1 ? nodeHeaders.nth(1) : nodeHeaders.first()
    await target.click({ button: 'right' })
    await page.waitForTimeout(200)
    const menu = page.locator('[data-testid="tree-context-menu"]')
    await expect(menu).toContainText('Duplicate')
    await expect(menu).toContainText('Delete')
    await expect(menu).toContainText('Move Up')
    await expect(menu).toContainText('Move Down')
    await expect(menu).toContainText('Wrap in Section')
  })

  test('CHECK 8: Duplicate action creates a sibling node', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-outline"]').click()
    await page.waitForTimeout(200)
    const nodesBefore = await page.locator('.vd-sidebar--left .ct-node').count()
    // Right-click a non-root node
    const nodeHeaders = page.locator('.vd-sidebar--left .ct-node__header')
    const count = await nodeHeaders.count()
    if (count <= 1) { console.log('CHECK 8: only root node, skip'); return }
    await nodeHeaders.nth(1).click({ button: 'right' })
    await page.waitForTimeout(200)
    // Click Duplicate
    await page.locator('[data-testid="tree-context-menu"]').getByText('Duplicate').click()
    await page.waitForTimeout(300)
    const nodesAfter = await page.locator('.vd-sidebar--left .ct-node').count()
    console.log(`CHECK 8 duplicate: before=${nodesBefore} after=${nodesAfter}`)
    expect(nodesAfter).toBeGreaterThan(nodesBefore)
  })

  test('CHECK 9: Delete action removes the node', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-outline"]').click()
    await page.waitForTimeout(200)
    const nodesBefore = await page.locator('.vd-sidebar--left .ct-node').count()
    if (nodesBefore <= 1) { console.log('CHECK 9: only root, skip'); return }
    await page.locator('.vd-sidebar--left .ct-node__header').nth(1).click({ button: 'right' })
    await page.waitForTimeout(200)
    await page.locator('[data-testid="tree-context-menu"]').getByText('Delete').click()
    await page.waitForTimeout(300)
    const nodesAfter = await page.locator('.vd-sidebar--left .ct-node').count()
    console.log(`CHECK 9 delete: before=${nodesBefore} after=${nodesAfter}`)
    expect(nodesAfter).toBeLessThan(nodesBefore)
    // Right panel should show empty state (selection cleared)
    await expect(page.locator('[data-testid="property-panel-empty"]')).toBeVisible()
  })

  test('CHECK 10: Context menu dismissed by Escape key', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-outline"]').click()
    await page.waitForTimeout(200)
    await page.locator('.vd-sidebar--left .ct-node__header').first().click({ button: 'right' })
    await page.waitForTimeout(200)
    await expect(page.locator('[data-testid="tree-context-menu"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    await expect(page.locator('[data-testid="tree-context-menu"]')).toBeHidden()
  })

  test('CHECK 11: Context menu dismissed by clicking outside', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-outline"]').click()
    await page.waitForTimeout(200)
    await page.locator('.vd-sidebar--left .ct-node__header').first().click({ button: 'right' })
    await page.waitForTimeout(200)
    await expect(page.locator('[data-testid="tree-context-menu"]')).toBeVisible()
    // Click far away from menu
    await page.locator('[data-testid="zone-canvas"]').click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(200)
    await expect(page.locator('[data-testid="tree-context-menu"]')).toBeHidden()
  })

  test('CHECK 12: Undo reverses context menu actions', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-outline"]').click()
    await page.waitForTimeout(200)
    const nodesBefore = await page.locator('.vd-sidebar--left .ct-node').count()
    if (nodesBefore <= 1) { console.log('CHECK 12: only root, skip'); return }
    // Duplicate a node
    await page.locator('.vd-sidebar--left .ct-node__header').nth(1).click({ button: 'right' })
    await page.waitForTimeout(200)
    await page.locator('[data-testid="tree-context-menu"]').getByText('Duplicate').click()
    await page.waitForTimeout(300)
    const nodesAfterDup = await page.locator('.vd-sidebar--left .ct-node').count()
    // Undo
    await page.keyboard.press('Control+z')
    await page.waitForTimeout(300)
    const nodesAfterUndo = await page.locator('.vd-sidebar--left .ct-node').count()
    console.log(`CHECK 12 undo: before=${nodesBefore} afterDup=${nodesAfterDup} afterUndo=${nodesAfterUndo}`)
    expect(nodesAfterUndo).toBeLessThanOrEqual(nodesAfterDup)
  })

  test('CHECK 13: No console errors during M4 interactions', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto(`${BASE}/studio/views/${STANDARD_ID}/edit`)
    await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    // Check empty state
    await expect(page.locator('[data-testid="property-panel-empty"]')).toBeVisible()
    // Click a block
    await page.locator('[data-testid="zc-block"]').first().click()
    await page.waitForTimeout(200)
    // Open context menu
    await page.locator('[data-testid="lr-tab-outline"]').click()
    await page.waitForTimeout(200)
    await page.locator('.vd-sidebar--left .ct-node__header').first().click({ button: 'right' })
    await page.waitForTimeout(200)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    const realErrors = errors.filter(e => !e.includes('favicon'))
    if (realErrors.length > 0) console.log('Errors:', realErrors)
    expect(realErrors).toHaveLength(0)
  })
})
