import jsEslint from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import tsEslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  jsEslint.configs.recommended,
  {
    files: ["**/*.mjs", "**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    plugins: {
      react,
      unicorn,
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "no-undef": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off", // Already handled by TypeScript
      "react-hooks/set-state-in-effect": "off", // Allow setState in effects for initialization scenarios
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsEslint.parser,
      ecmaVersion: "latest",
      parserOptions: {
        project: ["./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        "@": "readonly",
      },
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsEslint.plugin,
    },
    rules: {
      ...tsEslint.configs.strict[1].rules,
      ...tsEslint.configs.strict[2].rules,
      "@typescript-eslint/no-unused-vars": "off", // Disable no-unused-vars for unused imports for auto fix
      "@typescript-eslint/no-non-null-assertion": "off", // Disable non-null assertion check
      "@typescript-eslint/no-namespace": [
        "error",
        {
          allowDeclarations: true,
          allowDefinitionFiles: true,
        },
      ],
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
      // 禁用 any 类型
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
    },
  },
  {
    ignores: [
      ".prettierrc.js",
      "babel.config.js",
      "eslint.config.js",
      "vite.config.ts",
      "src/**/*.js",
      "templates/**",
      "dist/**",
      "build/**",
      "node_modules/**",
    ],
  },
];
