import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Kept apart from vite.config.ts so tests don't load the PWA and Tailwind plugins.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // Node has Web Crypto built in, which is all the crypto code needs.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
