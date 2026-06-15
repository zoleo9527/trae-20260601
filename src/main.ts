import { createNuxtApp } from 'nuxt/app'

async function main() {
  const app = createNuxtApp()
  await app.mount('#app')
}

main()
