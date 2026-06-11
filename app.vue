<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-8">
            <h1 class="text-xl font-bold text-gray-900">
              🔒 安防工程商管理系统
            </h1>
            <nav v-if="authStore.isLoggedIn" class="flex gap-1">
              <NuxtLink 
                to="/" 
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="route.path === '/' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'"
              >
                📊 卡住看板
              </NuxtLink>
              <NuxtLink 
                to="/surveys" 
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="route.path.startsWith('/surveys') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'"
              >
                📍 点位勘察
              </NuxtLink>
              <NuxtLink 
                to="/plans" 
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="route.path.startsWith('/plans') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'"
              >
                📋 方案确认
              </NuxtLink>
            </nav>
          </div>
          <div v-if="authStore.isLoggedIn" class="flex items-center gap-4">
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">{{ authStore.user?.realName }}</div>
              <div class="text-xs text-gray-500">{{ getRoleText(authStore.user?.role || '') }}</div>
            </div>
            <button @click="logout" class="btn-secondary text-sm">
              退出登录
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const route = useRoute()

onMounted(() => {
  authStore.restoreSession()
})

function logout() {
  authStore.logout()
  navigateTo('/login')
}
</script>
