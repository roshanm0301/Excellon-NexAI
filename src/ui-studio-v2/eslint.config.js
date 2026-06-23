import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Block any relative import that goes up a directory level.
      // All cross-directory imports must use the @/ alias.
      // This prevents any code from escaping src/ui-studio-v2/.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./",
              message:
                "Parent-relative imports ('../') are forbidden. Use the @/ path alias for all cross-directory imports. " +
                "No import may resolve outside src/ui-studio-v2/.",
            },
          ],
        },
      ],
    },
  },
)
