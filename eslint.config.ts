import eslintJs from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default defineConfig({
  files: ['**/*.ts', '**/*.tsx'],
  plugins: {
    import: importPlugin,
    prettier: prettierPlugin,
    react: reactPlugin,
    'jsx-a11y': jsxA11yPlugin,
  },

  // Extend recommended rule sets from:
  // 1. ESLint JS's recommended rules
  // 2. TypeScript ESLint recommended rules
  // 3. ESLint React's recommended-typescript rules
  extends: [eslintJs.configs.recommended, tseslint.configs.recommended],

  // Configure language/parsing options
  languageOptions: {
    // Use TypeScript ESLint parser for TypeScript files
    parser: tseslint.parser,
    parserOptions: {
      // Enable project service for better TypeScript integration
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },

  // Custom rule overrides (modify rule levels or disable rules)
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './src/features/sidebar',
            from: './src/features',
            except: ['./sidebar'],
          },
          // enforce unidirectional codebase:

          // e.g. src/app can import from src/features but not the other way around
          {
            target: './src/features',
            from: './src/app',
          },

          // e.g src/features and src/app can import from these shared modules but not the other way around
          {
            target: [
              './src/components',
              './src/hooks',
              './src/lib',
              './src/types',
              './src/utils',
            ],
            from: ['./src/features', './src/app'],
          },
        ],
      },
    ],
    'import/no-cycle': 'error',
    'linebreak-style': ['error', 'unix'],
    'react/prop-types': 'off',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-named-as-default': 'off',
    'react/react-in-jsx-scope': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/explicit-function-return-type': ['off'],
    '@typescript-eslint/explicit-module-boundary-types': ['off'],
    '@typescript-eslint/no-empty-function': ['off'],
    '@typescript-eslint/no-explicit-any': ['off'],
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
  },
});
