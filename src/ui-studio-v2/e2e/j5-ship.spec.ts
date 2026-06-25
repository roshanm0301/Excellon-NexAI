import { test, expect } from "@playwright/test"
import { expectNoA11yViolations } from "./utils/axe"

const EDITOR_URL = "/editor/dms-app/main-page?env=dev&editingLevel=vertical&scopeId=automotive"

test.describe("J5 — Ship Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EDITOR_URL)
    await page.waitForSelector('[data-testid="shell-layout"]')
  })

  test("validate → problems dock opens", async ({ page }) => {
    await page.getByRole("button", { name: "Validate" }).click()
    await expect(page.getByRole("region", { name: "Bottom dock" })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Problems/i })).toBeVisible()
  })

  test("publish dialog shows target env + validation summary", async ({ page }) => {
    await page.getByRole("button", { name: "Publish" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("Publish Application")).toBeVisible()
    await expect(dialog.getByRole("combobox", { name: "Target environment" })).toBeVisible()
    await expect(dialog.getByText("Validation Summary")).toBeVisible()
  })

  test("publish dialog has promote and rollback sections", async ({ page }) => {
    await page.getByRole("button", { name: "Publish" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("button", { name: "Promote dev to staging" })).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Promote staging to prod" })).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Rollback" })).toBeVisible()
  })

  test("version history loads from the activity bar", async ({ page }) => {
    await page.getByRole("button", { name: "History" }).click()
    await expect(page.getByLabel("Version history")).toBeVisible()
  })

  test("preview mode replaces the canvas", async ({ page }) => {
    await page.getByRole("button", { name: "Preview" }).click()
    await expect(page.getByLabel("Preview mode")).toBeVisible()
    await expect(page.getByRole("toolbar", { name: "Preview toolbar" })).toBeVisible()
  })

  test("a11y: context bar passes axe", async ({ page }) => {
    await expect(page.getByRole("banner", { name: "Context Bar" })).toBeVisible()
    await expectNoA11yViolations(page, '[aria-label="Context Bar"]')
  })

  test("a11y: problems dock passes axe", async ({ page }) => {
    await page.getByRole("button", { name: "Validate" }).click()
    await expect(page.getByRole("region", { name: "Bottom dock" })).toBeVisible()
    await expectNoA11yViolations(page, '[aria-label="Bottom dock"]')
  })
})
