<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, ShieldCheck, AlertTriangle, Truck, Factory } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staff'
import type { RoleType } from '@/types'

const route = useRoute()
const router = useRouter()
const staffStore = useStaffStore()

const navItems = [
  { name: '首页仪表盘', icon: LayoutDashboard, path: '/' },
  { name: '质检放行', icon: ShieldCheck, path: '/qc' },
  { name: '异常提醒', icon: AlertTriangle, path: '/exceptions' },
  { name: '客户回寄', icon: Truck, path: '/shipping' },
]

const roles: { key: RoleType; label: string }[] = [
  { key: 'cs', label: '接单客服' },
  { key: 'designer', label: '数字设计师' },
  { key: 'qc', label: '质检员' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-factory-surface border-r border-factory-border">
    <div class="flex items-center gap-2 px-5 py-5 border-b border-factory-border">
      <Factory :size="22" class="text-warn-orange" />
      <h1 class="text-base font-bold text-white tracking-wide">义齿质检放行</h1>
    </div>

    <nav class="mt-2 flex-1 space-y-1 px-3">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
        :class="isActive(item.path)
          ? 'bg-factory-surface-light text-warn-orange border-l-[3px] border-warn-orange'
          : 'text-gray-400 hover:bg-factory-surface-light hover:text-gray-200 border-l-[3px] border-transparent'"
        @click="router.push(item.path)"
      >
        <component :is="item.icon" :size="18" />
        <span>{{ item.name }}</span>
      </button>
    </nav>

    <div class="border-t border-factory-border px-4 py-4">
      <p class="mb-2 text-xs text-gray-500 uppercase tracking-wider">当前角色</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="role in roles"
          :key="role.key"
          class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          :class="staffStore.currentRole === role.key
            ? 'bg-warn-orange text-white'
            : 'bg-factory-surface-light text-gray-400 hover:text-gray-200'"
          @click="staffStore.switchRole(role.key)"
        >
          {{ role.label }}
        </button>
      </div>
    </div>
  </aside>
</template>
