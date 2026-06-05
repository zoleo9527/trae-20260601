export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  const publicPages = ['/login', '/']

  if (publicPages.includes(to.path)) return

  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }
})
