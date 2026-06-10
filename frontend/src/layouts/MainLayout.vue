<script setup lang="ts">
import {
  LayoutDashboard,
  Wrench,
  DollarSign,
  History,
  FolderOpen,
  User,
} from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import RoleSwitcher from '@/components/RoleSwitcher.vue'
import { useUserStore } from '@/stores/user'
import { ROLE_LABEL } from '@/types/enums'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/replacements', label: '备件更换处理', icon: Wrench },
  { path: '/cost-review', label: '费用确认回看', icon: DollarSign },
  { path: '/history', label: '操作历史', icon: History },
  { path: '/background', label: '背景资料', icon: FolderOpen },
]

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const handleNavigate = (path: string) => {
  router.push(path)
}

const handleRoleChange = (role: 'technician' | 'customer_service' | 'supervisor') => {
  userStore.setRole(role)
}

const currentRole = computed(() => userStore.currentUser?.role || 'technician')
const currentUserName = computed(() => userStore.currentUser?.name || '未登录')
</script>

<template>
  <div class="flex flex-col h-screen">
    <header class="h-14 flex items-center justify-between px-6 text-white flex-shrink-0" style="background-color: var(--primary);">
      <div class="text-lg font-bold tracking-wide">电梯维保管理系统</div>
      <div class="flex items-center gap-4">
        <RoleSwitcher :current-role="currentRole" @change="handleRoleChange" />
        <div class="flex items-center gap-2 text-sm">
          <User class="w-4 h-4" />
          <span>{{ currentUserName }}</span>
          <span class="text-white/70">({{ ROLE_LABEL[currentRole] }})</span>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside class="w-56 bg-gray-100 border-r border-gray-200 flex-shrink-0 overflow-y-auto">
        <nav class="py-2">
          <button
            v-for="item in menuItems"
            :key="item.path"
            type="button"
            @click="handleNavigate(item.path)"
            :class="[
              'w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors text-left',
              isActive(item.path)
                ? 'text-white'
                : 'text-gray-700 hover:bg-gray-200'
            ]"
            :style="isActive(item.path) ? { backgroundColor: 'var(--primary)' } : {}"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <main class="flex-1 overflow-auto p-6" style="background-color: #f7fafc;">
        <router-view />
      </main>
    </div>
  </div>
</template>
