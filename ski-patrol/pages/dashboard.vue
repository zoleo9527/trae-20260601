<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white mb-1">工作台</h1>
      <p class="text-slate-400 text-sm">{{ authStore.roleName }} · {{ authStore.user?.name }}</p>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="card">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
            <Shield class="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <p class="text-xs text-slate-400">待处理巡查</p>
            <p class="text-2xl font-bold text-white tabular-nums">{{ stats.pendingPatrols }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p class="text-xs text-slate-400">待处理风险</p>
            <p class="text-2xl font-bold text-white tabular-nums">{{ stats.pendingRisks }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 class="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p class="text-xs text-slate-400">已完成今日</p>
            <p class="text-2xl font-bold text-white tabular-nums">{{ stats.completedToday }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">待办事项</h2>
        <span class="badge-progress">{{ todos.length }} 项</span>
      </div>

      <div v-if="todos.length === 0" class="text-center py-12">
        <CheckCircle2 class="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
        <p class="text-slate-400">暂无待办事项</p>
      </div>

      <div v-else class="space-y-2">
        <NuxtLink
          v-for="todo in todos"
          :key="todo.id"
          :to="todoLink(todo)"
          class="flex items-center gap-4 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200 group"
        >
          <div class="w-2 h-2 rounded-full shrink-0"
               :class="todo.type === 'risk' || todo.type === 'risk_resubmit' ? 'bg-orange-400' : 'bg-sky-400'"></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ todo.title }}</p>
            <p class="text-xs text-slate-400">{{ todo.createdAt }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="todo.level" class="badge"
                  :class="levelBadgeClass(todo.level)">{{ levelLabel(todo.level) }}</span>
            <span :class="statusBadgeClass(todo.status)">{{ statusLabel(todo.status) }}</span>
          </div>
          <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Shield, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-vue-next'

const authStore = useAuthStore()

const todos = ref<any[]>([])
const stats = ref({ pendingPatrols: 0, pendingRisks: 0, completedToday: 0 })

async function loadData() {
  try {
    const [todoData, patrols, risks] = await Promise.all([
      $fetch('/api/todos'),
      $fetch('/api/patrols'),
      $fetch('/api/risks'),
    ]) as any[]

    todos.value = todoData

    const patrolArr = patrols || []
    const riskArr = risks || []

    stats.value.pendingPatrols = patrolArr.filter((p: any) => p.status === 'pending' || p.status === 'in_progress').length
    stats.value.pendingRisks = riskArr.filter((r: any) => r.status === 'reported' || r.status === 'rejected' || r.status === 'resubmitted').length

    const today = new Date().toISOString().split('T')[0]
    stats.value.completedToday = patrolArr.filter((p: any) =>
      p.status === 'completed' && p.completedAt && p.completedAt.startsWith(today)
    ).length + riskArr.filter((r: any) =>
      r.status === 'approved' && r.resolvedAt && r.resolvedAt.startsWith(today)
    ).length
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

function todoLink(todo: any) {
  if (todo.type === 'patrol') return `/patrols/${todo.entityId}`
  if (todo.type === 'risk' || todo.type === 'risk_resubmit') return `/risks/${todo.entityId}`
  return '/dashboard'
}

function levelLabel(level: string) {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
  return map[level] || level
}

function levelBadgeClass(level: string) {
  const map: Record<string, string> = {
    low: 'bg-sky-500/20 text-sky-400',
    medium: 'bg-amber-500/20 text-amber-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400',
  }
  return map[level] || ''
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待巡查', in_progress: '进行中', completed: '已完成', archived: '已归档',
    reported: '已上报', approved: '已审批', rejected: '已退回', resubmitted: '已重提',
  }
  return map[status] || status
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    pending: 'badge-pending', in_progress: 'badge-progress', completed: 'badge-completed', archived: 'badge-archived',
    reported: 'badge-reported', approved: 'badge-approved', rejected: 'badge-rejected', resubmitted: 'badge-resubmitted',
  }
  return map[status] || 'badge'
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    navigateTo('/login')
    return
  }
  loadData()
})
</script>
