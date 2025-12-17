import { config as baseConfig } from "./base.js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

/**
 * A custom ESLint configuration for libraries that use Node.js.
 *
 * @type {import("eslint").Linter.Config[]} */
export const nodeConfig = [
    ...baseConfig,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: globals.node
        },
        rules: {
            "turbo/no-undeclared-env-vars": "off",
            "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "no-console": "off",
            "prefer-const": "error",
            "no-var": "error",
            "object-shorthand": "error",
            "prefer-arrow-callback": "error"
        }
    },
    {
    files: ["tests/**/*.{ts,js}"],
        languageOptions: {
            globals: {
                describe: "readonly",
                it: "readonly",
                expect: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                jest: "readonly"
            }
        }
    },
    {
        ignores: ["coverage/**", "logs/**"]
    },
    eslintConfigPrettier
];