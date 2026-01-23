
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Add type assertion to process.cwd() to resolve TypeScript error if @types/node is not correctly picked up.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    base: './',
    define: {
      // Fix: Add type assertion to process.env.GEMINI_API_KEY for the same reason.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || (process.env as any).GEMINI_API_KEY)
    }
  }
})