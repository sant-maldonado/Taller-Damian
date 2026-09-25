import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,svg,png,woff2,html}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      }
    })
  ],
})
