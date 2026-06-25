import { test, expect } from "@playwright/test"
import { expectNoA11yViolations } from "./utils/axe"

// J2 — OEM admin opens an inherited page, applies theme tokens, and overrides a
// node — baseline untouched. (Phase 2 UX §4 J2.)
test.describe("J2 — OEM overlay", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor/dms-app/main-page?env=dev&editingLevel=tenant&scopeId=toyota")
    await page.waitForSelector('[data-testid="shell-layout"]')
  })

  test("inherited nodes are badged at the OEM level", async ({ page }) => {
    await expect(page.getByRole("tree")).toBeVisible()
    // At the tenant level, vertical-authored nodes show an inherited origin badge.
    await expect(page.getByLabel(/Inherited/i).first()).toBeVisible()
  })

  test("theme designer edits a brand token", async ({ page }) => {
    await page.getByRole("button", { name: "Settings" }).click()
    await expect(page.getByLabel("Theme designer")).toBeVisible()

    const colorInput = page.getByLabel("colorPrimary value")
    await colorInput.fill("#ff0000")
    await expect(page.getByRole("button", { name: "Save theme" })).toBeEnabled()
  })

  test("override-here forks an inherited node from its context menu", async ({ page }) => {
    const appItem = page.getByTestId("tree-item-app.dms")
    await appItem.getByRole("button", { name: /Actions for/i }).click()
    await expect(page.getByText("Override here")).toBeVisible()
    await page.getByText("Override here").click()
    // The tree remains rendered after the override mutation resolves.
    await expect(page.getByRole("tree")).toBeVisible()
  })

  test("a11y: explorer tree passes axe at the OEM level", async ({ page }) => {
    await expect(page.getByRole("tree")).toBeVisible()
    await expectNoA11yViolations(page, '[aria-label="Composition tree"]')
  })
})
