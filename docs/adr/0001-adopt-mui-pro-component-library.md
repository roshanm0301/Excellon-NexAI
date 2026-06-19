# ADR 0001: Adopt MUI Pro as Component Implementation Layer

**Date:** 2026-06-19  
**Status:** Accepted  
**Deciders:** Roshan M

## Context

The Excellon NexAI React frontend has a hand-built design system in
`src/react/src/design-system/`. It provides 28 primitive components (Button,
Input, Modal, DataTable, etc.) built from raw HTML elements styled with CSS
variables and inline styles.

While functional, the custom components lack:
- ARIA accessibility attributes (screen readers, keyboard navigation)
- Built-in focus management for modals and drawers
- High-performance data grid with row virtualization for large datasets
- A maintained upgrade path as React evolves

## Decision

Replace the **internal implementation** of each component in
`src/react/src/design-system/components/*.tsx` with MUI Pro equivalents.

**What changes:**
- Component bodies: custom HTML/CSS → MUI components styled with NexAI CSS vars
- `DataTable` and `VirtualGrid` → `@mui/x-data-grid-pro` (major capability upgrade)

**What does NOT change:**
- `/public/design-system/*.css` — CSS token files (source of truth for brand)
- `src/react/src/design-system/` folder structure and `index.ts` barrel export
- All component export names, prop APIs, and data-testid attributes
- `src/react/src/index.css` — global layout classes
- Any of the 47 application-level components that consume the design system

## Packages Added

```
@mui/material             — core component library
@mui/x-data-grid-pro      — enterprise DataGrid with row virtualization
@mui/x-license            — Pro license key registration
@mui/icons-material       — Material Design icon set
@emotion/react            — CSS-in-JS runtime (required by MUI)
@emotion/styled           — styled() API (required by MUI)
```

## Components That Cannot Be Migrated

| Component | Reason | Action |
|---|---|---|
| `CodeBlock` / `JsonViewer` | No MUI code display equivalent | Kept; container re-skinned with MUI Paper |
| `LayerBadge` | NexAI-specific layer taxonomy (platform/vertical/tenant/node/role) | Kept; optionally wraps MUI Chip |
| `DragHandle` | Pure SVG; no migration needed | Kept as-is |
| `EmptyState` / `ErrorState` | No single MUI equivalent | Kept; inner action button → MUI Button |

## Toast / useToast

The `useToast()` hook interface (`toast()`, `success()`, `error()`, `warning()`,
`info()`) is unchanged — 6 consuming files require no edits. The internal
renderer is replaced with MUI `Snackbar` + `Alert`.

## Consequences

**Positive:**
- Full WCAG 2.1 AA accessibility on all migrated components
- DataGrid Pro handles millions of rows with native virtualization
- MUI team maintains the component implementations going forward
- NexAI brand identity preserved via the unchanged CSS token system

**Negative:**
- +~90KB gzipped (MUI core + emotion runtime)
- Emotion CSS-in-JS adds ~5–10ms cold render per component tree (cached after)
- MUI Pro license key required in production

## Alternatives Considered

- **DevExtreme** — superior data grid but heavier bundle, weaker theming API
- **shadcn/ui** — headless, highly customisable, but requires more build-out
- **Keep custom** — lowest cost short-term, no accessibility, maintenance burden grows

MUI Pro was chosen as the best balance of enterprise features, accessibility,
theming flexibility (reads NexAI CSS vars), and developer experience.
