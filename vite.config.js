import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Set base to '/<repo-name>/' for GitHub Pages, or '/' for custom domain
  base: process.env.GITHUB_PAGES ? '/bank-app/' : '/',
  plugins: [react()],
  build: {
    // Raise the advisory threshold to cover the vendor-pdf chunk
    // (jsPDF + html2canvas combined = 600 kB minified / 176 kB gzipped).
    // This is a cached vendor chunk only loaded when a user downloads a receipt.
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin-portal-99.html'),
        vault: resolve(__dirname, 'system-control-vault-77.html'),
      },
      output: {
        // Split heavy third-party libs into separate cacheable chunks.
        // Browser caches these independently — when app code changes,
        // users only re-download the app chunk, not the vendor chunks.
        manualChunks(id) {
          // React core — changes rarely, cache aggressively
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          // PDF generation libs — only loaded when user downloads a receipt
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf'
          }
        },
      },
    },
  },
})
