import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
// Tasks: Implement alias for imports
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({ registerType: 'autoUpdate' })
  ],
})
