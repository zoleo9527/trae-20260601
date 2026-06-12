const roleRouteMap: Record<string, string> = {
  manager: '/manager',
  director: '/director',
  engineer: '/engineer'
}

const routeRoleMap: Record<string, string> = {
  '/manager': 'manager',
  '/director': 'director',
  '/engineer': 'engineer'
}

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  authStore.restoreSession()
  
  if (!authStore.isLoggedIn && to.path !== '/login') {
    return navigateTo('/login', { replace: true })
  }
  
  if (authStore.isLoggedIn && to.path === '/login') {
    return navigateTo(roleRouteMap[authStore.userRole!] || '/login', { replace: true })
  }
  
  if (authStore.isLoggedIn && to.path === '/') {
    return navigateTo(roleRouteMap[authStore.userRole!] || '/login', { replace: true })
  }
  
  if (authStore.isLoggedIn) {
    const requiredRole = routeRoleMap[to.path]
    if (requiredRole && authStore.userRole !== requiredRole) {
      const roleNameMap: Record<string, string> = {
        manager: '招商经理',
        director: '招商主管',
        engineer: '物业工程'
      }
      const targetPath = roleRouteMap[authStore.userRole!] || '/login'
      return navigateTo({
        path: targetPath,
        query: { forbidden: '1', from: to.path, role: roleNameMap[requiredRole] || requiredRole }
      }, { replace: true })
    }
  }
})
