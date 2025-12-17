import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './editor',
  publicDir: '../public',
  build: {
    outDir: '../dist-editor',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/editor',
    },
  },
})
