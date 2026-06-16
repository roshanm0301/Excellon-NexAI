import { expect, test } from '@playwright/test'

test.describe('Phase 0 UI Studio gate infrastructure', () => {
  test('opens UI Studio list page in Google Chrome with mocked data', async ({ page }, testInfo) => {
    await page.goto('studio/views')

    await expect(page.getByRole('button', { name: /UI Studio/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'UI Studio' })).toBeVisible()
    await expect(page.getByRole('button', { name: /New View/i })).toBeVisible()
    await expect(page.getByPlaceholder('Search views...')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('404')

    await page.screenshot({
      path: testInfo.outputPath('phase-0-ui-studio-list.png'),
      fullPage: true,
    })
  })
})
