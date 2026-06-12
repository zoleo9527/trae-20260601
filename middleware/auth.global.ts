export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  authStore.restoreSession()
  
  if (!authStore.isLoggedIn && to.path !== '/login') {
    return navigateTo('/login', { replace: true })
  }
  
  if (authStore.isLoggedIn && to.path === '/login') {
    const roleMap: Record<string, string> = {
      manager: '/manager',
      director: '/director',
      engineer: '/engineer'
    }
    return navigateTo(roleMap[authStore.userRole!] || '/login', { replace: true })
  }
  
  if (authStore.isLoggedIn && to.path === '/') {
    const roleMap: Record<string, string> = {
      manager: '/manager',
      director: '/director',
      engineer: '/engineer'
    }
    return navigateTo(roleMap[authStore.userRole!] || '/login', { replace: true })
  }
})
