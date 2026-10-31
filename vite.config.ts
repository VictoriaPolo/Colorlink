/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
    // Los tests deben ejercitar siempre el respaldo local (localStorage), nunca
    // la Supabase real -- sin esto, si el desarrollador tiene .env.local
    // configurado, Vite lo carga también en modo test y los tests terminan
    // leyendo/escribiendo en la base de datos real en vez de usar mocks.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_MODO_DEMO: '',
      VITE_GOOGLE_CLIENT_ID: '',
      VITE_FACEBOOK_APP_ID: '',
    },
  },
})
