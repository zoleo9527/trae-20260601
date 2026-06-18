export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      title: '景区票务管理系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '景区票务-退票改期与投诉处理系统' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  },

  compatibilityDate: '2024-04-03'
})
