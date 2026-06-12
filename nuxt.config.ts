export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,
  compatibilityDate: '2026-06-13',
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
    shim: false
  },
  app: {
    head: {
      title: '会计代账业务工作台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
