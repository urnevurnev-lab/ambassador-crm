import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900, // avoid warnings after splitting vendors
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          charts: ['recharts'],
          motion: ['framer-motion'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    host: true, // Разрешает доступ по сети (0.0.0.0)
    // Разрешаем доступ с туннелей Serveo/Ngrok и любых хостов
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '::1',
      '.serveo.net',
      '.serveousercontent.com',
      'all', // Vite 7: пропускает все домены
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
