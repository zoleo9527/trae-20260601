export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: ['@pinia/nuxt'],
  
  css: ['~/assets/css/main.css'],
  
  app: {
    head: {
      title: '保险理赔中心',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '保险理赔报案受理与材料清单管理系统' }
      ]
    }
  },

  routeRules: {
    '/api/**': { cors: true }
  },

  compatibilityDate: '2024-04-03',
  ssr: false,
  
  vite: {
    build: {
      rollupOptions: {
        input: {
          main: './app.vue'
        }
      }
    }
  }
})
