<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoleStore } from '@/stores/role'
import { useApi } from '@/composables/useApi'
import { Snowflake, Users, ClipboardCheck, ShieldAlert, AlertTriangle, Clock, Package, FileWarning } from 'lucide-vue-next'
import type { RoleId } from '@/stores/role'

const roleStore = useRoleStore()
const { get } = useApi()

interface DashboardStats {
  rentedCount: number
  activeRentals: number
  mismatchCount: number
  todayCourses: number
  pendingCourses: number
  noShowCount: number
  rescueCount: number
  missingAttachmentCount: number
}

interface AlertItem {
  type: string
  message: string
  severity: 'orange' | 'red' | 'yellow'
}

interface TodoItem {
  label: string
  count: number
  icon: any
}

const stats = ref<DashboardStats>({
  rentedCount: 0,
  activeRentals: 0,
  mismatchCount: 0,
  todayCourses: 0,
  pendingCourses: 0,
  noShowCount: 0,
  rescueCount: 0,
  missingAttachmentCount: 0,
})

const alerts = ref<AlertItem[]>([])
const loading = ref(true)

const roleColorMap: Record<RoleId, { text: string; bg: string; border: string; badge: string; gradient: string }> = {
  rental: {
    text: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    badge: 'bg-sky-500',
    gradient: 'from-sky-500 to-blue-500',
  },
  coach_supervisor: {
    text: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-purple-500',
  },
  safety_patrol: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-500',
    gradient: 'from-red-500 to-rose-500',
  },
}

const theme = computed(() => roleColorMap[roleStore.currentRole])

const statCardDefs: Record<RoleId, { key: keyof DashboardStats; label: string; icon: any; colorClass: string }[]> = {
  rental: [
    { key: 'activeRentals', label: '在租雪具', icon: Snowflake, colorClass: 'text-sky-600 bg-sky-50' },
    { key: 'rentedCount', label: '活跃租赁', icon: Package, colorClass: 'text-blue-600 bg-blue-50' },
    { key: 'mismatchCount', label: '异常标记', icon: AlertTriangle, colorClass: 'text-amber-600 bg-amber-50' },
    { key: 'todayCourses', label: '今日课程', icon: Users, colorClass: 'text-teal-600 bg-teal-50' },
  ],
  coach_supervisor: [
    { key: 'todayCourses', label: '今日课程', icon: ClipboardCheck, colorClass: 'text-indigo-600 bg-indigo-50' },
    { key: 'pendingCourses', label: '待确认课程', icon: Clock, colorClass: 'text-amber-600 bg-amber-50' },
    { key: 'noShowCount', label: '爽约学员', icon: Users, colorClass: 'text-rose-600 bg-rose-50' },
    { key: 'activeRentals', label: '活跃租赁', icon: Package, colorClass: 'text-sky-600 bg-sky-50' },
  ],
  safety_patrol: [
    { key: 'rescueCount', label: '救援记录', icon: ShieldAlert, colorClass: 'text-red-600 bg-red-50' },
    { key: 'missingAttachmentCount', label: '缺少附件', icon: FileWarning, colorClass: 'text-amber-600 bg-amber-50' },
    { key: 'mismatchCount', label: '异常雪具', icon: AlertTriangle, colorClass: 'text-orange-600 bg-orange-50' },
    { key: 'todayCourses', label: '今日课程', icon: Users, colorClass: 'text-teal-600 bg-teal-50' },
  ],
}

const statCards = computed(() =>
  statCardDefs[roleStore.currentRole].map((def) => ({
    label: def.label,
    value: stats.value[def.key],
    icon: def.icon,
    colorClass: def.colorClass,
  }))
)

const todoDefs: Record<RoleId, TodoItem[]> = {
  rental: [
    { label: '待处理异常雪具', count: 0, icon: AlertTriangle },
    { label: '待归还雪具', count: 0, icon: Package },
  ],
  coach_supervisor: [
    { label: '待确认课程', count: 0, icon: Clock },
    { label: '爽约学员待处理', count: 0, icon: Users },
  ],
  safety_patrol: [
    { label: '救援记录缺少附件', count: 0, icon: FileWarning },
    { label: '异常雪具待排查', count: 0, icon: AlertTriangle },
  ],
}

