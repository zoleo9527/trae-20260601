<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Home, ArrowRightLeft, ClipboardCheck, FileText, LogOut } from 'lucide-vue-next'
import RoleBadge from '@/components/RoleBadge.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { path: '/', label: '工作台', icon: Home },
  { path: '/transfer', label: '转栏管理', icon: ArrowRightLeft },
  { path: '/assessment', label: '淘汰评估', icon: ClipboardCheck },
  { path: '/log', label: '操作日志', icon: FileText },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const roleColor = computed(() => {
  const map: Record<string, string> = {
    '繁育员': 'text-emerald-400',
    '兽医': 'text-blue-400',
    '场长': 'text-amber-400',
  }
  return map[auth.role || ''] || 'text-slate-400'
})

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div v-if="auth.isLoggedIn" class="flex h-screen overflow-hidden">
    <aside class="w-56 bg-[#1a1a2e] border-r border-slate-700 flex flex-col shrink-0">
      <div class="px-5 py-5 border-b border-slate-700">
        <h1 class="text-lg font-semibold text-slate-100">仔猪转栏</h1>
        <p class="text-xs text-slate-500 mt-0.5">淘汰评估系统</p>
      </div>
      <nav class="flex-1 py-3 px-3 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            isActive(item.path)
              ? 'bg-emerald-600/20 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          ]"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="px-4 py-4 border-t border-slate-700 space-y-3">
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">当前角色</span>
          <RoleBadge :role="auth.role!" />
        </div>
        <div class="text-xs text-slate-500">{{ auth.name }}</div>
        <button
          @click="handleLogout"
          class="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          <LogOut :size="14" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
    <main class="flex-1 overflow-y-auto bg-[#0f172a] p-6">
      <router-view />
    </main>
  </div>
  <router-view v-else />
</template>
