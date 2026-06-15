import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/Users/zhangliu/Documents/private/model-test/trae-20260601-4/src',
    },
  },
})