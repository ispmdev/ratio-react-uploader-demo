import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // This ensures relative paths for GitHub Pages
  build: {
    outDir: 'docs'  // Output to docs folder for GitHub Pages
  }
})