export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  experimental: {
    asyncContext: true
  },
  nitro: {
    storage: {
      data: {
        driver: 'fs',
        base: './.data'
      }
    }
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      appName: '产业园招商入驻验收系统'
    }
  }
})
