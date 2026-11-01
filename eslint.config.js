import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "src/api/schema.d.ts", "playwright-report", "test-results"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    // AGENTS rule 3: the API is only called through src/api/client.ts.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/api/**", "src/mocks/**", "src/test/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Use the typed client in @/api/client instead of fetch." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "fetch", message: "Use the typed client in @/api/client." },
      ],
    },
  },
  {
    // CONVENTIONS §7: only src/auth/ talks to the OIDC libraries.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/auth/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-oidc-context",
              message: "Use @/auth (useCurrentUser, RequireAuth, signOut).",
            },
            { name: "oidc-client-ts", message: "Use @/auth." },
          ],
        },
      ],
    },
  },
  {
    files: ["*.config.{js,ts}", "scripts/**"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
