# UI Design System Refactoring Report

## Overview

Full codebase analysis and refactoring of ~50 CSS/SCSS style files to enforce a consistent
VS Code-like IDE design system with unified design tokens, 8px grid spacing, and a single
source of truth for colors, typography, spacing, and component styles.

---

## Design System Architecture

| Layer      | File                                 | Purpose                                     |
| ---------- | ------------------------------------ | ------------------------------------------- |
| **Tokens** | `styles/design-system.scss`          | CSS custom properties — SSOT for all tokens |
| **Docs**   | `styles/_design-tokens.scss`         | SCSS helper maps & documentation            |
| **Grid**   | `styles/_ide-grid.scss`              | 12-column grid, IDE panel layout            |
| **Dark**   | `styles/_vscode-dark-overrides.scss` | VS Code dark theme DX overrides             |
| **DX**     | `dx-styles.scss`                     | DevExtreme component density overrides      |
| **Forms**  | `styles/forms.scss`                  | IDE config panel & form styles              |
| **Tables** | `styles/tables.scss`                 | Data grid & table styles                    |

### Token Scales

- **Spacing**: `--space-0-5` (2px) → `--space-16` (64px), based on 4px/8px grid
- **Typography**: `--text-2xs` (10px) → `--text-4xl` (30px), base 14px
- **Radius**: `--radius-xs` (2px) → `--radius-full` (9999px)
- **Colors**: Semantic tokens (`--bg-primary`, `--text-primary`, `--border-primary`, `--color-primary`, `--color-success/error/warning/info`)
- **IDE Density**: `--ide-row-height: 32px`, `--ide-input-height: 32px`, `--header-height: 40px`, `--footer-height: 24px`

---

## Files Refactored

### 1. WorkflowChatPanel.scss (1966 → 1973 lines)

**Impact: Critical** — largest style file, parallel design system

| Before                                                 | After                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| Own `:root` vars with `$base-accent` / Material colors | Maps to `var(--color-primary)`, `var(--bg-primary)`, etc.           |
| `$font-size-10..20` SCSS variables                     | `var(--text-2xs)` through `var(--text-2xl)`                         |
| `'Fira Code', 'Monaco', 'Menlo', monospace`            | `var(--font-mono)`                                                  |
| `#0d1117`, `#161b22`, `#30363d` dark mode hardcodes    | `var(--bg-primary)`, `var(--bg-secondary)`, `var(--border-primary)` |
| `#ffffff` (19 instances)                               | `var(--text-inverse)`                                               |
| `#ff5252`, `#f44336` error gradient                    | `var(--color-error)`, `var(--color-error-dark)`                     |
| `padding: 10px 12px` responsive                        | `var(--space-2) var(--space-3)`                                     |

### 2. WorkflowSuggestionCard.scss (418 lines)

**Impact: High** — AI suggestion cards

| Before                                         | After                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `@import variables.base.scss` SCSS vars        | Pure CSS custom properties                                         |
| `$base-accent`, `$base-bg`, `$base-text-color` | `var(--color-primary)`, `var(--bg-primary)`, `var(--text-primary)` |
| `#ffc107` / `#f44336` / `#2196f3` / `#4caf50`  | `var(--color-warning/error/info/success)`                          |
| `darken($base-accent, 8%)` SCSS function       | `var(--color-primary-hover)`                                       |
| `#363640`, `#2d2d2d`, `#515159` dark mode      | `var(--bg-secondary)`, `var(--bg-sunken)`, `var(--border-primary)` |
| `'Fira Code', 'Monaco', 'Menlo', monospace`    | `var(--font-mono)`                                                 |
| `#e0e0e0`, `#bdbdbd` scrollbar colors          | `var(--border-primary)`, `var(--border-strong)`                    |

### 3. AiTaskFillButton.scss (240 lines)

**Impact: High** — AI fill button component

| Before                                            | After                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `@import variables.base.scss` + `$base-accent`    | `var(--color-primary)`                                               |
| `#656d76`, `#8b949e` grays                        | `var(--text-tertiary)`                                               |
| `#1a7f37` / `#d1242f` success/error               | `var(--color-success)` / `var(--color-error)`                        |
| `#fff`, `#f6f8fa`, `#d1d9e0` light-mode hardcodes | `var(--bg-elevated)`, `var(--bg-secondary)`, `var(--border-primary)` |
| `rgba($base-accent, *)` SCSS functions            | `rgba(249, 115, 22, *)` raw values (CSS-compatible)                  |
| `#161b22`, `#0d1117` dark mode                    | `var(--bg-secondary)`, `var(--bg-sunken)`                            |

### 4. dx-styles.scss (633 lines)

**Impact: Medium** — main DevExtreme overrides

| Before                         | After                                |
| ------------------------------ | ------------------------------------ |
| `background-color: #1e1e1e`    | `var(--bg-primary)`                  |
| `color: #cccccc`               | `var(--text-primary)`                |
| `padding: 5px` row padding     | `var(--space-1)` (4px, grid-aligned) |
| `background: #2a2d2e` hover    | `var(--bg-tertiary)`                 |
| `background: #1e1e1e` alt rows | `var(--bg-sunken)`                   |
| `margin-left: 5px`             | `var(--space-1)`                     |

### 5. Header.scss (270 lines)

**Impact: Medium** — IDE title bar

