// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

export default withNuxt(
  // Prettier integration - must be last to override other formatting rules
  eslintPluginPrettier,

  // Project-specific overrides
  {
    rules: {
      // Vue specific
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',

      // TypeScript specific
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },

  // Ignore patterns
  {
    ignores: ['node_modules/', '.nuxt/', '.output/', 'dist/', '.git/', '*.min.js', 'supabase/'],
  }
)
