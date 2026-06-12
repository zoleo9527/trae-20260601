export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  if (process.client) {
    authStore.restoreSession()
  }
  
  if (!authStore.isLoggedIn && to.path !== '/login') {
    return navigateTo('/login')
  }
  
  if (authStore.isLoggedIn && to.path === '/login') {
    return navigateTo('/')
  }
  
  if (authStore.isLoggedIn && to.path === '/') {
    const roleMap: Record<string, string> = {
      manager: '/manager',
      director: '/director',
      engineer: '/engineer'
    }
    return navigateTo(roleMap[authStore.userRole!] || '/login')
  }
})
