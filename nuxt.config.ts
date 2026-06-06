export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: [
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'
        }
      ]
    }
  },
  typescript: {
    strict: true,
    typeCheck: false
  },
  vite: {
    server: {
      fs: {
        allow: ['..']
      }
    }
  },
  nitro: {
    storage: {
      data: {
        driver: 'memory'
      }
    }
  },
  compatibilityDate: '2024-04-03',
  future: {
    compatibilityVersion: 4
  }
})
