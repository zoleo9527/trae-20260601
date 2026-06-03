<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  FileCheck,
  MessageSquare,
  Handshake,
  LogOut,
  Users,
  UtensilsCrossed,
  ChefHat,
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const navItems = computed(() => [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/reconciliations', label: '尾款核对', icon: FileCheck },
  { path: '/feedbacks', label: '客户反馈', icon: MessageSquare },
  { path: '/handover', label: '交班视图', icon: Handshake },
])

const roleIcon = computed(() => {
  if (!userStore.user) return null
  const icons = { sales: Users, hall: UtensilsCrossed, kitchen: ChefHat }
  return icons[userStore.user.role]
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex">
    <aside class="w-60 bg-slate-900 flex flex-col fixed h-full z-20">
      <div class="p-6 border-b border-slate-700">
        <h1 class="text-xl font-serif text-white tracking-wide">宴会管理</h1>
        <p class="text-slate-400 text-xs mt-1">尾款核对 · 客户反馈</p>
      </div>

      <nav class="flex-1 py-4">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-all mx-3 rounded-lg mb-1"
          :class="{ 'bg-slate-800 text-white border-l-4 border-amber-500': route.path.startsWith(item.path) }"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span class="text-sm font-medium">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-slate-700">
        <div class="bg-slate-800 rounded-xl p-4 mb-3">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
              <component :is="roleIcon" class="w-5 h-5 text-white" v-if="roleIcon" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">{{ userStore.user?.name }}</p>
              <p class="text-slate-400 text-xs">{{ userStore.roleLabel }}</p>
            </div>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-sm"
        >
          <LogOut class="w-4 h-4" />
          切换身份
        </button>
      </div>
    </aside>

    <main class="flex-1 ml-60">
      <div class="p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>
