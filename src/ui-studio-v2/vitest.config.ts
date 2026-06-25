import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"

// Phase 6 §E — test configuration; coverage gates enforced per prompt
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Coverage measures hand-written logic. Excluded: vendored shadcn primitives,
      // the declarative MUI runtime component map (exercised via Renderer/e2e),
      // type-only modules, barrels, mocks/test infra, and app bootstrap/routing.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/test/**",
        "src/mocks/**",
        "src/runtime-preview/componentMap.ts",
        // The MUI runtime canvas surface (DOM measurement + HTML5 drag-drop) is
        // exercised by the Playwright e2e journeys, not unit branch coverage.
        "src/features/canvas/components/CanvasSurface.tsx",
        // Vendored shadcn/Radix/cmdk primitives — library code with many internal
        // variant branches that aren't hand-written product logic.
        "src/shared/ui/dropdown-menu.tsx",
        "src/shared/ui/command.tsx",
        "src/shared/ui/select.tsx",
        "src/domain/types/**",
        "src/**/index.ts",
        "src/main.tsx",
        "src/App.tsx",
        "src/app/**",
        // Route components are framework wiring (createRoute, loaders) covered by
        // e2e; search-schemas.ts (.ts) stays counted and is unit-tested.
        "src/routes/**/*.tsx",
        "src/vite-env.d.ts",
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
