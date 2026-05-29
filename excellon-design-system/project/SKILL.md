# Excellon Design System — Skill manifest

`name`: excellon-design-system
`description`: Tokens, components and product UI for the Excellon Software DMS — a B2B dealer-management platform used by Bajaj, KTM, Triumph, Hero and other OEM dealerships across India and the Middle East. Use whenever a request mentions Excellon, IDMS, dealer-management, or one of its modules (Service, Vehicle, Spare Parts, Finance).

## When to use this skill

- The user asks for a design "for Excellon", "for the dealer app", "Bajaj DMS", or names a module (Job Cards, Indents, Invoices, Vehicle master, etc.).
- The user uploads or links the `IDMS Design System.fig` and asks you to design against it.
- The user asks for the Excellon brand mark, color palette, button or input system.

## What's inside

- `colors_and_type.css` — every token. Import this; never hardcode hex values.
- `fonts/` — Noto Sans Regular / Medium / SemiBold / Bold + Italic + Variable.
- `assets/` — Excellon emblem (`excellon-emblem.svg`).
- `preview/` — single-card specimens for color, type, spacing, radius, shadows, components, brand.
- `ui_kits/excellon-app/` — a working hi-fi product mock (sidebar + topbar + page header + table + detail) with a built-in OEM theme tweak (Excellon ↔ Bajaj). Use it as the reference for layout, density, and component composition when building any new screen.
- `README.md` — full content rules, visual foundations, iconography rules. **Read this before designing.**

## How to design with it

1. **Read `README.md` first** — it sets voice, casing, hover/press behaviours, shadow rules, "no emoji", etc.
2. **Link `colors_and_type.css`** in the new page's `<head>`.
3. **Compose with the tokens** — `var(--brand-500)`, `var(--space-12)`, `var(--radius-lg)`, `var(--shadow-xs)`. Never invent colors or sizes.
4. **Reuse the patterns** in `ui_kits/excellon-app/` — sidebar nav, topbar layout, table chrome, badge variants — by reading those files for the working markup.
5. **For OEM-themed screens** (Bajaj, KTM, etc.) override only the `--brand-*` ramp at the body level — the `[data-theme="bajaj"]` block in `ui_kits/excellon-app/app.css` shows the pattern.
6. **For new modules** stay inside the four-module mental model (Service / Vehicle / Spare Parts / Finance). Use the corresponding module logo from `preview/brand-modules.html` as the in-app icon and the brand-50/700 active state.

## Substitutions to surface up-front

- **Strawford → Manrope** (display font; no license bundled). Override `--font-display` if a real Strawford file is provided.
- **OEM client logos** (Bajaj, KTM, Triumph, Hero, ARH) are referenced as text/initials only — never recreate them.
- **Generic UI icons** are line SVG drawn from Lucide-equivalent metaphors. If the user wants pixel parity with the figma's bespoke pictograms, ask for the source assets.

## Don'ts

- No emoji anywhere in product surfaces.
- No gradients on backgrounds, buttons, or charts — the radial orange-amber gradient is reserved for the brand emblem.
- No hand-drawn illustrations for empty states; use the module logo at low opacity or a simple geometric line drawing.
- No backdrop blur. Modals use a flat 60% black scrim only.
- No new color values — extend the ramp in `colors_and_type.css` instead.
