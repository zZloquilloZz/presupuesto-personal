// ESLint flat config — React 18 + hooks. Proyecto JS puro (sin TypeScript).
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["dist/**", "node_modules/**"] },

  js.configs.recommended,

  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "18" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // JSX runtime nuevo: no hace falta importar React en cada archivo
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      // Sin TypeScript: prop-types sería ruido excesivo
      "react/prop-types": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Texto JSX con comillas/apóstrofes: cosmético, sin valor real
      "react/no-unescaped-entities": "off",
      // Patrones existentes no-bloqueantes: avisar, no romper el lint
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  // Tests con globals de Vitest
  {
    files: ["src/**/*.test.{js,jsx}"],
    languageOptions: { globals: { ...globals.node } },
  },

  prettier,
];
