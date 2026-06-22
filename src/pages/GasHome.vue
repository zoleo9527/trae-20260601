<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Gauge,
  Users,
  ClipboardCheck,
  AlertCircle,
  Flame,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { GasApplication, CustomerVisit, HiddenDanger, SafetyCheck } from '@/types/gas'

const router = useRouter()

const stats = ref({
  pendingApplications: 0,
  pendingVisits: 0,
  pendingDangers: 0,
  todayChecks: 0
})

const recentApplications = ref<GasApplication[]>([])
const recentVisits = ref<CustomerVisit[]>([])
const loading = ref(true)

const quickActions = [
  { label: '停复气申请', icon: Gauge, path: '/gas/applications', color: 'bg-blue-500' },
  { label: '客户回访', icon: Users, path: '/gas/visits', color: 'bg-green-500' },
  { label: '安检记录', icon: ClipboardCheck, path: '/gas/safety-checks', color: 'bg-purple-500' },
  { label: '隐患通知', icon: AlertCircle, path: '/gas/hidden-dangers', color: 'bg-orange-500' },
  { label: '换表记录', icon: Flame, path: '/gas/meter-changes', color: 'bg-red-500' },
]

const getApplicationTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    stop: '停气',
    resume: '复气',
    temporary_stop: '临时停气'
  }
  return labels[type] || type
}

const getApplicationStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    executing: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labels[status] || status
}

const getVisitTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    pre_visit: '事前回访',
    post_visit: '事后回访',
    follow_up: '跟踪回访'
  }
  return labels[type] || type
}

const getVisitStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待回访',
    completed: '已完成',
    failed: '回访失败',
    pending_verify: '待验证'
  }
  return labels[status] || status
}

const getDangerLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    critical: '严重',
    major: '较大',
    minor: '一般'
  }
  return labels[level] || level
}

async function fetchData() {
  loading.value = true
  try {
    const [appsRes, visitsRes, dangersRes, checksRes] = await Promise.all([
      gasApi.getApplications({ status: 'pending' }),
      gasApi.getVisits({ status: 'pending' }),
      gasApi.getHiddenDangers({ status: 'pending' }),
      gasApi.getSafetyChecks()
    ])

    if (appsRes.success) {
      stats.value.pendingApplications = appsRes.data.length
      recentApplications.value = appsRes.data.slice(0, 5)
    }

    if (visitsRes.success) {
      stats.value.pendingVisits = visitsRes.data.length
      recentVisits.value = visitsRes.data.slice(0, 5)
    }

    if (dangersRes.success) {
      stats.value.pendingDangers = dangersRes.data.length
    }

    if (checksRes.success) {
      const today = new Date().toISOString().split('T')[0]
      stats.value.todayChecks = checksRes.data.filter((c: SafetyCheck) => c.check_date === today).length
    }
  } catch (err) {
    console.error('获取数据失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">燃气维保工作台</h1>
        <p class="text-slate-500 mt-1">实时监控停复气申请与客户回访状态</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="bg-white rounded-2xl border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Clock class="w-6 h-6 text-blue-600" />
          </div>
          <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">待审核</span>
        </div>
        <div class="text-3xl font-bold text-slate-900 mb-1">{{ loading ? '--' : stats.pendingApplications }}</div>
        <div class="text-sm text-slate-500">停复气申请</div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Users class="w-6 h-6 text-green-600" />
          </div>
          <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">待回访</span>
        </div>
        <div class="text-3xl font-bold text-slate-900 mb-1">{{ loading ? '--' : stats.pendingVisits }}</div>
        <div class="text-sm text-slate-500">客户回访任务</div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-orange-600" />
          </div>
          <span class="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">待处理</span>
        </div>
        <div class="text-3xl font-bold text-slate-900 mb-1">{{ loading ? '--' : stats.pendingDangers }}</div>
        <div class="text-sm text-slate-500">安全隐患</div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Activity class="w-6 h-6 text-purple-600" />
          </div>
          <span class="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">今日</span>
        </div>
        <div class="text-3xl font-bold text-slate-900 mb-1">{{ loading ? '--' : stats.todayChecks }}</div>
        <div class="text-sm text-slate-500">安检记录</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900">快捷入口</h2>
          </div>
          <div class="space-y-2">
            <button
              v-for="action in quickActions"
              :key="action.label"
              @click="router.push(action.path)"
              class="w-full flex items-center gap-3 p-3 rounded-xl text-white transition-colors hover:opacity-90"
              :class="action.color"
            >
              <component :is="action.icon" class="w-5 h-5" />
              <span class="font-medium flex-1 text-left">{{ action.label }}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-slate-900">待审核申请</h2>
              <button @click="router.push('/gas/applications')" class="text-sm text-blue-600 hover:text-blue-700">
                查看全部
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="app in recentApplications"
                :key="app.id"
                @click="router.push(`/gas/applications/${app.id}`)"
                class="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-slate-900">{{ app.customer_name }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    {{ getApplicationTypeLabel(app.application_type) }}
                  </span>
                </div>
                <div class="text-xs text-slate-500">{{ app.address }}</div>
                <div class="text-xs text-slate-400 mt-1">{{ app.planned_date }}</div>
              </div>
              <div v-if="recentApplications.length === 0" class="text-center py-8 text-slate-400">
                <CheckCircle class="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>暂无待审核申请</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-slate-900">待回访任务</h2>
              <button @click="router.push('/gas/visits')" class="text-sm text-blue-600 hover:text-blue-700">
                查看全部
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="visit in recentVisits"
                :key="visit.id"
                @click="router.push(`/gas/visits/${visit.id}`)"
                class="p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-colors"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-slate-900">{{ visit.customer_name }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    {{ getVisitTypeLabel(visit.visit_type) }}
                  </span>
                </div>
                <div class="text-xs text-slate-500">{{ visit.purpose }}</div>
                <div class="text-xs text-slate-400 mt-1">{{ visit.scheduled_date }}</div>
              </div>
              <div v-if="recentVisits.length === 0" class="text-center py-8 text-slate-400">
                <CheckCircle class="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>暂无待回访任务</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
