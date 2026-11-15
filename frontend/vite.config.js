import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev only: forwards /api to the backend. In Docker, nginx does this instead.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, proxy: { '/api': process.env.VITE_API_TARGET || 'http://localhost:5000' } }
})
