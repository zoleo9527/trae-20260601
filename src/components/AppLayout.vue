<template>
  <div class="flex h-screen bg-[#F7F9FC]">
    <aside class="w-56 bg-[#1B4965] flex flex-col shrink-0">
      <div class="h-16 flex items-center px-5 border-b border-white/10">
        <span class="text-white text-lg font-bold tracking-wide">口腔耗材商</span>
      </div>
      <nav class="flex-1 py-4 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors relative"
          :class="
            isActive(item.to)
              ? 'text-white bg-white/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-white before:rounded-r'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          "
        >
          <component :is="item.icon" class="w-4.5 h-4.5" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="px-5 py-4 border-t border-white/10">
        <p class="text-white/40 text-xs">v0.1 原型</p>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 shrink-0">
        <div />
        <div class="flex items-center gap-3">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="badgeStyle"
          >
            {{ roleStore.roleLabel }}
          </span>
          <RoleSwitcher />
        </div>
      </header>
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, RefreshCw, Receipt } from 'lucide-vue-next'
import { useRoleStore } from '@/stores/role'
import RoleSwitcher from './RoleSwitcher.vue'

const route = useRoute()
const roleStore = useRoleStore()

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/aftersales', label: '售后退换', icon: RefreshCw },
  { to: '/fee-adjustment', label: '费用调整', icon: Receipt },
]

function isActive(to: string) {
  return route.path === to
}

const badgeStyle = computed(() => {
  const map: Record<string, string> = {
    sales_clerk: 'bg-blue-100 text-blue-700',
    warehouse: 'bg-green-100 text-green-700',
    after_sales: 'bg-orange-100 text-orange-700',
  }
  return map[roleStore.currentRole] ?? 'bg-gray-100 text-gray-700'
})
</script>
