# Excellon Platform — Architecture Specification
## Document 06 — Design System Engine

Status: Draft · governed by Constitution v1.0 · **owns the canonical `semanticType` catalogue** (resolves Doc 01 O1)

> Constitutional basis: `[L32]` one design system, no foreign components; `[L33]` brand via tokens not substitution; `[L37]` components versioned, stable contracts; `[L34]` flow layout.

## 6.1 Purpose
The Design System Engine defines the **single UI vocabulary** `[L32]`: the closed set of semantic component types, their contracts, the token system, the theming/branding model, and the mapping to concrete implementations (MUI Pro on web; a native set later, Doc 04).

## 6.2 Token architecture
- Token categories: color, typography, spacing, sizing, elevation, radius, motion, breakpoints.
- Tokens are **the cross-platform shared layer** (web + future native share tokens, not components — Doc 04).
- Tokens map to MUI's theme on web `[L33]`.
- **Brand variation = token/theme override via the cascade** (Vertical neutral → OEM brand → Dealer accents) — never component swapping `[L33]`.

## 6.3 Theme model
- A `Theme` object (Doc 01 §1.12) is a token set + MUI theme mapping + brand assets + light/dark.
- Themes resolve through the cascade like any metadata; the runtime applies the resolved theme.
- This is how B2C brand identity is achieved while "one design system" stays true.

## 6.4 The semantic component catalogue (canonical, closed set)
Components are **semantic**, not implementation-named. The catalogue is closed `[L32]`: only registered types are valid `semanticType` values in the Meta Model. Starter catalogue (extensible only via governed registration, Doc 10):

| Category | Semantic types (canonical, v1) |
|---|---|
| Foundation | Container, Stack, Grid, Section, Splitter, Tabs, Separator |
| Data Entry | FormField, Select, Autocomplete, DatePicker, NumberField, FileUpload, Toggle, TextArea, Checkbox, RadioGroup |
| Data Display | DataTable, List, Card, KpiCard, Chart, Tree, StatusChip, Badge, Avatar, Alert, DescriptionList |
| Workflow | TaskInbox, ApprovalPanel, ProcessTimeline, TransitionButton |
| Navigation | Button, MenuButton, Breadcrumb, Link, Toolbar |
| Enterprise | ObjectHeader, MasterDetail, Dashboard, WorkspaceShell, Stepper |

Each type declares a **contract**: prop schema (typed), slots/children, bindable properties, accessibility defaults `[L35]`, responsive behavior `[L36]`, events emitted.

## 6.5 Mapping layer
```
semanticType → Excellon wrapper (house style, behavior, a11y) → MUI Pro (web)
                                                              → native set (future, Doc 04)
```
- The wrapper is the single place MUI is customized "to any level"; the artifact and Meta Model never reference MUI `[L28]`.
- The mapping registry is what a platform runtime (Doc 03/04) supplies to the Renderer (Doc 02).

## 6.6 Versioning `[L37]`
- Semantic types and their contracts are versioned; a contract is stable within a major version.
- A breaking contract change is a new major version; artifacts pin the design-system version they compiled against (reconciled with artifact versioning, Doc 07).
- Component evolution must not silently break authored pages — contract changes run through impact analysis like any high-blast-radius change `[L45]`.

## 6.7 Invariants
Closed catalogue `[L32]`; brand via tokens only `[L33]`; flow layout primitives only `[L34]`; versioned, stable contracts `[L37]`; no MUI reference above the wrapper layer `[L28]`.

## 6.8 Open items
- DS1: Final v1 catalogue scope — start with the DMS-critical subset (DataTable, FormField, ObjectHeader, MasterDetail, Stepper, StatusChip, TaskInbox, Dashboard/KpiCard/Chart) and grow via governed registration.
- DS2: Token naming/structure standard — align to an established scale (e.g., a semantic-token tier over a primitive-token tier) for theme-cascade clarity.

*Next: Doc 07 — Compiler & Build.*
