// SPDX-FileCopyrightText: The SWAP-IT Dashboard Contributors
// SPDX-License-Identifier: CC0-1.0

import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

// declare global functions for eslint
const codeVisuGlobalFunctions = {
  createCodeVisualization: "readonly",
  flipTokensForNodeIds: "readonly",
  getElementsFromDotfile: "readonly",
  getCy: "readonly"
};

const globalModuleVariables = {
  bootstrap: "readonly"
};

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      semi: "error",
      "prefer-const": "error",
      curly: "error",
      camelcase: "error",
      "no-unused-vars": "off"
    }
  },
  {
    ignores: ["static/js/bundle.js", "static/js/dotparser_worker.js"]
  },
  {
    languageOptions: {
      globals: {
        ...codeVisuGlobalFunctions,
        ...globalModuleVariables,
        ...globals.browser,
        ...globals.jquery,
        ...globals.node
      }
    }
  }
];
