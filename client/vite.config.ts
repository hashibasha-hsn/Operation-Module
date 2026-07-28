import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3009',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
