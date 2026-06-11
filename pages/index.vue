<template>
  <div class="space-y-6">
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(card, idx) in statCards"
        :key="idx"
        class="card p-5 hover:shadow-card-hover transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-neutral-500 uppercase tracking-wide">{{ card.label }}</p>
            <p class="mt-2 text-2xl font-bold text-neutral-800">{{ card.value }}</p>
            <p v-if="card.subtext" class="mt-1 text-xs" :class="card.subtextClass">{{ card.subtext }}</p>
          </div>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center"
            :class="card.iconBg"
          >
            <AppIcon :name="card.icon" :class="['w-5 h-5', card.iconColor]" />
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card overflow-hidden">
        <div class="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-neutral-800">我的待办</h2>
            <p class="text-xs text-neutral-500 mt-0.5">按优先级排序，共 {{ appStore.todos.length }} 项</p>
          </div>
          <button class="btn-ghost text-xs" @click="router.push('/rectification')">
            全部查看
            <AppIcon name="IconChevronRight" class="w-4 h-4 ml-0.5" />
          </button>
        </div>
        <div class="divide-y divide-neutral-100 max-h-[420px] overflow-y-auto scrollbar-thin">
          <div
            v-for="todo in appStore.todos"
            :key="todo.id"
            class="px-5 py-4 hover:bg-neutral-50 transition-colors cursor-pointer group"
            @click="handleTodoClick(todo)"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="todoIconStyle(todo.priority).bg"
              >
                <AppIcon
                  :name="todoTypeIcon(todo.type)"
                  :class="['w-4 h-4', todoIconStyle(todo.priority).color]"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start gap-2">
                  <h3 class="text-sm font-medium text-neutral-800 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {{ todo.title }}
                  </h3>
                  <StatusBadge type="priority" :status="todo.priority" />
                </div>
                <p class="text-xs text-neutral-600 mt-1 line-clamp-2">{{ todo.description }}</p>
                <div class="flex items-center gap-4 mt-2 flex-wrap">
                  <span class="text-[11px] text-neutral-500 flex items-center gap-1">
                    <AppIcon name="IconCalendar" class="w-3 h-3" />
                    截止：{{ todo.deadline }}
                  </span>
                  <span v-if="todo.assignedBy" class="text-[11px] text-neutral-500 flex items-center gap-1">
                    <AppIcon name="IconUser" class="w-3 h-3" />
                    {{ todo.assignedBy }}派单
                  </span>
                  <span class="text-[11px] text-neutral-500 flex items-center gap-1">
                    <AppIcon name="IconClock" class="w-3 h-3" />
                    {{ daysLeft(todo.deadline) }}
                  </span>
                </div>
              </div>
              <AppIcon name="IconChevronRight" class="w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold text-neutral-800">异常提醒</h2>
              <p class="text-xs text-danger-600 mt-0.5">未读 {{ appStore.unreadCount }} 条紧急事项</p>
            </div>
            <button class="btn-ghost text-xs" @click="appStore.toggleAlertPanel()">
              <AppIcon name="IconBell" class="w-4 h-4 mr-1" />
              查看
            </button>
          </div>
          <div class="divide-y divide-neutral-100 max-h-[220px] overflow-y-auto scrollbar-thin">
            <div
              v-for="alert in unreadAlertsPreview"
              :key="alert.id"
              class="px-5 py-3 hover:bg-neutral-50 cursor-pointer"
              :class="{ 'bg-red-50': alert.priority === 'critical' }"
              @click="handleAlertClick(alert)"
            >
              <div class="flex items-start gap-3">
                <AppIcon
                  :name="alert.priority === 'critical' ? 'IconAlertTriangle' : 'IconInfo'"
                  :class="['w-4 h-4 flex-shrink-0 mt-0.5', alert.priority === 'critical' ? 'text-danger-500' : 'text-warning-500']"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-neutral-800 line-clamp-1">{{ alert.title }}</p>
                  <p class="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{{ alert.message }}</p>
                </div>
              </div>
            </div>
            <div v-if="unreadAlertsPreview.length === 0" class="p-6 text-center">
              <AppIcon name="IconCheckCircle" class="w-8 h-8 mx-auto text-success-400" />
              <p class="text-xs text-neutral-500 mt-2">暂无未读异常</p>
            </div>
          </div>
        </div>

        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-neutral-200">
            <h2 class="text-sm font-semibold text-neutral-800">最近完成</h2>
            <p class="text-xs text-neutral-500 mt-0.5">近7日已闭环</p>
          </div>
          <div class="divide-y divide-neutral-100 max-h-[200px] overflow-y-auto scrollbar-thin">
            <div
              v-for="item in recentlyCompleted"
              :key="item.id"
              class="px-5 py-3 hover:bg-neutral-50 cursor-pointer"
              @click="handleCompletedClick(item)"
            >
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                  <AppIcon name="IconCheck" class="w-3.5 h-3.5 text-success-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-neutral-800 line-clamp-1">{{ item.title }}</p>
                  <p class="text-[11px] text-neutral-500 mt-0.5">{{ item.subtitle }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-neutral-200">
            <h2 class="text-sm font-semibold text-neutral-800">快捷入口</h2>
          </div>
          <div class="p-4 grid grid-cols-2 gap-3">
            <button
              v-for="quick in quickActions"
              :key="quick.label"
              type="button"
              class="flex flex-col items-center gap-2 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-blue-50 transition-all text-center"
              @click="router.push(quick.to)"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center"
                :class="quick.iconBg"
              >
                <AppIcon :name="quick.icon" :class="['w-4 h-4', quick.iconColor]" />
              </div>
              <span class="text-[11px] font-medium text-neutral-700">{{ quick.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '~/stores/app'
import type { TodoItem, Alert, PriorityLevel, UserRole } from '~/types'

const router = useRouter()
const appStore = useAppStore()

const statConfig: Record<UserRole, any[]> = {
  technician: [
    { label: '待整改任务', value: 's:stats:pendingRectification', icon: 'IconWrench', iconBg: 'bg-warning-100', iconColor: 'text-warning-600', subtext: '今日需完成2项', subtextClass: 'text-warning-600' },
    { label: '本月年检', value: 's:stats:completedThisMonth', icon: 'IconClipboard', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', subtext: '按时完成率 100%', subtextClass: 'text-success-600' },
    { label: '负责电梯', value: 's:stats:totalElevators', icon: 'IconDashboard', iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600', subtext: '本月新增 0 台', subtextClass: 'text-neutral-500' },
    { label: '异常预警', value: 'g:unreadCount', icon: 'IconAlertTriangle', iconBg: 'bg-danger-100', iconColor: 'text-danger-600', subtext: '需及时处理', subtextClass: 'text-danger-600' }
  ],
  customer_service: [
    { label: '待审核年检', value: 's:stats:underReview', icon: 'IconClipboard', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', subtext: '今日需完成核查', subtextClass: 'text-primary-600' },
    { label: '整改跟进中', value: 's:stats:rectificationInProgress', icon: 'IconWrench', iconBg: 'bg-warning-100', iconColor: 'text-warning-600', subtext: '需同步甲方进度', subtextClass: 'text-warning-600' },
    { label: '本周跟进', value: 's:stats:followUpsThisWeek', icon: 'IconMessage', iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600', subtext: '较上周 +3 次', subtextClass: 'text-success-600' },
    { label: '待发通知', value: 's:stats:pendingNotification', icon: 'IconBell', iconBg: 'bg-danger-100', iconColor: 'text-danger-600', subtext: '2条期限临近', subtextClass: 'text-danger-600' }
  ],
  project_manager: [
    { label: '待审核报告', value: 's:stats:toReview', icon: 'IconFileText', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', subtext: '含1份合格待签', subtextClass: 'text-primary-600' },
    { label: '待现场复查', value: 's:stats:toRecheck', icon: 'IconEye', iconBg: 'bg-warning-100', iconColor: 'text-warning-600', subtext: '其中1项今日到期', subtextClass: 'text-danger-600' },
    { label: '待签署闭环', value: 's:stats:toSignLoop', icon: 'IconCheckCircle', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', subtext: '复查通过待主管签署', subtextClass: 'text-primary-600' },
    { label: '未闭环整改', value: 's:stats:nonClosedRectifications', icon: 'IconAlertTriangle', iconBg: 'bg-danger-100', iconColor: 'text-danger-600', subtext: '含1项关键项', subtextClass: 'text-danger-600' }
  ]
}

const statCards = computed(() => {
  const stats: any = appStore.statsByRole
  return statConfig[appStore.currentRole].map(cfg => {
    let val: any
    if (cfg.value.startsWith('s:stats:')) {
      val = stats[cfg.value.slice(8)]
    } else if (cfg.value.startsWith('g:')) {
      val = (appStore as any)[cfg.value.slice(2)]
    }
    if (cfg.isPercent && typeof val === 'number') val = val + '%'
    return { ...cfg, value: val ?? cfg.value }
  })
})

const unreadAlertsPreview = computed<Alert[]>(() =>
  appStore.alerts.filter(a => !a.isRead).slice(0, 4)
)

const recentlyCompleted = computed(() => {
  const role = appStore.currentRole
  if (role === 'technician') {
    return [
      { id: 'c1', title: '1号楼A座-2号梯 机房温度整改', subtitle: '6月11日 · 复查通过', type: 'rectification', relatedId: 'RECT-2026-0012' },
      { id: 'c2', title: 'CBD中心-T3客梯 年检', subtitle: '5月29日 · 合格通过', type: 'inspection', relatedId: 'INSP-2026-0008' },
      { id: 'c3', title: 'B区5号楼货梯 门机检修', subtitle: '6月8日 · 完成保养', type: 'other', relatedId: '' }
    ]
  }
  if (role === 'customer_service') {
    return [
      { id: 'c1', title: '1号楼A座-2号梯 空调整改同步', subtitle: '6月11日 · 物业已签收', type: 'rectification', relatedId: 'RECT-2026-0012' },
      { id: 'c2', title: 'CBD-T3年检合格通知', subtitle: '5月29日 · 邮件+微信送达', type: 'inspection', relatedId: 'INSP-2026-0008' },
      { id: 'c3', title: '5月维保记录归档', subtitle: '6月2日 · 共32份齐全', type: 'other', relatedId: '' }
    ]
  }
  return [
    { id: 'c1', title: '1号楼A座-2号梯 整改闭环审批', subtitle: '6月11日 · 王主管签署', type: 'rectification', relatedId: 'RECT-2026-0012' },
    { id: 'c2', title: 'CBD中心-T3客梯 年检合格签署', subtitle: '5月29日 · 审核通过', type: 'inspection', relatedId: 'INSP-2026-0008' },
    { id: 'c3', title: '5月整改报告复盘', subtitle: '6月3日 · 复盘会议完成', type: 'other', relatedId: '' }
  ]
})

const quickActions = computed(() => {
  const role = appStore.currentRole
  if (role === 'technician') {
    return [
      { label: '提交年检', to: '/inspection/new', icon: 'IconPlus', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
      { label: '整改任务', to: '/rectification', icon: 'IconWrench', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
      { label: '年检记录', to: '/inspection', icon: 'IconClipboard', iconBg: 'bg-success-100', iconColor: 'text-success-600' },
      { label: '通知中心', to: '/alerts', icon: 'IconBell', iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600' }
    ]
  }
  if (role === 'customer_service') {
    return [
      { label: '年检核查', to: '/inspection', icon: 'IconClipboard', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
      { label: '整改跟进', to: '/rectification', icon: 'IconWrench', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
      { label: '物业同步', to: '/rectification', icon: 'IconMessage', iconBg: 'bg-success-100', iconColor: 'text-success-600' },
      { label: '通知中心', to: '/alerts', icon: 'IconBell', iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600' }
    ]
  }
  return [
    { label: '年检审核', to: '/inspection', icon: 'IconClipboard', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
    { label: '整改复查', to: '/rectification', icon: 'IconEye', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
    { label: '闭环回看', to: '/rectification/closed', icon: 'IconFolder', iconBg: 'bg-success-100', iconColor: 'text-success-600' },
    { label: '项目总览', to: '/overview', icon: 'IconDashboard', iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600' }
  ]
})

function todoIconStyle(p: PriorityLevel) {
  return {
    low: { bg: 'bg-neutral-100', color: 'text-neutral-600' },
    medium: { bg: 'bg-primary-100', color: 'text-primary-600' },
    high: { bg: 'bg-warning-100', color: 'text-warning-600' },
    critical: { bg: 'bg-danger-100', color: 'text-danger-600' }
  }[p]
}

function todoTypeIcon(type: string) {
  return {
    inspection: 'IconClipboard',
    rectification: 'IconWrench',
    recheck: 'IconEye',
    review: 'IconFileText'
  }[type] || 'IconInfo'
}

function daysLeft(deadline: string) {
  const now = new Date()
  const d = new Date(deadline)
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
  if (diff < 0) return `已超期 ${-diff} 天`
  if (diff === 0) return '今日截止'
  if (diff === 1) return '明日截止'
  return `剩余 ${diff} 天`
}

function handleTodoClick(todo: TodoItem) {
  if (todo.type === 'inspection') {
    appStore.setSelectedInspection(todo.relatedId)
    router.push('/inspection')
  } else if (todo.type === 'rectification' || todo.type === 'recheck') {
    appStore.setSelectedRectification(todo.relatedId)
    router.push('/rectification')
  } else if (todo.type === 'review') {
    appStore.setSelectedInspection(todo.relatedId)
    router.push('/inspection')
  }
}

function handleAlertClick(alert: Alert) {
  if (alert.relatedId) {
    if (alert.relatedType === 'inspection') {
      appStore.setSelectedInspection(alert.relatedId)
      router.push('/inspection')
    } else {
      appStore.setSelectedRectification(alert.relatedId)
      router.push('/rectification')
    }
  }
  appStore.markAlertRead(alert.id)
}

function handleCompletedClick(item: any) {
  if (item.type === 'inspection') {
    appStore.setSelectedInspection(item.relatedId)
    router.push('/inspection')
  } else if (item.type === 'rectification') {
    appStore.setSelectedRectification(item.relatedId)
    router.push('/rectification/closed')
  }
}
</script>
