import { test, expect } from "@playwright/test"
import { expectNoA11yViolations } from "./utils/axe"

// J4 — Wire behavior: trigger + workflow-transition action, no code. (Phase 2 UX §4 J4.)
test.describe("J4 — Wire behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor/dms-app/main-page?env=dev&editingLevel=vertical&scopeId=automotive")
    await page.waitForSelector('[data-testid="shell-layout"]')
    await page.getByTestId("tree-item-cmp.submitButton").click()
    await expect(page.getByRole("complementary", { name: "Inspector" })).toBeVisible()
  })

  test("opens the Event Builder from the Events tab", async ({ page }) => {
    const inspector = page.getByRole("complementary", { name: "Inspector" })
    await inspector.getByRole("tab", { name: "Events" }).click()
    await inspector.getByRole("button", { name: /Add Event/i }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("Add Event Handler")).toBeVisible()
  })

  test("configures a trigger and an action in the Event Builder", async ({ page }) => {
    const inspector = page.getByRole("complementary", { name: "Inspector" })
    await inspector.getByRole("tab", { name: "Events" }).click()
    await inspector.getByRole("button", { name: /Add Event/i }).click()

    const dialog = page.getByRole("dialog")
    // Pick a trigger (first combobox).
    await dialog.getByRole("combobox").first().click()
    await page.getByRole("option", { name: "On Click" }).click()

    // Pick an action kind (the combobox inside the action row).
    await dialog.getByRole("combobox").nth(1).click()
    await page.getByRole("option", { name: "Navigate" }).click()

    await expect(dialog.getByText("Target")).toBeVisible()
  })

  test("a11y: event builder dialog passes axe", async ({ page }) => {
    const inspector = page.getByRole("complementary", { name: "Inspector" })
    await inspector.getByRole("tab", { name: "Events" }).click()
    await inspector.getByRole("button", { name: /Add Event/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expectNoA11yViolations(page, '[role="dialog"]')
  })
})
