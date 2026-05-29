# Excellon Design System

A design system for **Excellon Software** — an automotive dealer-management platform (DMS) used by OEMs and dealerships across India and the Middle East. Excellon products are deployed under multiple OEM brand themes (Bajaj, KTM, Triumph, Hero, ARH, …) so the system is built around **theme-able tokens** with a default Excellon orange palette and per-OEM brand swaps (e.g. Bajaj blue).

The system covers the full surface of a dealership ops cockpit: **Service**, **Vehicle**, **Spare Parts** and **Finance** modules, joined by a shared sidebar nav, top bar, page headers, tables, and ~50 component categories.

---

## What's in this repo

| Path | What it is |
|---|---|
| `README.md` | You are here. Brand context, content + visual rules, iconography. |
| `SKILL.md` | Agent skill manifest — read first if running this as a packaged skill. |
| `colors_and_type.css` | All color, spacing, radius, shadow, typography tokens as CSS vars. |
| `fonts/` | Noto Sans family (variable + static cuts). |
| `assets/` | Excellon emblem, wordmark, module logos (Service / Vehicle / Spare Parts / Finance). |
| `preview/` | Specimen cards for the Design System tab — colors, type, spacing, components. |
| `ui_kits/excellon-app/` | Hi-fi recreation of the Excellon DMS app shell (sidebar, topbar, page header, table, modals). |

---

## Sources

- **Figma file:** `IDMS Design System.fig` (mounted as virtual filesystem during build).
  - Top-level pages of interest: `Cover`, `Excellon-Design-System-Specifications` (the canonical spec sheet, 15.6k px tall), `Colors`, `Typography`, `Logos`, `Buttons-Updated`, `Inputs`, `Application-Navigation`, `Top-Bar`, `Table`, `Page-Header`, `Modals`, `Effect-Styles`, `Space-Radius-Grids`.
  - Spec sheet node id: `5404:3393`.
  - Excellon emblem node id: `7457:4707`. Excellon wordmark: `7457:4676`.
- **Fonts:** Noto Sans family (Regular / Medium / SemiBold / Bold + Italic + Variable) provided in `uploads/`. Inter and Manrope are pulled from Google Fonts at runtime (see Substitutions below).
- **Spec sheet** carries: Basic + Neutral + Brand + Brand-Bajaj + Accent + More color scales, full font/weight/letter-spacing/line-height tables, border-radius scale, size & space scale (seed + scaled tokens), grid layouts (Desktop 1280 / Tab 768 / Mobile 375), input variants and the four module logos.

### Substitutions (flag for the user)

- **Strawford** (proprietary geometric humanist) is referenced in a handful of spec headings. Not provided. Substituted with **Manrope** (Google Fonts). If you have a Strawford license, drop the .ttf/woff2 into `fonts/` and update `--font-display` in `colors_and_type.css`.
- **Inter** is pulled from Google Fonts (used by spec callouts and small data labels per the figma). Provided as a CDN import — swap to a local copy if you need offline rendering.

---

## Products represented

The Figma covers a **single product surface — the Excellon DMS web app** — themed for multiple OEM clients. The most common module logos in the file are:

- **Service** — workshop ops, job cards, technician scheduling
- **Vehicle** — vehicle master, deliveries, registration
- **Spare Parts** — inventory, indents, reorder
- **Finance** — invoicing, receipts, GL posting

The same component library is recoloured for each OEM brand. The default theme is **Excellon orange** (`#EB6A2C`); the alternate documented in the file is **Bajaj blue** (`#0052FF`).

---

## CONTENT FUNDAMENTALS

Excellon is a **B2B operational tool used daily by dealership staff**. Copy is utilitarian: short, action-first, and indistinguishable from enterprise SaaS norms. The brand has zero playfulness — it earns trust by being clear, fast, and predictable.

**Voice**
- Neutral, declarative, third-person product voice. Never "we"; rarely "you".
- Action labels are imperative verbs: *Save*, *Cancel*, *Add Vehicle*, *Generate Invoice*, *Mark as delivered*.
- Empty states give a one-line direction, not a pep-talk. e.g. *"No invoices yet. Create one to get started."*
- Errors are specific and recoverable: *"Chassis number must be 17 characters."* — never just *"Invalid input."*

**Casing**
- **Title Case** for page titles, primary buttons, table column headers (*Job Card Number*, *Estimated Delivery*).
- **Sentence case** for body, helper text, descriptions, secondary buttons (*Cancel*, *View details*).
- **UPPERCASE** is reserved for tiny labels (`STATUS`, `VIN`) and the wordmark.

