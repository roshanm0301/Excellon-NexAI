import { test, expect } from "@playwright/test"
import { expectNoA11yViolations } from "./utils/axe"

// J1 — Vertical architect builds a baseline application, then keyboard-inserts a
// component into a selected container and validates. (Phase 2 UX §4 J1.)
test.describe("J1 — Build vertical baseline", () => {
  test("create an application from Workspace Home and land in the editor", async ({ page }) => {
    await page.goto("/home?env=dev")
    await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible()
    await expectNoA11yViolations(page, '[aria-label="Workspace home"]')

    await page.getByRole("button", { name: "New application" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByLabel("Application name").fill("Test DMS")
    await dialog.getByRole("combobox", { name: "Vertical" }).click()
    await page.getByRole("option", { name: "Automotive" }).click()
    await dialog.getByRole("button", { name: "Create application" }).click()

    // Navigates into the editor shell.
    await page.waitForSelector('[data-testid="shell-layout"]')
    await expect(page.getByRole("banner", { name: "Context Bar" })).toBeVisible()
  })

  test("keyboard-insert a component into a selected container", async ({ page }) => {
    await page.goto("/editor/dms-app/main-page?env=dev&editingLevel=vertical&scopeId=automotive")
    await page.waitForSelector('[data-testid="shell-layout"]')

    // Select a container node in the Explorer tree.
    const tree = page.getByRole("tree")
    await expect(tree).toBeVisible()
    await page.getByTestId("tree-item-app.dms").click()

    // Switch to the Assets tab and keyboard-insert an archetype (DnD alternative).
    await page.getByRole("tab", { name: "Assets" }).click()
    const card = page.locator('[data-testid^="asset-card-"]').first()
    await card.focus()
    await page.keyboard.press("Enter")

    // The aria-live announcer confirms the keyboard insert path ran.
    await expect(page.getByTestId("asset-insert-announcer")).not.toBeEmpty()
  })

  test("validate surfaces the problems dock", async ({ page }) => {
    await page.goto("/editor/dms-app/main-page?env=dev&editingLevel=vertical&scopeId=automotive")
    await page.waitForSelector('[data-testid="shell-layout"]')

    await page.getByRole("button", { name: "Validate" }).click()
    await expect(page.getByRole("region", { name: "Bottom dock" })).toBeVisible()
  })
})
