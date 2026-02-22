import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Aceita conexões de qualquer IP
    port: 5173,
    allowedHosts: ['epi.soepinaobasta.com'],
  },
})
