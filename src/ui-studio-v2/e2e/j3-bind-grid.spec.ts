import { test, expect } from "@playwright/test"
import { expectNoA11yViolations } from "./utils/axe"

// J3 — Bind a grid via the registry (type-validated, no free text). (Phase 2 UX §4 J3.)
test.describe("J3 — Bind a grid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor/dms-app/main-page?env=dev&editingLevel=vertical&scopeId=automotive")
    await page.waitForSelector('[data-testid="shell-layout"]')
  })

  test("selecting the grid loads it in the Inspector", async ({ page }) => {
    await page.getByTestId("tree-item-cmp.linesGrid").click()
    const inspector = page.getByRole("complementary", { name: "Inspector" })
    await expect(inspector).toBeVisible()
    await expect(inspector.getByText("cmp.linesGrid")).toBeVisible()
  })

  test("opens the registry binding picker from the Props tab", async ({ page }) => {
    await page.getByTestId("tree-item-cmp.linesGrid").click()
    const inspector = page.getByRole("complementary", { name: "Inspector" })
    await expect(inspector).toBeVisible()

    // Switch a property to binding mode, then open the registry-backed picker.
    const toggle = inspector.getByTitle("Switch to binding").first()
    await toggle.click()
    await inspector.getByRole("button", { name: "Change" }).first().click()

    // The binding picker dialog is registry-driven (no free-text entry).
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test("a11y: inspector passes axe", async ({ page }) => {
    await page.getByTestId("tree-item-cmp.linesGrid").click()
    await expect(page.getByRole("complementary", { name: "Inspector" })).toBeVisible()
    await expectNoA11yViolations(page, '[aria-label="Inspector"]')
  })
})
