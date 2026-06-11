<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LayoutDashboard, FileText, PenLine, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '总览' },
  { path: '/documents', icon: FileText, label: '竣工资料' },
  { path: '/sign-off', icon: PenLine, label: '客户签认' },
]
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#0f172a]">
    <aside
      class="flex flex-col border-r border-[#334155] bg-[#1e293b] transition-all duration-300"
      :class="collapsed ? 'w-16' : 'w-52'"
    >
      <div class="flex items-center gap-2 px-4 h-14 border-b border-[#334155]">
        <div class="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
          <FileText :size="16" class="text-slate-900" />
        </div>
        <span v-if="!collapsed" class="text-sm font-bold text-white whitespace-nowrap">竣工签认</span>
      </div>

      <nav class="flex-1 py-3 space-y-1 px-2">
        <button
          v-for="item in navItems"
          :key="item.path"
          @click="router.push(item.path)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150"
          :class="route.path === item.path
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'"
        >
          <component :is="item.icon" :size="20" class="flex-shrink-0" />
          <span v-if="!collapsed" class="text-sm">{{ item.label }}</span>
        </button>
      </nav>

      <button
        @click="collapsed = !collapsed"
        class="flex items-center justify-center h-10 border-t border-[#334155] text-slate-500 hover:text-white transition-colors"
      >
        <component :is="collapsed ? ChevronRight : ChevronLeft" :size="16" />
      </button>
    </aside>

    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>