const todoItems = computed(() => {
  const role = roleStore.currentRole
  const s = stats.value
  if (role === 'rental') {
    return [
      { ...todoDefs.rental[0], count: s.mismatchCount },
      { ...todoDefs.rental[1], count: s.activeRentals },
    ]
  }
  if (role === 'coach_supervisor') {
    return [
      { ...todoDefs.coach_supervisor[0], count: s.pendingCourses },
      { ...todoDefs.coach_supervisor[1], count: s.noShowCount },
    ]
  }
  return [
    { ...todoDefs.safety_patrol[0], count: s.missingAttachmentCount },
    { ...todoDefs.safety_patrol[1], count: s.mismatchCount },
  ]
})

const hasTodos = computed(() => todoItems.value.some((t) => t.count > 0))

async function fetchData() {
  loading.value = true
  try {
    const res = await get<{ success: boolean; data: { stats: DashboardStats; alerts: AlertItem[] } }>(
      `/dashboard?role=${roleStore.currentRole}`
    )
    if (res.success) {
      stats.value = res.data.stats
      alerts.value = res.data.alerts
    }
  } catch {
    alerts.value = []
  } finally {
    loading.value = false
  }
}

watch(() => roleStore.currentRole, fetchData)
onMounted(fetchData)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">运营仪表盘</h1>
        <p class="text-sm text-slate-400 mt-1">{{ roleStore.roleName }} · 工作台</p>
      </div>
      <button
        class="btn-secondary gap-2"
        :disabled="loading"
        @click="fetchData"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 21h5v-5" />
        </svg>
        刷新
      </button>
    </div>

    <div :class="['card p-4 flex items-center gap-3 border', theme.border, theme.bg]">
      <div :class="['w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold', theme.badge]">
        <component :is="roleStore.currentRole === 'rental' ? Snowflake : roleStore.currentRole === 'coach_supervisor' ? ClipboardCheck : ShieldAlert" class="w-5 h-5" />
      </div>
      <div>
        <p :class="['text-sm font-semibold', theme.text]">{{ roleStore.roleName }}权限说明</p>
        <p class="text-xs text-slate-500 mt-0.5">{{ roleStore.roleDescription }}</p>
      </div>
    </div>

    <div v-if="loading" class="card p-12 text-center">
      <div class="inline-block w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-sm text-slate-400">正在加载数据...</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="card in statCards" :key="card.label" class="card p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">{{ card.label }}</p>
              <p class="text-3xl font-bold mt-1" :class="card.colorClass.split(' ')[0]">{{ card.value }}</p>
            </div>
            <div :class="['p-3 rounded-xl', card.colorClass.split(' ')[1]]">
              <component :is="card.icon" :class="['w-6 h-6', card.colorClass.split(' ')[0]]" />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card p-5">
          <div class="flex items-center gap-2 mb-4">
            <AlertTriangle class="w-5 h-5 text-orange-500" />
            <h3 class="text-base font-semibold">告警提示</h3>
            <span class="text-xs text-slate-400">（{{ roleStore.roleName }}视角）</span>
          </div>
          <div v-if="alerts.length === 0" class="text-sm text-slate-400 py-8 text-center">
            <ShieldAlert class="w-8 h-8 mx-auto mb-2 text-slate-300" />
            暂无告警，一切正常
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(alert, i) in alerts"
              :key="i"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm',
                alert.severity === 'red' ? 'bg-red-50 text-red-700' : alert.severity === 'yellow' ? 'bg-amber-50 text-amber-700' : 'bg-orange-50 text-orange-700',
              ]"
            >
              <AlertTriangle class="w-4 h-4 shrink-0" />
              {{ alert.message }}
            </div>
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center gap-2 mb-4">
            <Clock class="w-5 h-5 text-indigo-500" />
            <h3 class="text-base font-semibold">待办事项</h3>
          </div>
          <div v-if="!hasTodos" class="text-sm text-slate-400 py-8 text-center">
            <ClipboardCheck class="w-8 h-8 mx-auto mb-2 text-slate-300" />
            暂无待办事项
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(todo, i) in todoItems"
              :key="i"
              class="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 text-sm"
            >
              <div class="flex items-center gap-3">
                <component :is="todo.icon" class="w-4 h-4 text-slate-400" />
                <span class="text-slate-700">{{ todo.label }}</span>
              </div>
              <span v-if="todo.count > 0" :class="['inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold text-white', theme.badge]">
                {{ todo.count }}
              </span>
              <span v-else class="text-xs text-slate-400">无</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
