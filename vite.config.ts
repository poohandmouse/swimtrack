import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Local / file:// builds use './'. GitHub Pages sets VITE_BASE_PATH (e.g. '/swimtrack/').
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || './',
  server: {
    proxy: {
      '/swimcloud-api': {
        target: 'https://www.swimcloud.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/swimcloud-api/, '/api'),
      },
    },
  },
})
