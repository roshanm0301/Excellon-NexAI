import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"

// ── Shared patterns ───────────────────────────────────────────────────────────

// Phase 6 §B.1 — isolation firewall: no import may escape src/ui-studio-v2/
const isolationPattern = {
  regex: "^\\.\\./",
  message:
    "Parent-relative imports ('../') are forbidden. Use the @/ path alias for all " +
    "cross-directory imports. No import may resolve outside src/ui-studio-v2/.",
}

// Phase 4 §7.1 — chrome ≠ canvas boundary (PDR-01)
const noSharedUiPattern = {
  regex: "^@/shared/ui",
  message:
    "runtime-preview must not import from @/shared/ui. " +
    "Chrome (shadcn/Tailwind) and Canvas (MUI Pro) boundaries must stay separate. [Phase 4 §7.1]",
}

const noRuntimePreviewPattern = {
  regex: "^@/runtime-preview",
  message:
    "shared/ui (chrome) must not import from @/runtime-preview. " +
    "Chrome (shadcn/Tailwind) and Canvas (MUI Pro) boundaries must stay separate. [Phase 4 §7.1]",
}

// Phase 4 §1 — no deep cross-feature imports; go through the feature's index.ts barrel
// e.g. @/features/canvas/components/CanvasView must not be imported directly by another feature.
// Within the same feature, use @/ paths — this rule is intentionally broad and flags all deep
// feature paths; same-feature deep imports are allowed by convention (document in CLAUDE.md).
const noDeepFeaturePattern = {
  regex: "^@/features/[^/]+/(components|hooks|state|api)/",
  message:
    "Deep cross-feature imports are forbidden. Import from the feature's public barrel " +
    "(@/features/<name>) instead of its internal sub-directories. [Phase 4 §1]",
}

// ── ESLint config ─────────────────────────────────────────────────────────────

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "public/**", "coverage/**"] },

  // ── Global rules (all TS/TSX) ─────────────────────────────────────────────
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [isolationPattern, noDeepFeaturePattern],
        },
      ],
    },
  },

  // ── runtime-preview ≠ shared/ui (Phase 4 §7.1 / PDR-01) ─────────────────
  {
    files: ["src/runtime-preview/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [isolationPattern, noSharedUiPattern],
        },
      ],
    },
  },

  // ── shared/ui ≠ runtime-preview (Phase 4 §7.1 / PDR-01) ─────────────────
  {
    files: ["src/shared/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [isolationPattern, noRuntimePreviewPattern],
        },
      ],
    },
  },
)