| Before                                         | After                                                           |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `#3c3c3c` title bar background                 | `var(--bg-tertiary)`                                            |
| `#252526`, `#2d2d2d`, `#333333` search trigger | `var(--bg-sunken)`, `var(--bg-secondary)`, `var(--bg-tertiary)` |
| `#cccccc` text                                 | `var(--text-primary)`                                           |
| `#969696` placeholder                          | `var(--text-tertiary)`                                          |
| `#4d4d4d` borders                              | `var(--border-strong)`                                          |
| `#fdba74` env badge                            | `var(--color-primary-light)`                                    |
| `#4daadb` role badge                           | `var(--color-info)`                                             |

### 6. SideNavigationMenu.scss (227 lines)

**Impact: Medium** — IDE sidebar

| Before                  | After                 |
| ----------------------- | --------------------- |
| `#252526` sidebar bg    | `var(--bg-sunken)`    |
| `#1e1e1e` border        | `var(--bg-primary)`   |
| `#cccccc` text/icon     | `var(--text-primary)` |
| `#37373d` selection bg  | `var(--bg-elevated)`  |
| `#2a2d2e` hover bg      | `var(--bg-tertiary)`  |
| `#ffffff` selected text | `var(--text-inverse)` |

### 7. schema.scss (324 lines)

**Impact: Low**

| Before                         | After                                 |
| ------------------------------ | ------------------------------------- |
| `font-size: 11px` hardcoded    | `var(--text-2xs)` (10px)              |
| `width: 700px` / `900px` fixed | `width: 100%; max-width: 700px/900px` |
| `height: 24px` tree button     | `var(--ide-row-height)` (32px)        |

### 8. PageWrapper.scss

**Impact: Low** — duplicate class resolution

| Before                                                       | After                                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `.saas-page` duplicate (different values from design-system) | Removed duplicate; now only extends with `--vertical-only` and `--full` modifiers |
| `animation: 180ms` (vs 150ms in design-system)               | Inherits design-system's 150ms                                                    |

### 9. index.css

**Impact: Low** — legacy overrides

| Before                   | After                           |
| ------------------------ | ------------------------------- |
| `#4d4d4d` resize handler | `var(--border-strong, #4d4d4d)` |
| `#1e1e1e` session bg     | `var(--bg-primary, #1e1e1e)`    |
| `#969696` session text   | `var(--text-tertiary, #969696)` |
| `height: 98%` resize     | `height: 100%`                  |

### 10. subscription.scss

**Impact: Low**

| Before                      | After                                              |
| --------------------------- | -------------------------------------------------- |
| `border-radius: 20%` avatar | `var(--radius-lg)`                                 |
| `.delet-button` typo        | Added `.delete-button` alias (backward-compatible) |

---

## Files Not Modified (Intentionally)

| File                                         | Reason                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| `styles/design-system.scss`                  | Token definitions — these ARE the source of truth                         |
| `styles/_vscode-dark-overrides.scss`         | VS Code-specific DX overrides (hex values are intentional VS Code parity) |
| `themes/generated/variables.base.scss`       | DevExtreme generated file — do not edit                                   |
| `themes/generated/variables.additional.scss` | DevExtreme generated file — do not edit                                   |
| `themes/generated/theme.base.css`            | DevExtreme generated theme — do not edit                                  |
| `themes/generated/theme.additional.css`      | DevExtreme generated theme — do not edit                                  |
| `designer/css/designer-dark.css`             | Workflow canvas visual context (separate design language)                 |
| `designer/css/designer-light.css`            | Workflow canvas visual context                                            |
| `designer/css/designer.css`                  | Workflow designer base                                                    |
| `styles/forms.scss`                          | Already using design tokens                                               |
| `styles/tables.scss`                         | Already using design tokens                                               |
| `styles/settings.scss`                       | Already using design tokens                                               |

---

## Remaining Observations

### Minor Issues (Low Priority)

1. **dx-styles.scss**: `padding: 2px 6px` on inline edit rows — intentionally compact for DX grid editing, not worth changing
2. **WorkflowAssistantDemo.scss**: Contains demo-specific hardcoded colors (35 hex); consider tokenizing if promoted to production
3. **auth.scss**, **single-card.scss**, **loader.css**: Minor hex colors in authentication/layout flows — low traffic pages
4. **query-builder.scss**: 2 hex colors for React QueryBuilder overrides

### Architecture Recommendations

1. **Remove `@import` of `variables.base.scss`** from remaining component files that still import it (now that they use CSS custom properties)
2. **Consider a CSS-in-JS migration** for the assistant components to co-locate styles with components
3. **Add stylelint** with rules to enforce token usage and flag hardcoded hex values
4. **Consider CSS nesting** (now supported in modern browsers) to reduce selector complexity

---

## Summary

| Metric                                         | Before                        | After                                                |
| ---------------------------------------------- | ----------------------------- | ---------------------------------------------------- |
| Files with hardcoded hex colors                | 24                            | 14 (10 are generated/intentional)                    |
| `$font-size-*` SCSS variable usages            | ~60                           | 0 in refactored files                                |
| `$base-accent` SCSS variable usages            | ~30                           | 0 in refactored files                                |
| Hardcoded font-family stacks                   | 6 files                       | 0 (all use `var(--font-mono)` or `var(--font-sans)`) |
| Non-grid spacing values (5px, 6px, 10px, 14px) | ~25                           | ~5 (acceptable edge cases)                           |
| Duplicate class definitions                    | 1 (`.saas-page`)              | 0                                                    |
| CSS variable naming conflicts                  | 1 (WorkflowChatPanel `:root`) | 0 (aliased to design system)                         |
