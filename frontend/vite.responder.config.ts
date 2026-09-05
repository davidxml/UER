import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Responder console build — a separate bundle with NO reporter code.
// Build:  vite build --config vite.responder.config.ts   → dist-responder/
// Dev:    vite --config vite.responder.config.ts         → port 5174
//
// Vite's dev server serves index.html at the root by default, which would load
// the REPORTER bundle (src/main.tsx → virtual:pwa-register). These middleware
// rules rewrite the root and the responder SPA routes to index-responder.html
// so the responder console is served at http://localhost:5174/ during dev.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'responder-dev-root',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = (req.url ?? '').split('?')[0]
          if (
            url === '/' ||
            url.startsWith('/login') ||
            url.startsWith('/dashboard')
          ) {
            req.url = '/index-responder.html'
          }
          next()
        })
      },
    },
  ],
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'http://localhost:8080', ws: true },
    },
  },
  preview: {
    port: 4181,
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
