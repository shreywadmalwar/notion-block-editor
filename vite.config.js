import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site from /<repo-name>/, so asset URLs need the
  // prefix in production. Dev stays at root.
  base: process.env.NODE_ENV === 'production' ? '/notion-block-editor/' : '/',
})
