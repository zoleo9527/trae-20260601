<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white mb-1">工作台</h1>
      <p class="text-slate-400 text-sm">{{ authStore.roleName }} · {{ authStore.user?.name }}</p>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6">
      <div v-for="card in roleStatCards" :key="card.label" class="card">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="card.iconBg">
            <component :is="card.icon" class="w-5 h-5" :class="card.iconColor" />
          </div>
          <div>
            <p class="text-xs text-slate-400">{{ card.label }}</p>
            <p class="text-2xl font-bold text-white tabular-nums">{{ card.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-6">
      <h3 class="text-sm font-semibold text-slate-300 mb-4">快捷操作</h3>
      <div class="grid grid-cols-3 gap-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          class="flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 group"
          :class="action.cardClass"
        >
          <component :is="action.icon" class="w-5 h-5 shrink-0" :class="action.iconColor" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white">{{ action.label }}</p>
            <p class="text-xs text-slate-400 truncate">{{ action.description }}</p>
          </div>
          <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
        </NuxtLink>
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
          class="flex items-start gap-4 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200 group"
        >
          <div class="w-2 h-2 rounded-full shrink-0 mt-1.5"
               :class="todo.type === 'risk' || todo.type === 'risk_resubmit' ? 'bg-orange-400' : 'bg-sky-400'"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <p class="text-sm font-medium text-white truncate">{{ todo.title }}</p>
            </div>
            <p v-if="todo.type === 'risk' && todo.description" class="text-xs text-slate-400 truncate mb-1">{{ todo.description }}</p>
            <p v-if="todo.type === 'risk_resubmit' && todo.rejectReason" class="text-xs text-red-400/70 truncate mb-1">
              退回原因：{{ todo.rejectReason }}
            </p>
            <p v-if="todo.type === 'risk' && todo.supplementNote" class="text-xs text-purple-400/70 truncate mb-1">
              补充：{{ todo.supplementNote }}
            </p>
            <p class="text-xs text-slate-500">{{ todo.createdAt }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0 pt-0.5">
            <span v-if="todo.urgency && todo.urgency !== 'normal'" class="badge"
                  :class="urgencyBadgeClass(todo.urgency)">{{ urgencyLabel(todo.urgency) }}</span>
            <span v-if="todo.level" class="badge"
                  :class="levelBadgeClass(todo.level)">{{ levelLabel(todo.level) }}</span>
            <span :class="statusBadgeClass(todo.status)">{{ statusLabel(todo.status) }}</span>
          </div>
          <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0 mt-1" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Shield, AlertTriangle, CheckCircle2, ChevronRight, PlusCircle, ClipboardCheck, MessageSquareOff, FileWarning, SendHorizonal } from 'lucide-vue-next'

const authStore = useAuthStore()

const todos = ref<any[]>([])

const role = computed(() => authStore.user?.role || '')

const patrolTodos = computed(() => todos.value.filter((t: any) => t.type === 'patrol'))
const riskTodos = computed(() => todos.value.filter((t: any) => t.type === 'risk'))
const resubmitTodos = computed(() => todos.value.filter((t: any) => t.type === 'risk_resubmit'))

const roleStatCards = computed(() => {
  if (role.value === 'rental') {
    return [
      { label: '待巡查', value: patrolTodos.value.length, icon: Shield, iconBg: 'bg-sky-500/20', iconColor: 'text-sky-400' },
      { label: '待审批风险', value: riskTodos.value.length, icon: AlertTriangle, iconBg: 'bg-orange-500/20', iconColor: 'text-orange-400' },
      { label: '今日已完成', value: completedToday.value, icon: CheckCircle2, iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400' },
    ]
  } else if (role.value === 'coach') {
    return [
      { label: '待审批', value: riskTodos.value.length, icon: AlertTriangle, iconBg: 'bg-orange-500/20', iconColor: 'text-orange-400' },
      { label: '其中紧急', value: riskTodos.value.filter((t: any) => t.urgency === 'urgent' || t.urgency === 'immediate').length, icon: FileWarning, iconBg: 'bg-red-500/20', iconColor: 'text-red-400' },
      { label: '今日已审批', value: completedToday.value, icon: CheckCircle2, iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400' },
    ]
  } else {
    return [
      { label: '待巡查', value: patrolTodos.value.length, icon: Shield, iconBg: 'bg-sky-500/20', iconColor: 'text-sky-400' },
      { label: '待补充', value: resubmitTodos.value.length, icon: MessageSquareOff, iconBg: 'bg-red-500/20', iconColor: 'text-red-400' },
      { label: '今日已完成', value: completedToday.value, icon: CheckCircle2, iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400' },
    ]
  }
})

const completedToday = ref(0)

const quickActions = computed(() => {
  if (role.value === 'rental') {
    return [
      { to: '/patrols/new', label: '创建巡查单', description: '为雪道创建新的巡查任务', icon: PlusCircle, iconColor: 'text-sky-400', cardClass: 'bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10' },
      { to: '/patrols', label: '巡查管理', description: '查看所有巡查记录', icon: ClipboardCheck, iconColor: 'text-emerald-400', cardClass: 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10' },
      { to: '/risks', label: '风险记录', description: '查看所有风险上报', icon: AlertTriangle, iconColor: 'text-orange-400', cardClass: 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/10' },
    ]
  } else if (role.value === 'coach') {
    return [
      { to: '/risks', label: '风险审批', description: '审批待处理的风险上报', icon: AlertTriangle, iconColor: 'text-orange-400', cardClass: 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/10' },
      { to: '/patrols', label: '巡查记录', description: '查看巡查执行情况', icon: ClipboardCheck, iconColor: 'text-sky-400', cardClass: 'bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10' },
      { to: '/settings', label: '系统管理', description: '数据重置与账号管理', icon: CheckCircle2, iconColor: 'text-slate-400', cardClass: 'bg-slate-500/5 border-slate-500/20 hover:border-slate-500/50 hover:bg-slate-500/10' },
    ]
  } else {
    return [
      { to: '/patrols', label: '执行巡查', description: '查看并执行巡查任务', icon: Shield, iconColor: 'text-sky-400', cardClass: 'bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10' },
      { to: '/risks', label: '风险上报', description: '上报雪道风险问题', icon: AlertTriangle, iconColor: 'text-orange-400', cardClass: 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/10' },
      { to: '/risks', label: '补充备注', description: '处理被退回的风险上报', icon: SendHorizonal, iconColor: 'text-purple-400', cardClass: 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10' },
    ]
  }
})

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
    const today = new Date().toISOString().split('T')[0]
    completedToday.value = patrolArr.filter((p: any) =>
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

function urgencyLabel(u: string) {
  const map: Record<string, string> = { urgent: '紧急', immediate: '立即' }
  return map[u] || u
}

function urgencyBadgeClass(u: string) {
  const map: Record<string, string> = { urgent: 'bg-amber-500/20 text-amber-400', immediate: 'bg-red-500/20 text-red-400' }
  return map[u] || ''
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
