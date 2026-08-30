import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // An `_`-prefixed binding is a deliberate discard, and a property pulled
      // out only to omit it from a rest spread is never read by design. Both
      // are intent, not oversight. Same rule and same reasoning as console-fe.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // shadcn-style component files co-export their cva variants and small
    // helpers; losing fast-refresh for these vendored files is acceptable.
    //
    // The two page modules are the same co-export pattern by choice, and
    // console-fe carves out its `health/primitives.tsx` for the same reason.
    // `branch-display.tsx` says in its own docstring why it is a module rather
    // than exports on the list: the drawer imports it and the list imports the
    // drawer, so splitting it further would restore the cycle it was made to
    // break. `promotion-picker.tsx` co-exports the read/write pair for the
    // control it defines, which belong beside it.
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/pages/protected/branches/branch-display.tsx',
      'src/pages/protected/academics/programs/promotion-picker.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
