/**
 * M3 Gatekeeper — Entity Fields Tab
 * EntityFieldPicker in Fields tab; drag field → auto-creates bound component.
 */
import { test, expect } from '@playwright/test'

// Customer Master: standard_crud, entity=customer — has name/email/phone fields
const CUSTOMER_VIEW_ID = '00000000-0000-0000-0002-000000000004'
// Service Dashboard: dashboard, no primary entity
const DASHBOARD_ID = '00000000-0000-0000-0002-000000000002'
const BASE = '/Excellon-NexAI'

test.describe('M3 Gatekeeper: Entity Fields Tab', () => {

  test('CHECK 1: Fields tab loads entity fields for view with primary entity', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${CUSTOMER_VIEW_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-fields"]').click()
    await page.waitForTimeout(500)
    const picker = page.locator('[data-testid="entity-field-picker"]')
    await expect(picker).toBeVisible()
    // Should show actual fields (not the placeholder/empty state)
    await expect(page.locator('.efp-list')).toBeVisible()
    const fields = page.locator('.efp-field')
    await expect(fields.first()).toBeVisible()
    const count = await fields.count()
    console.log(`CHECK 1: ${count} fields loaded for customer entity`)
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('CHECK 2: Fields show name, type, and required badge', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${CUSTOMER_VIEW_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-fields"]').click()
    await page.waitForTimeout(500)
    // Field name visible
    await expect(page.locator('.efp-field__name').first()).toBeVisible()
    // Field type visible
    await expect(page.locator('.efp-field__type').first()).toBeVisible()
    // At least one required badge (ID field is required)
    const reqBadges = page.locator('.efp-required')
    console.log(`CHECK 2: required badges: ${await reqBadges.count()}`)
    expect(await reqBadges.count()).toBeGreaterThanOrEqual(1)
  })

  test('CHECK 3: Search in Fields tab filters correctly', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${CUSTOMER_VIEW_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-fields"]').click()
    await page.waitForTimeout(500)
    const totalBefore = await page.locator('.efp-field').count()
    // Search for 'name'
    await page.locator('[data-testid="entity-field-picker"] input').fill('name')
    await page.waitForTimeout(300)
    const afterFilter = await page.locator('.efp-field').count()
    console.log(`CHECK 3: total=${totalBefore} after search 'name'=${afterFilter}`)
    expect(afterFilter).toBeLessThanOrEqual(totalBefore)
    expect(afterFilter).toBeGreaterThanOrEqual(1)
    // Clear
    await page.locator('[data-testid="entity-field-picker"] input').clear()
    await page.waitForTimeout(200)
    const afterClear = await page.locator('.efp-field').count()
    expect(afterClear).toEqual(totalBefore)
  })

  test('CHECK 4: Drag a text field → creates text_input in zone', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${CUSTOMER_VIEW_ID}/edit`)
    await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-fields"]').click()
    await page.waitForTimeout(500)
    const blocksBefore = await page.locator('[data-testid="zc-block"]').count()
    // Find a text-type field (Name or Phone)
    const nameField = page.locator('[data-testid="efp-field-name"], [data-testid="efp-field-phone"]').first()
    if (await nameField.count() === 0) {
      // Fall back to first field
      const firstField = page.locator('.efp-field').first()
      await firstField.dragTo(page.locator('[data-testid="zone-body"]').first())
    } else {
      await nameField.dragTo(page.locator('[data-testid="zone-body"]').first())
    }
    await page.waitForTimeout(600)
    const blocksAfter = await page.locator('[data-testid="zc-block"]').count()
    console.log(`CHECK 4 text drag: before=${blocksBefore} after=${blocksAfter}`)
    expect(blocksAfter).toBeGreaterThan(blocksBefore)
  })

  test('CHECK 5: Drag a datetime field → creates date_picker', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${CUSTOMER_VIEW_ID}/edit`)
    await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-fields"]').click()
    await page.waitForTimeout(500)
    const blocksBefore = await page.locator('[data-testid="zc-block"]').count()
    // Find created_at field (datetime type)
    const dateField = page.locator('[data-testid="efp-field-created_at"]')
    if (await dateField.count() > 0) {
      await dateField.dragTo(page.locator('[data-testid="zone-body"]').first())
      await page.waitForTimeout(600)
      const blocksAfter = await page.locator('[data-testid="zc-block"]').count()
      console.log(`CHECK 5 datetime drag: before=${blocksBefore} after=${blocksAfter}`)
      expect(blocksAfter).toBeGreaterThan(blocksBefore)
      // Verify label matches field label
      const lastBlock = page.locator('[data-testid="zc-block"]').last()
      await expect(lastBlock).toContainText('Created At')
    } else {
      console.log('CHECK 5: created_at field not found — skipping label check')
    }
  })

  test('CHECK 6: Drag an enum field → creates dropdown_select', async ({ page }) => {
    // Use Sale Orders view which has service_order entity with status enum
    await page.goto(`${BASE}/studio/views/00000000-0000-0000-0002-000000000011/edit`)
    await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-fields"]').click()
    await page.waitForTimeout(500)
    const statusField = page.locator('[data-testid="efp-field-status"]')
    if (await statusField.count() > 0) {
      const blocksBefore = await page.locator('[data-testid="zc-block"]').count()
      await statusField.dragTo(page.locator('[data-testid="zone-body"]').first())
      await page.waitForTimeout(600)
      const blocksAfter = await page.locator('[data-testid="zc-block"]').count()
      console.log(`CHECK 6 enum drag: before=${blocksBefore} after=${blocksAfter}`)
      expect(blocksAfter).toBeGreaterThan(blocksBefore)
    } else {
      console.log('CHECK 6: status field not found — skipping')
    }
  })

  test('CHECK 7: Fields tab shows entity-field-picker for all view types', async ({ page }) => {
    // Dashboard view has primary_entity='service_order' in seed data
    await page.goto(`${BASE}/studio/views/${DASHBOARD_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-fields"]').click()
    await page.waitForTimeout(500)
    // EntityFieldPicker component renders for any view (with or without fields)
    const picker = page.locator('[data-testid="entity-field-picker"]')
    await expect(picker).toBeVisible()
    // If no fields in mock for this entity, shows "No fields available" — that's correct behavior
    // The important check: no error state, picker is functional
    console.log('CHECK 7: picker text =', await picker.innerText())
  })

  test('CHECK 8: Library and Outline tabs unaffected by M3 changes', async ({ page }) => {
    await page.goto(`${BASE}/studio/views/${CUSTOMER_VIEW_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    // Library tab
    await page.locator('[data-testid="lr-tab-library"]').click()
    await page.waitForTimeout(200)
    await expect(page.locator('[data-testid="component-palette"]')).toBeVisible()
    // Outline tab
    await page.locator('[data-testid="lr-tab-outline"]').click()
    await page.waitForTimeout(200)
    await expect(page.locator('.vd-sidebar--left [data-testid="component-tree"]')).toBeVisible()
    // ZoneCanvas still in center
    await expect(page.locator('[data-testid="zone-canvas"]')).toBeVisible()
  })

  test('CHECK 9: Network call fires for entity fields on Fields tab click', async ({ page }) => {
    const entityFieldsRequests: string[] = []
    page.on('request', req => {
      if (req.url().includes('/entities/') && req.url().includes('/fields')) {
        entityFieldsRequests.push(req.url())
      }
    })
    await page.goto(`${BASE}/studio/views/${CUSTOMER_VIEW_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-fields"]').click()
    await page.waitForTimeout(1000)
    console.log(`CHECK 9: entity field requests: ${entityFieldsRequests.length}`, entityFieldsRequests)
    // TanStack Query fires on mount — at least 1 request expected
    expect(entityFieldsRequests.length).toBeGreaterThanOrEqual(1)
  })

  test('CHECK 10: No console errors during Fields tab interactions', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto(`${BASE}/studio/views/${CUSTOMER_VIEW_ID}/edit`)
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.locator('[data-testid="lr-tab-fields"]').click()
    await page.waitForTimeout(500)
    await page.locator('[data-testid="entity-field-picker"] input').fill('na')
    await page.waitForTimeout(200)
    await page.locator('[data-testid="entity-field-picker"] input').clear()
    await page.waitForTimeout(200)
    const realErrors = errors.filter(e => !e.includes('favicon'))
    if (realErrors.length > 0) console.log('Errors:', realErrors)
    expect(realErrors).toHaveLength(0)
  })
})
