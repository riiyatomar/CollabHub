import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('tldraw')) return 'whiteboard';
            if (id.includes('react')) return 'vendor';
            if (id.includes('lucide') || id.includes('date-fns') || id.includes('emoji-picker')) return 'ui';
            return 'modules';
          }
        }
      }
    }
  }
})
