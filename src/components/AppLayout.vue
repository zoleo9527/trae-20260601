<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoleStore, type RoleId } from '@/stores/role'
import {
  LayoutDashboard,
  Snowflake,
  CalendarRange,
  ClipboardCheck,
  ShieldAlert,
  ChevronDown,
  Mountain,
  Menu,
  X,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const roleStore = useRoleStore()
const mobileOpen = ref(false)

const navItems = computed(() => {
  const items = [
    { path: '/', icon: LayoutDashboard, label: '仪表盘', roles: ['rental', 'coach_supervisor', 'safety_patrol'] },
    { path: '/rentals', icon: Snowflake, label: '雪具租赁', roles: ['rental', 'coach_supervisor', 'safety_patrol'] },
    { path: '/schedule', icon: CalendarRange, label: '教练排班', roles: ['coach_supervisor', 'rental', 'safety_patrol'] },
    { path: '/checkin', icon: ClipboardCheck, label: '学员签到', roles: ['coach_supervisor', 'rental', 'safety_patrol'] },
    { path: '/rescue', icon: ShieldAlert, label: '救援记录', roles: ['safety_patrol', 'coach_supervisor', 'rental'] },
  ]
  return items.map(item => ({
    ...item,
    primary: item.roles[0] === roleStore.currentRole,
  }))
})

const roleOptions: { id: RoleId; label: string; color: string }[] = [
  { id: 'rental', label: '租赁员', color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { id: 'coach_supervisor', label: '教练主管', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  { id: 'safety_patrol', label: '安全巡逻员', color: 'bg-red-100 text-red-700 border-red-300' },
]

const currentRoleOption = computed(() => roleOptions.find(r => r.id === roleStore.currentRole)!)

const showRoleDropdown = ref(false)

function switchRole(id: RoleId) {
  roleStore.switchRole(id)
  showRoleDropdown.value = false
}

function navigate(path: string) {
  router.push(path)
  mobileOpen.value = false
}
</script>

<template>
  <div class="flex h-screen bg-slate-50">
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 text-white flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
          <Mountain class="w-5 h-5 text-white" />
        </div>
        <div>
          <div class="font-bold text-sm tracking-wide">滑雪场运营</div>
          <div class="text-[10px] text-slate-400 tracking-wider">教练课程 · 学员签到</div>
        </div>
      </div>

      <nav class="flex-1 py-4 px-3 space-y-1">
        <button
          v-for="item in navItems"
          :key="item.path"
          @click="navigate(item.path)"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            route.path === item.path
              ? item.primary
                ? 'bg-sky-500/20 text-sky-300'
                : 'bg-slate-700/60 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
          ]"
        >
          <component :is="item.icon" class="w-[18px] h-[18px]" />
          <span>{{ item.label }}</span>
          <span
            v-if="item.primary"
            class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300"
          >主要</span>
        </button>
      </nav>

      <div class="p-3 border-t border-slate-700/50">
        <div class="relative">
          <button
            @click="showRoleDropdown = !showRoleDropdown"
            class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <span :class="['w-2 h-2 rounded-full', currentRoleOption.id === 'rental' ? 'bg-sky-400' : currentRoleOption.id === 'coach_supervisor' ? 'bg-indigo-400' : 'bg-red-400']" />
            <span class="text-sm text-slate-300 flex-1 text-left">{{ currentRoleOption.label }}</span>
            <ChevronDown class="w-4 h-4 text-slate-500" />
          </button>
          <div v-if="showRoleDropdown" class="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
            <button
              v-for="opt in roleOptions"
              :key="opt.id"
              @click="switchRole(opt.id)"
              :class="[
                'w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors',
                opt.id === roleStore.currentRole ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200',
              ]"
            >
              <span :class="['w-2 h-2 rounded-full', opt.id === 'rental' ? 'bg-sky-400' : opt.id === 'coach_supervisor' ? 'bg-indigo-400' : 'bg-red-400']" />
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </aside>

    <div v-if="mobileOpen" class="fixed inset-0 z-30 bg-black/40 lg:hidden" @click="mobileOpen = false" />

    <div class="flex-1 flex flex-col min-w-0">
      <header class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-3 flex items-center gap-4 lg:px-8">
        <button class="lg:hidden p-1.5 -ml-1.5 rounded-md hover:bg-slate-100" @click="mobileOpen = !mobileOpen">
          <Menu v-if="!mobileOpen" class="w-5 h-5 text-slate-600" />
          <X v-else class="w-5 h-5 text-slate-600" />
        </button>
        <div class="flex-1">
          <h1 class="text-lg font-semibold text-slate-800">
            {{ navItems.find(i => i.path === route.path)?.label || '仪表盘' }}
          </h1>
        </div>
        <div :class="['px-3 py-1.5 rounded-full text-xs font-semibold border', currentRoleOption.color]">
          {{ currentRoleOption.label }}
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 lg:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
