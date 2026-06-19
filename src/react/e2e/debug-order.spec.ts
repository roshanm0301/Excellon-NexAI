/**
 * Isolate whether the text_input attempt breaks subsequent data_table insertion.
 */
import { test } from '@playwright/test'

const BASE = '/Excellon-NexAI'
const API = 'http://localhost:9080/api/v1'
const DEV_HEADERS = {
  'x-tenant-id': '00000000-0000-0000-0000-000000000001',
  'x-user-id': '00000000-0000-0000-0000-000000000001',
  'x-role': 'admin',
}

async function findAndDoubleClick(page: import('@playwright/test').Page, name: string) {
  await page.locator('[data-testid="lr-tab-library"]').click()
  await page.waitForTimeout(400)
  await page.waitForSelector('.cp-item', { timeout: 10000 })
  await page.waitForTimeout(500)
  const search = page.locator('[data-testid="component-palette"] input')
  await search.fill('')
  await page.waitForTimeout(200)
  await search.fill(name)
  await page.waitForTimeout(800)

  const item = page.locator('.cp-item').filter({ hasText: new RegExp(name, 'i') }).first()
  const isVisible = await item.isVisible({ timeout: 3000 }).catch(() => false)
  if (!isVisible) { console.log(`  "${name}" not found`); return }

  const isDisabled = await item.getAttribute('class').then(c => c?.includes('disabled') ?? false)
  console.log(`  "${name}" found — disabled: ${isDisabled}`)

  const beforeZones = await page.locator('[data-testid="zone-card"]').count()
  await item.dblclick()
  await page.waitForTimeout(800)
  const afterZones = await page.locator('[data-testid="zone-card"]').count()
  console.log(`  "${name}" dblclick: zones ${beforeZones}→${afterZones}`)
  return afterZones > beforeZones
}

test('A: toolbar then immediately data_table (no text_input in between)', async ({ page }) => {
  await page.bringToFront()
  console.log('\n=== TEST A: toolbar → data_table (direct) ===')
  const r = await page.request.post(`${API}/studio/views`, {
    headers: { ...DEV_HEADERS, 'Content-Type': 'application/json' },
    data: JSON.stringify({ surface_type: 'standard_crud', primary_entity: 'product', view_label: 'Debug A', view_code: 'debug_a' }),
  })
  const v = await r.json()
  await page.goto(`${BASE}/studio/views/${v.artifact_id}/edit`)
  await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
  await page.waitForSelector('.cp-item', { timeout: 15000 })
  await page.waitForTimeout(2000)

  await findAndDoubleClick(page, 'toolbar')
  await findAndDoubleClick(page, 'data table')

  await page.request.delete(`${API}/studio/views/${v.artifact_id}`, { headers: DEV_HEADERS }).catch(() => {})
})

test('B: toolbar then text_input attempt then data_table', async ({ page }) => {
  await page.bringToFront()
  console.log('\n=== TEST B: toolbar → text_input (fails) → data_table ===')
  const r = await page.request.post(`${API}/studio/views`, {
    headers: { ...DEV_HEADERS, 'Content-Type': 'application/json' },
    data: JSON.stringify({ surface_type: 'standard_crud', primary_entity: 'product', view_label: 'Debug B', view_code: 'debug_b' }),
  })
  const v = await r.json()
  await page.goto(`${BASE}/studio/views/${v.artifact_id}/edit`)
  await page.waitForSelector('[data-testid="zone-canvas"]', { timeout: 15000 })
  await page.waitForSelector('.cp-item', { timeout: 15000 })
  await page.waitForTimeout(2000)

  await findAndDoubleClick(page, 'toolbar')
  await findAndDoubleClick(page, 'text input')  // expected to fail
  await findAndDoubleClick(page, 'data table')   // does this fail now?

  await page.request.delete(`${API}/studio/views/${v.artifact_id}`, { headers: DEV_HEADERS }).catch(() => {})
})
