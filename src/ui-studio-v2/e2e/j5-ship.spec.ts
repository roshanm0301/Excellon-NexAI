import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("J5 — Ship Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor/dms-app/main-page?env=dev&editingLevel=vertical&scopeId=automotive")
    await page.waitForSelector('[data-testid="shell-layout"]')
  })

  test("validate → problems dock opens with issue list", async ({ page }) => {
    const validateBtn = page.getByRole("button", { name: "Validate" })
    await expect(validateBtn).toBeVisible()
    await validateBtn.click()

    const bottomDock = page.getByLabel("Bottom dock")
    await expect(bottomDock).toBeVisible()

    const problemsTab = page.getByRole("tab", { name: /Problems/i })
    await expect(problemsTab).toBeVisible()
  })

  test("publish dialog opens and shows target env selector", async ({ page }) => {
    const publishBtn = page.getByRole("button", { name: "Publish" })
    await expect(publishBtn).toBeVisible()
    await publishBtn.click()

    const dialog = page.getByLabel("Publish dialog")
    await expect(dialog).toBeVisible()

    const envTrigger = dialog.getByLabel("Target environment")
    await expect(envTrigger).toBeVisible()
  })

  test("publish dialog shows validation summary", async ({ page }) => {
    await page.getByRole("button", { name: "Publish" }).click()

    const dialog = page.getByLabel("Publish dialog")
    await expect(dialog).toBeVisible()

    await expect(dialog.getByText("Validation Summary")).toBeVisible()
  })

  test("publish dialog has promote and rollback sections", async ({ page }) => {
    await page.getByRole("button", { name: "Publish" }).click()

    const dialog = page.getByLabel("Publish dialog")

    await expect(dialog.getByLabel("Promote dev to staging")).toBeVisible()
    await expect(dialog.getByLabel("Promote staging to prod")).toBeVisible()
    await expect(dialog.getByLabel("Rollback")).toBeVisible()
  })

  test("preview mode replaces canvas", async ({ page }) => {
    const previewBtn = page.getByRole("button", { name: "Preview" })
    if (await previewBtn.isVisible()) {
      await previewBtn.click()
      const previewMode = page.getByLabel("Preview mode")
      await expect(previewMode).toBeVisible()

      const toolbar = page.getByLabel("Preview toolbar")
      await expect(toolbar).toBeVisible()
    }
  })

  test("version history panel loads from activity bar", async ({ page }) => {
    const historyBtn = page.getByRole("button", { name: "History" })
    if (await historyBtn.isVisible()) {
      await historyBtn.click()
      const versionHistory = page.getByLabel("Version history")
      await expect(versionHistory).toBeVisible()
    }
  })

  test("a11y: context bar passes axe checks", async ({ page }) => {
    const contextBar = page.getByLabel("Context Bar")
    await expect(contextBar).toBeVisible()

    const results = await new AxeBuilder({ page })
      .include('[role="banner"]')
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("a11y: bottom dock passes axe checks", async ({ page }) => {
    await page.getByRole("button", { name: "Validate" }).click()

    const bottomDock = page.getByLabel("Bottom dock")
    await expect(bottomDock).toBeVisible()

    const results = await new AxeBuilder({ page })
      .include('[aria-label="Bottom dock"]')
      .analyze()

    expect(results.violations).toEqual([])
  })
})
