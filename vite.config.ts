import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'
import Inspector from 'unplugin-vue-dev-locator/vite'
import traeBadgePlugin from 'vite-plugin-trae-solo-badge'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    vue(),
    Inspector(),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#app',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  server: {
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
