import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

// Per-surface WCAG 2.2 AA audit helper [T12.2.1]. Scopes the scan to a single
// region so each surface is asserted independently and failures point at the
// offending area. Pass a CSS selector for the region under test.
export async function expectNoA11yViolations(page: Page, selector: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // color-contrast (WCAG 1.4.3) is governed by the design tokens and audited at
    // the token level; axe's pixel-based contrast check also mis-fires on overlays
    // and opacity. We enforce every structural/name/role/keyboard rule here.
    .disableRules(["color-contrast"])
    .analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}
