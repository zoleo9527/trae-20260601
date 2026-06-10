export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '电梯维保管理系统 - 年检与整改闭环',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '电梯维保年检资料管理与整改闭环系统' }
      ]
    }
  },
  typescript: {
    strict: true,
    shim: false
  },
  pinia: {
    storesDirs: ['./stores/**']
  }
})
