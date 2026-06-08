<template>
  <div class="flex h-screen bg-bg-primary font-body">
    <aside class="w-56 bg-bg-card border-r border-border-card flex flex-col shrink-0">
      <div class="p-4 border-b border-border-card">
        <h1 class="font-heading text-2xl font-bold text-accent text-glow-green tracking-wider">
          ESPORTS
        </h1>
        <p class="text-xs text-text-secondary mt-0.5">赛事管理系统</p>
      </div>

      <nav class="flex-1 py-4">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-text-secondary transition-all duration-200 hover:text-accent hover:bg-accent/5"
          active-class="!text-accent !bg-accent/10 border-l-2 border-accent"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span class="text-sm font-medium">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-border-card">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
          <span class="text-xs text-text-secondary">系统在线</span>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-14 bg-bg-card border-b border-border-card flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center gap-4">
          <h2 class="font-heading text-lg font-semibold text-text-primary">{{ currentPageTitle }}</h2>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-xs text-text-secondary">身份:</span>
            <select
              v-model="selectedRole"
              class="select-dark text-xs !w-auto !py-1 !px-2"
            >
              <option value="网管">网管</option>
              <option value="赛事运营">赛事运营</option>
              <option value="店长">店长</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-text-secondary">姓名:</span>
            <input
              v-model="displayName"
              class="input-dark text-xs !w-24 !py-1"
              placeholder="输入姓名"
            />
          </div>
          <div class="flex items-center gap-2 bg-bg-primary px-3 py-1 rounded-full">
            <div class="w-2 h-2 rounded-full" :class="roleColorClass" />
            <span class="text-xs text-text-primary font-medium">{{ store.currentRole }}</span>
            <span class="text-xs text-text-secondary">·</span>
            <span class="text-xs text-accent">{{ store.currentName }}</span>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, ClipboardList, Monitor, Database } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { Role } from '@/types'

const store = useAppStore()
const route = useRoute()

const selectedRole = ref<Role>(store.currentRole)
const displayName = ref(store.currentName)

watch(selectedRole, (val) => store.setRole(val))
watch(displayName, (val) => store.setName(val))

const navItems = [
  { path: '/', label: '态势总览', icon: LayoutDashboard },
  { path: '/registrations', label: '赛事报名', icon: ClipboardList },
  { path: '/seats', label: '座位分配', icon: Monitor },
  { path: '/admin', label: '数据管理', icon: Database },
]

const currentPageTitle = computed(() => {
  const item = navItems.find(n => n.path === route.path)
  return item?.label ?? '赛事管理系统'
})

const roleColorClass = computed(() => {
  switch (store.currentRole) {
    case '网管': return 'bg-accent'
    case '赛事运营': return 'bg-warning'
    case '店长': return 'bg-alert'
    default: return 'bg-accent'
  }
})
</script>
