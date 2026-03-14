import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Set base to '/<repo-name>/' for GitHub Pages, or '/' for custom domain
  base: process.env.GITHUB_PAGES ? '/TD-BANK-APP/' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin-portal-99.html'),
        vault: resolve(__dirname, 'system-control-vault-77.html'),
      },
    },
  },
})
