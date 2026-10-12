import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/lanoespada/',
  plugins: [react(), tailwindcss()],
  server: {
    // Permite entradas por los tuneles ngrok (el Host de la request es el
    // dominio .ngrok-free.dev, que Vite bloquea por defecto con allowedHosts).
    allowedHosts: ['.ngrok-free.dev'],
    // Proxy: en desarrollo las llamadas a /v1/* van al backend FastAPI local.
    // Si el backend esta apagado, el proxy devuelve error rapido y el
    // frontend cae en su pseudo-DB (modo demo).
    proxy: {
      '/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})