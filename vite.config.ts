import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  preview: {
    allowedHosts: ['storyvault.tail3fd0f.ts.net'],
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/main.ts', 'src/**/*.tsv'],
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
})