**Tone of words**
- Domain-specific: uses dealer/auto vocabulary directly — *Job Card*, *Indent*, *PDI*, *RC*, *Chassis*, *Engine no.*, *DMS*, *EMI*, *Indent No.*. No hand-holding glossaries.
- Numeric units shown explicitly: *₹*, *km*, *L*, *days*, *hrs*. Indian number formatting (1,23,456.00) on totals.
- Dates are `DD MMM YYYY` (`24 Apr 2026`). Time `HH:mm` (24h).

**No emoji.** Not in product copy, not in marketing text inside the app. Excellon never uses emoji as iconography or accent.

**No marketing puffery.** No "Welcome aboard!", no "🎉", no exclamation marks except in destructive confirmations (*"This will permanently delete the job card. Continue?"*).

---

## VISUAL FOUNDATIONS

Excellon's aesthetic is **functional enterprise** — the lineage is Carbon / Untitled UI / Material 3, recoloured around an unmistakable warm orange. Surfaces are flat, generous in whitespace, and densely informative when needed. Nothing decorative; every pixel answers a workflow question.

**Color**
- Primary action: **Excellon orange `#EB6A2C`** (brand-500). Used on filled CTA buttons, brand emblem, active sidebar item indicators, badge accents.
- Bulk of the surface is white (`#FFF`) on a faint slate-blue page background `#F4F7FA` (neutral-50). Cards/dialogs are white with `#DEE4EB` borders.
- Text is `#1B1D21` (near-black) for primary; `#505862` for secondary; `#717680` for muted/captions.
- Status colors follow standard semantic conventions — green (`#12B76A`), amber (`#F79009`), red (`#F04438`), blue info (`#2E90FA`), purple-violet (`#6929C4`) for secondary accent badges.
- A **radial orange-to-amber gradient** (`#FBB040 → #F15A29`) lives only inside the Excellon emblem — it never appears as a section background. No bluish-purple gradients, no rainbow accents.

**Type**
- **Noto Sans** does ~95% of the work — Regular / Medium / SemiBold / Bold. It's chosen for legibility across dense Indian/multilingual data tables and broad weight coverage.
- Display headings on marketing/spec surfaces use **Strawford → Manrope (substitute)**.
- Body baseline is **14px / 20px** (`--text-sm` / `--lh-sm`). 12px (`--text-xs`) is used in tables and captions; 16px in dialogs and primary copy.
- Numeric tabular alignment via `font-variant-numeric: tabular-nums` is encouraged in tables.

**Spacing**
- 4px grid base. Inputs and buttons sit on 32 / 36 / 40 / 44 px height ladders. Page padding 16/24px on mobile, 24/32px on tablet, 80px on desktop. Container max width 1216 px on a 1280 desktop.
- Section gap rhythm: 24 / 32 / 48 / 64.

**Backgrounds, imagery, gradients**
- **No full-bleed photography** in the product. Marketing/login may use a subtle slate-blue washed background image (the spec uses `#F4F7FA`).
- **No hand-drawn illustrations**. Empty states use simple geometric line illustrations or the module logo emblem at low opacity.
- **No repeating patterns or textures.** No grain, no noise. Surfaces are pure flat color.
- **One gradient only** — the brand emblem radial. Never extend it to backgrounds, never to buttons.

**Animation**
- Restrained. Sidebar collapse 200ms ease-out. Modal enter 150ms fade + 4px translate-y. Tooltip 80ms fade. Tab underline slides 180ms cubic-bezier(0.4, 0, 0.2, 1). No bounces, no spring physics.
- Loading uses a 1.4s linear spinner (orange) and skeleton bars at neutral-100 → neutral-200 shimmer.

**Hover states**
- **Filled brand button:** background steps to `--brand-600` (`#C44B1B`).
- **Secondary / tertiary button:** background steps from white → `--neutral-50` (`#F4F7FA`); text stays the same.
- **Table row:** background → `--neutral-50`.
- **Sidebar nav item:** background → `--neutral-100` for inactive, brand-50 for active hover.
- **Link / icon button:** color steps to `--brand-600` for brand, `--neutral-700` for gray.
- We do **not** use opacity for hover (no `hover:opacity-80`); all hover changes are explicit color swaps.

**Press states**
- Buttons: background steps one stop darker than hover (`--brand-700` for primary), no scale transform.
- Sidebar: background brand-100 (orange tinted) when active.

**Borders**
- Default 1px solid `#D5D7DA` (border-primary) on inputs and dialogs.
- Internal dividers: 1px `#DEE4EB` (border-secondary, neutral-200).
- Disabled: `#EFF2F5` (border-disabled).
- Focus: 2px outer brand ring `rgba(235,106,44,0.24)` paired with brand-500 border.

