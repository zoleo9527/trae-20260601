<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ClipboardList,
  XCircle,
  Wrench,
  CheckCircle2,
  Plus,
  ListTodo,
  FileText,
  AlertTriangle,
  Briefcase,
  HardHat,
  Wrench as WrenchIcon
} from 'lucide-vue-next'
import { useRole } from '@/stores/role'
import type { Role, OperationLog } from '../../../api/types'
import Timeline from '@/components/Timeline.vue'

const router = useRouter()
const { currentRole, roleName } = useRole()

interface StatsData {
  pendingTests: number
  failedTests: number
  pendingIssues: number
  pendingVerifyIssues: number
  recentActivities: OperationLog[]
}

const stats = ref<StatsData>({
  pendingTests: 0,
  failedTests: 0,
  pendingIssues: 0,
  pendingVerifyIssues: 0,
  recentActivities: []
})
const loading = ref(false)

const statCards = [
  {
    key: 'pendingTests',
    label: '待执行测试',
    icon: ClipboardList,
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    path: '/tests'
  },
  {
    key: 'failedTests',
    label: '未通过测试',
    icon: XCircle,
    gradient: 'from-red-500 to-red-600',
    bgGradient: 'from-red-50 to-red-100',
    path: '/tests'
  },
  {
    key: 'pendingIssues',
    label: '待整改问题',
    icon: Wrench,
    gradient: 'from-amber-500 to-amber-600',
    bgGradient: 'from-amber-50 to-amber-100',
    path: '/issues'
  },
  {
    key: 'pendingVerifyIssues',
    label: '待验证问题',
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100',
    path: '/issues'
  }
]

const quickActions = [
  {
    label: '新建联调测试',
    icon: Plus,
    path: '/tests/new',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    label: '查看问题整改列表',
    icon: ListTodo,
    path: '/issues',
    gradient: 'from-amber-500 to-amber-600'
  },
  {
    label: '测试管理',
    icon: FileText,
    path: '/tests',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    label: '问题管理',
    icon: AlertTriangle,
    path: '/issues',
    gradient: 'from-rose-500 to-rose-600'
  }
]

const getRoleIcon = (role: Role | null) => {
  if (!role) return Briefcase
  const icons: Record<Role, any> = {
    pm: Briefcase,
    captain: HardHat,
    engineer: WrenchIcon
  }
  return icons[role] || Briefcase
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

async function fetchStats() {
  loading.value = true
  try {
    const res = await fetch('/api/stats')
    const data = await res.json()
    if (data.success) {
      stats.value = data.data
    }
  } catch (err) {
    console.error('获取统计数据失败:', err)
  } finally {
    loading.value = false
  }
}

const getStatValue = (key: string) => {
  return (stats.value as any)[key] || 0
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
          <component :is="getRoleIcon(currentRole)" class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">
            {{ getGreeting() }}，{{ roleName }}
          </h1>
          <p class="text-slate-500 mt-1">欢迎回到工作台，今天也要加油哦！</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        v-for="card in statCards"
        :key="card.key"
        @click="router.push(card.path)"
        class="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer"
      >
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md"
            :class="card.gradient"
          >
            <component :is="card.icon" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="text-3xl font-bold text-slate-900 mb-1">
          {{ loading ? '--' : getStatValue(card.key) }}
        </div>
        <div class="text-sm text-slate-500">{{ card.label }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">快捷入口</h2>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="action in quickActions"
            :key="action.label"
            @click="router.push(action.path)"
            class="group flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform"
              :class="action.gradient"
            >
              <component :is="action.icon" class="w-5 h-5 text-white" />
            </div>
            <span class="text-sm font-medium text-slate-700">{{ action.label }}</span>
          </button>
        </div>
      </div>

      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">近期动态</h2>
        <Timeline :logs="stats.recentActivities" />
      </div>
    </div>
  </div>
</template>
              @click="router.push(action.path)"
              class="w-full flex items-center gap-3 p-4 rounded-xl text-white transition-colors"
              :class="action.color"
            >
              <component :is="action.icon" class="w-5 h-5" />
              <span class="font-medium">{{ action.label }}</span>
              <ArrowRight class="w-4 h-4 ml-auto opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
