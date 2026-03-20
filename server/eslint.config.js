import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**"],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.ts"],
        plugins: {
            prettier: prettierPlugin,
        },
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "prettier/prettier": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        },
    },
    prettierConfig
);
