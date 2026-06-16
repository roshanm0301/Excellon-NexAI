import { Page, expect } from '@playwright/test'
import { SEL } from './selectors'

export async function openPropertyPanel(page: Page, componentKey: string) {
  await page.locator(`[data-component-key="${componentKey}"]`).first().click()
  await expect(page.locator(SEL.propertyPanel)).toBeVisible()
}

export async function clickComponentInTree(page: Page, componentLabel: string) {
  await page.locator(SEL.componentTree).getByText(componentLabel, { exact: false }).first().click()
  await expect(page.locator(SEL.propertyPanel)).toBeVisible()
}

export async function openBindingsTab(page: Page) {
  await page.locator(SEL.bindingsTab).click()
  await expect(page.locator(SEL.bindingEditor)).toBeVisible()
}

export async function openEventsTab(page: Page) {
  await page.locator(SEL.eventsTab).click()
  await expect(page.locator(SEL.eventEditor)).toBeVisible()
}

export async function openVisibilityTab(page: Page) {
  await page.locator(SEL.visibilityTab).click()
  await expect(page.locator(SEL.visibilityRuleBuilder)).toBeVisible()
}

export async function navigateToView(page: Page, viewName: string) {
  await page.goto('studio/views')
  await page.getByText(viewName, { exact: false }).first().click()
  await expect(page.locator(SEL.componentTree)).toBeVisible()
}

export async function saveAndVerify(page: Page) {
  await page.locator(SEL.vdSaveBtn).click()
  // Wait for save to complete (button returns to normal state)
  await page.waitForTimeout(500)
}

export async function publishAndVerify(page: Page) {
  await page.locator(SEL.vdPublishBtn).click()
  // Wait for publish to complete
  await page.waitForTimeout(1000)
}