**Shadow / elevation system**
- 7-level scale `xs … 3xl` defined in tokens.
- Cards rest on `--shadow-xs` (`0 1px 2px rgba(10,13,18,0.05)`).
- Dropdowns/popovers use `--shadow-lg`.
- Modals use `--shadow-3xl`.
- No inner shadows. No glow shadows. No coloured shadows.

**Protection (overlay/scrim)**
- Modal scrim is `rgba(0,0,0,0.6)` flat — never a gradient.
- Dropdowns and tooltips never use a backdrop blur in the figma. Stay flat.

**Layout rules**
- Sidebar fixed at 264 px (desktop) / 64 px (collapsed).
- Topbar fixed at 64 px height.
- Page header sits below topbar, 80 px tall on desktop.
- Content max-width 1216 px on a 1280 grid; 12 col grid on desktop, 6 on tablet, 4 on mobile, 16/24/32 px gutters respectively.
- Right-side detail panels are a slide-out at 400 / 480 / 640 px depending on density.

**Transparency / blur**
- Almost never. The only transparency is the modal scrim and disabled-state colors. No backdrop-filter blur in the figma.

**Corner radii**
- Buttons / inputs / chips / badges: **8 px**.
- Cards / dialogs: **12 px**.
- Modals: **16 px**.
- Avatars / status dots: full (9999).
- Tables / table rows: **0 px** (sharp edges, edges meet container).

**Card anatomy**
- White background, 1px `#DEE4EB` border, 12 px radius, `--shadow-xs`, internal padding 24px (desktop) / 16px (tablet/mobile), header with 16/20 semibold title and optional secondary text below at 14/20 secondary fg.

---

## ICONOGRAPHY

The Figma file uses a **mixed icon system**:

1. **Custom module logos** (Service, Vehicle, Spare Parts, Finance) — 84×84 squared rectangles, dark glyph in slate `#181D27`, 24 px text label below ("Service" 700 SemiBold-ish). Hover variant fills the tile in brand-500 with white glyph. Copied into `assets/module-*.svg`.
2. **Excellon brand emblem** — the dual-arrow geometric mark in slate gray with the radial orange-amber gradient as the central "tongue". `assets/excellon-emblem.svg`.
3. **Generic UI icons** — the file references Untitled UI / Lucide-flavoured 24 px outline icons (search-magnifying-glass, plus, arrow-right, arrow-up, chevron-down, chevron-right, user-01, building-07, calendar, dots-grid, etc). The figma names map 1:1 to **Lucide React** identifiers, so we ship the system using **Lucide via CDN** (`https://unpkg.com/lucide@latest`) as a substitute. **Flagged substitution** — if Excellon ships a custom icon font, drop it in and update `ui_kits/excellon-app/index.html`.
4. **OEM client logos** (Bajaj, KTM, Triumph, Hero, ARH) appear in theme/branding plates. Not redistributable — placeholders only.
5. **No emoji.** No unicode dingbats as icons. No hand-rolled SVG inline in component code; icons are referenced by name.

Default sizes in the system: **16 / 20 / 24 / 32 / 40 / 48 px**, stroke 1.5px (Lucide default). Color follows text color via `currentColor`.

---

## Index of files

```
.
├── README.md                        ← brand, content, visual, iconography rules
├── SKILL.md                         ← Claude Skill manifest
├── colors_and_type.css              ← all design tokens
├── fonts/
│   └── NotoSans-*.ttf
├── assets/
│   ├── excellon-emblem.svg
│   ├── module-vehicle.svg / -hover.svg
│   ├── module-spareparts.svg / -hover.svg
│   └── ...
├── preview/                         ← Design System tab cards
│   ├── color-brand.html
│   ├── color-neutral.html
│   ├── color-semantic.html
│   ├── type-display.html
│   ├── type-scale.html
│   ├── spacing.html
│   ├── radius.html
│   ├── shadow.html
│   ├── components-buttons.html
│   ├── components-input.html
│   ├── components-badge-tag.html
│   ├── components-avatar.html
│   ├── components-modal.html
│   ├── brand-logo.html
│   └── brand-modules.html
└── ui_kits/excellon-app/
    ├── README.md
    ├── index.html                   ← interactive DMS shell
    ├── Sidebar.jsx
    ├── Topbar.jsx
    ├── PageHeader.jsx
    ├── DataTable.jsx
    ├── Button.jsx, Input.jsx, Badge.jsx, Modal.jsx
    └── screens/
        ├── ServiceDashboard.jsx
        ├── JobCardList.jsx
        └── VehicleDetail.jsx
```

---

## Quick start (in another project)

```html
<link rel="stylesheet" href="excellon-design-system/colors_and_type.css">
<button class="cta" style="
  background: var(--brand-500); color: var(--fg-on-brand);
  border-radius: var(--radius-lg); padding: 8px 14px; border: none;
">Add vehicle</button>
```
