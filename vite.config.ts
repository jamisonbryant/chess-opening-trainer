import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/chess-opening-trainer/',
  plugins: [vue()],
  preview: {
    allowedHosts: ['storyvault.tail3fd0f.ts.net'],
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/main.ts', 'src/demo.ts', 'src/**/*.tsv'],
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
})
