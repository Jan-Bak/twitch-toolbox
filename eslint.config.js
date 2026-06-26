import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from '@eslint-react/eslint-plugin';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import vitest from '@vitest/eslint-plugin';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'src-tauri'] },

  js.configs.recommended,

  {
    files: ['*.config.ts', '*.config.js', 'eslint.config.js'],
    extends: [...tseslint.configs.recommended],
  },

  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['components/**/*.ts', 'components/**/*.tsx', 'lib/**/*.ts', 'lib/**/*.tsx'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ...reactPlugin.configs['recommended-type-checked'],
  },

  {
    files: ['components/**/*.tsx', 'src/**/*.tsx'],
    ...reactPlugin.configs['recommended-type-checked'],
  },

  // react-refresh
  {
    files: ['src/**/*.tsx'],
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': 'warn',
    },
  },

  // Vitest
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },

  prettier
);
