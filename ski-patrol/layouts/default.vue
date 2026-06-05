<template>
  <div class="min-h-screen bg-slate-900 text-white flex">
    <aside v-if="authStore.isLoggedIn" class="w-64 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
      <div class="p-5 border-b border-slate-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
            <MountainSnow class="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 class="text-sm font-bold text-white">雪道巡查</h1>
            <p class="text-xs text-slate-400">风险上报系统</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
          :class="isActive(item.to) ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="p-4 border-t border-slate-700">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
               :class="roleAvatarClass">
            {{ authStore.user?.name?.charAt(0) }}
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ authStore.user?.name }}</p>
            <p class="text-xs text-slate-400">{{ authStore.roleName }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="w-full text-left text-xs text-slate-400 hover:text-white transition-colors">
          退出登录
        </button>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { MountainSnow, LayoutDashboard, Shield, AlertTriangle, Settings } from 'lucide-vue-next'

const authStore = useAuthStore()
const route = useRoute()

const navItems = computed(() => [
  { to: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { to: '/patrols', label: '巡查管理', icon: Shield },
  { to: '/risks', label: '风险上报', icon: AlertTriangle },
  { to: '/settings', label: '系统管理', icon: Settings },
])

const roleAvatarClass = computed(() => {
  const role = authStore.user?.role
  if (role === 'rental') return 'bg-emerald-500/20 text-emerald-400'
  if (role === 'coach') return 'bg-purple-500/20 text-purple-400'
  return 'bg-sky-500/20 text-sky-400'
})

function isActive(path: string) {
  return route.path.startsWith(path)
}

function handleLogout() {
  authStore.logout()
  navigateTo('/login')
}
</script>
