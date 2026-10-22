import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules } from "@eslint/compat";
// import { tanstackConfig } from '@tanstack/eslint-config'

export default defineConfig([
  globalIgnores([
    "dist",
    "pkg/**",
    "archive/**",
    "src/routeTree.gen.*",
    "**/*.timestamp-*.mjs",
  ]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      ...fixupConfigRules([
        react.configs.flat.recommended,
        react.configs.flat["jsx-runtime"],
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
      ]),
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);
