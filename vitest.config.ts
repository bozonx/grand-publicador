import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Use happy-dom for faster unit tests
    environment: 'happy-dom',

    // Test file patterns
    include: ['tests/**/*.{test,spec}.{js,ts}', 'app/**/*.{test,spec}.{js,ts}'],

    // Exclude patterns
    exclude: ['node_modules', '.nuxt', '.output', 'dist'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{js,ts,vue}'],
      exclude: ['node_modules', '.nuxt', 'app/types/**', '**/*.d.ts'],
    },

    // Timeout for tests
    testTimeout: 10000,

    // Setup files (if needed in future)
    // setupFiles: ['./tests/setup.ts'],
  },
})
