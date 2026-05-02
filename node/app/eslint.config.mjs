import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: { ...globals.node, ...globals.browser } }, rules: { "no-unused-vars": ["error", { caughtErrors: "none" }], "no-useless-assignment": "off" } },
  { files: ["**/public/**/*.js"], languageOptions: { globals: { ...globals.browser, bootstrap: "readonly" } } },
  { files: ["**/tests/**/*.js", "**/*.test.js"], languageOptions: { globals: { ...globals.jest } }, rules: {'no-unused-vars' : 'warn', 'no-undef' : 'warn'} },
]);
