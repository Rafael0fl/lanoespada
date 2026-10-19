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
    // Proxy: en desarrollo SOLO las rutas de la API van al backend FastAPI
    // local. Los assets del frontend (bajo /lanoespada/) los sirve Vite.
    // Si el backend esta apagado, el proxy devuelve error rapido y el
    // frontend cae en su pseudo-DB (modo demo).
    //
    // Al usar rutas relativas (API_BASE = ''), los requests salen desde el
    // MISMO origen que el navegador (localhost:5173 o el tunel ngrok) y el
    // proxy los reenvia a localhost:8000. Asi funciona desde cualquier
    // dispositivo sin CORS y sin configurar VITE_API_URL.
    proxy: Object.fromEntries(
      [
        '/auth',
        '/tenants',
        '/customers',
        '/metrics',
        '/webhooks',
        '/test',
        '/health',
        '/docs',
        '/redoc',
        '/openapi.json',
      ].map((path) => [
        path,
        { target: 'http://localhost:8000', changeOrigin: true },
      ]),
    ),
  },
})