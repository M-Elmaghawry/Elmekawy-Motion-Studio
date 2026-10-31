import js from '@eslint/js';

// Incremental scope: CLI code changed in this iteration. Legacy code is frozen.
export default [
  {
    files: ['eslint.config.mjs', 'scripts/verify-launcher.mjs', 'scripts/verify-render-smoke.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Existing diagnostic polling deliberately tolerates non-JSON log lines.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
