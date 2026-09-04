import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Responder console build — a separate bundle with NO reporter code.
// Build:  vite build --config vite.responder.config.ts   → dist-responder/
// Dev:    vite --config vite.responder.config.ts         → port 5174
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'http://localhost:8080', ws: true },
    },
  },
  build: {
    outDir: 'dist-responder',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index-responder.html',
    },
  },
})
