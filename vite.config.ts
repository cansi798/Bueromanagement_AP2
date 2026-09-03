import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Stabile Vendor-Chunks: Content-/Code-Updates invalidieren so nicht
        // das ganze Bundle (bessere Cache-Trefferquote auf Schul-Geräten).
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('katex')) return 'katex'
            if (id.includes('roughjs') || id.includes('rough')) return 'rough'
            if (
              id.includes('react-markdown') ||
              id.includes('remark') ||
              id.includes('rehype') ||
              id.includes('micromark') ||
              id.includes('mdast') ||
              id.includes('hast') ||
              id.includes('unified') ||
              id.includes('unist') ||
              id.includes('vfile')
            )
              return 'markdown'
            if (id.includes('web-llm')) return 'webllm'
            return 'vendor'
          }
        },
      },
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.{ts,tsx}'], globals: true },
} as any)
