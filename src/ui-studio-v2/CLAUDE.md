# UI Studio V2 — Module Operating Contract

> Read this file completely before writing any code, creating any file, or making any decision.
> This file governs ONLY `src/ui-studio-v2/`. The repo-root CLAUDE.md does NOT apply here.

---

## Module Boundary — ABSOLUTE

This module lives at `src/ui-studio-v2/`. Its boundary is its directory root.

**NEVER modify, import from, or depend on anything outside `src/ui-studio-v2/`.**

Forbidden targets — explicitly named:
- `src/react/` (V1 frontend)
- `src/go/` (Go backend)
- `src/node/` (Node middleware)
- `excellon-design-system/` (shared design system)
- `db/`, `docs/`, `scripts/` (repo infrastructure)
- Root `Makefile`, `docker-compose.yml`, `CLAUDE.md`, `tsconfig.json`, or any root config

Any import path containing `../` is forbidden — ESLint enforces this and it is a build error.

---

## Anti-Hallucination Rules

1. **Do not invent APIs.** If an MSW handler does not exist in `src/mocks/`, the endpoint does not exist. Write the handler first, then call it.
2. **Do not invent components.** If a component is not in `src/components/`, it does not exist. Create it first.
3. **Do not reference V1 code.** Nothing from `src/react/` exists in this module. Do not copy from it, read it, or mention it.
4. **Do not infer from the repo-root CLAUDE.md.** Only THIS file governs this module.
5. **No `any`, no `as unknown as X`.** TypeScript strict mode is non-negotiable.

---

## Backend — MSW Only

There is **no real backend** in this module. All network calls are intercepted by MSW (Mock Service Worker).

- MSW handlers live in `src/ui-studio-v2/src/mocks/`
- API calls use the module-local `apiFetch<T>()` wrapper at `src/lib/api.ts`
- **NEVER proxy to `localhost:9080`** or any external address
- **NEVER add a Vite `server.proxy` entry** pointing outside this module
- **NEVER import the Go API types** or any Go-generated code

---

## Design System — Two-Layer Architecture

### Studio Chrome (navigation, sidebars, toolbars, shell panels)
- Built with **shadcn/ui** components + **Tailwind CSS v3**
- All chrome components live in `src/components/ui/`
- Use `cn()` from `src/lib/utils.ts` for class merging
- **DO NOT import from `excellon-design-system/`**

### Runtime Canvas (entity forms, data grids, field renderers, view surfaces)
- Built on **MUI Pro** (`@mui/material`, `@mui/x-data-grid-pro`)
- All runtime components live in `src/components/runtime/`
- **DO NOT invent a non-MUI runtime vocabulary** — MUI Pro is the only runtime component language
- Use MUI `sx` prop or `styled()` for runtime styling — not Tailwind classes

**No mixing**: Chrome uses Tailwind. Runtime uses MUI `sx`/`styled`. Do not cross these layers.

---

## Technology Stack (this module only)

| Concern | Package |
|---------|---------|
| UI framework | React 19 + TypeScript strict |
| Build | Vite 5 — dev server port **5175** |
| Server state | TanStack Query v5 |
| Backend mock | MSW v2 |
| Studio chrome | shadcn/ui + Tailwind CSS v3 |
| Runtime canvas | MUI Pro v9 (`@mui/material`, `@mui/x-data-grid-pro`) |
| Unit tests | Vitest |
| Integration tests | Playwright (`playwright.config.ts` inside this module) |

---

## Import Convention

ALL cross-directory imports use the `@/` alias (resolves to `./src/`):

```ts
// Correct
import { Button } from "@/components/ui/button"
import { useEntityData } from "@/hooks/useEntityData"
import { apiFetch } from "@/lib/api"

// Forbidden — triggers ESLint error, breaks isolation
import { Button } from "../components/ui/button"
import { Something } from "../../react/src/types"
```

Same-directory imports (`./foo`) are allowed. Any `../` is forbidden.

---

## File Structure

```
src/ui-studio-v2/
├── CLAUDE.md            ← this file (do not delete or move)
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── tailwind.config.ts
├── postcss.config.js
├── playwright.config.ts
├── index.html
├── docs/                ← reference docs uploaded by the team (read-only)
├── e2e/                 ← Playwright tests
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css        ← Tailwind directives only
    ├── vite-env.d.ts
    ├── components/
    │   ├── ui/          ← shadcn/ui chrome components (Tailwind)
    │   └── runtime/     ← MUI Pro runtime components
    ├── hooks/           ← React hooks
    ├── lib/
    │   ├── api.ts       ← apiFetch<T>() wrapper (all API calls go through here)
    │   └── utils.ts     ← cn() Tailwind merge utility
    ├── mocks/           ← MSW handlers (one file per domain)
    ├── pages/           ← Route-level page components
    └── types/           ← TypeScript type definitions
```

---

## When in Doubt

1. Is the file outside `src/ui-studio-v2/`? Do not touch it.
2. Does the MSW handler for the endpoint exist? If not, write it first.
3. Does the component exist in `src/components/`? If not, create it there first.
4. Does the type exist in `src/types/`? If not, define it.
5. Does the hook exist in `src/hooks/`? If not, create it.
