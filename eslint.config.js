// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'
import importX from 'eslint-plugin-import-x'

//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    plugins: {
      'import-x': importX,
    },
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            { target: './src/components', from: './src/features' },
            { target: './src/components', from: './src/routes' },
            { target: './src/hooks', from: './src/features' },
            { target: './src/hooks', from: './src/routes' },
            { target: './src/lib', from: './src/features' },
            { target: './src/lib', from: './src/routes' },
            { target: './src/stores', from: './src/features' },
            { target: './src/stores', from: './src/routes' },
            { target: './src/config', from: './src/features' },
            { target: './src/config', from: './src/routes' },
            { target: './src/features', from: './src/routes' },
            {
              target: './src/features/auth',
              from: './src/features',
              except: ['./src/features/auth'],
            },
            {
              target: './src/features/dashboard',
              from: './src/features',
              except: ['./src/features/dashboard'],
            },
            {
              target: './src/features/pakan',
              from: './src/features',
              except: ['./src/features/pakan'],
            },
            {
              target: './src/features/profile',
              from: './src/features',
              except: ['./src/features/profile'],
            },
            {
              target: './src/features/settings',
              from: './src/features',
              except: ['./src/features/settings'],
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/generated/**',
      '.output/**',
      'storybook-static/**',
    ],
  },
  ...storybook.configs['flat/recommended'],
]
