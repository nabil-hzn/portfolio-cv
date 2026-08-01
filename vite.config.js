import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: '/portfolio-cv/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        calendar: resolve(__dirname, 'calendar.html'),
      },
    },
  },
})
