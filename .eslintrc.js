// @ts-check
module.exports = {
  root: true,
  ignorePatterns: ['node_modules', 'dist', '.turbo', '*.config.js'],
  overrides: [
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      extends: ['eslint-config-next/core-web-vitals'],
    },
    {
      files: ['apps/api/**/*.{ts}'],
      extends: ['eslint:recommended'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
      },
    },
    {
      files: ['packages/**/*.{ts}'],
      extends: ['eslint:recommended'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
    },
  ],
}
