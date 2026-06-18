import { expect, test } from '@playwright/test'

test('headed Chrome shows Purchase Order DMS schemas from real database', async ({ page, request }) => {
  await page.goto('/Excellon-NexAI/admin/entities')

  await expect(page.getByRole('heading', { name: 'Entities' })).toBeVisible()

  const search = page.getByPlaceholder('Search entities...')
  await search.fill('purchase_order')
  await expect(page.getByText('Purchase Order', { exact: true })).toBeVisible()
  await expect(page.getByText('Purchase Order Line', { exact: true })).toBeVisible()

  await search.fill('supplier')
  await expect(page.getByText('Supplier', { exact: true })).toBeVisible()
  await expect(page.getByText('Supplier Product Mapping', { exact: true })).toBeVisible()

  await search.fill('product')
  await expect(page.getByText('Product / Item', { exact: true })).toBeVisible()
  await expect(page.getByText('Product UOM Mapping', { exact: true })).toBeVisible()
  await expect(page.getByText('Product Reorder Limit', { exact: true })).toBeVisible()

  const headers = {
    'x-tenant-id': '00000000-0000-0000-0000-000000000001',
    'x-user-id': '00000000-0000-0000-0000-000000000001',
    'x-role': 'admin',
  }
  const poFields = await request.get('/api/v1/studio/entities/purchase_order/fields', { headers })
  expect(poFields.ok()).toBeTruthy()
  const poBody = await poFields.json()
  expect(poBody.items.length).toBeGreaterThanOrEqual(65)

  const lineFields = await request.get('/api/v1/studio/entities/purchase_order_line/fields', { headers })
  expect(lineFields.ok()).toBeTruthy()
  const lineBody = await lineFields.json()
  expect(lineBody.items.length).toBeGreaterThanOrEqual(51)
})
