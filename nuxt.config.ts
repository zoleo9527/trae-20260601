export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  imports: {
    dirs: ['stores', 'utils']
  },
  pinia: {
    autoImports: ['defineStore', 'storeToRefs']
  }
})
