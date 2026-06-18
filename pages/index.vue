<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFeedback } from '~/composables/useFeedback'
import type { Role, Feedback } from '~/types'

const {
  stats,
  feedbacks,
  activeTasks,
  inspections,
  schedules,
  materials,
  guideFeedbacks,
  engineerFeedbacks,
  activityFeedbacks,
  selectFeedback,
  setCurrentRole,
  currentUserRole,
  getStatusLabel,
  getRoleLabel
} = useFeedback()

const roleTabs: { key: Role | 'all'; label: string; color: string }[] = [
  { key: 'all', label: '全视角', color: 'text-gray-600' },
  { key: 'guide', label: '展教员', color: 'text-blue-600' },
  { key: 'engineer', label: '设备工程师', color: 'text-orange-600' },
  { key: 'activity_teacher', label: '活动老师', color: 'text-green-600' }
]

const currentView = ref<Role | 'all'>('all')

const switchView = (view: Role | 'all') => {
  currentView.value = view
  if (view !== 'all') {
    setCurrentRole(view)
  }
}

const statCards = computed(() => [
  {
    title: '总反馈数',
    value: stats.value.totalFeedback,
    icon: 'message',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  {
    title: '待处理',
    value: stats.value.pendingFeedback,
    icon: 'clock',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600'
  },
  {
    title: '处理中',
    value: feedbacks.value.filter(f => f.status.includes('processing')).length,
    icon: 'refresh',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  {
    title: '已解决',
    value: stats.value.resolvedFeedback,
    icon: 'check',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  }
])

const warningInspections = computed(() => 
  inspections.value.filter(i => i.status === 'error' || i.status === 'warning').slice(0, 4)
)

const conflictSchedules = computed(() => 
  schedules.value.filter(s => s.status === 'conflict' || s.conflictInfo).slice(0, 4)
)

const lowStockMaterials = computed(() => 
  materials.value.filter(m => m.status === 'low' || m.status === 'out').slice(0, 4)
)

const displayFeedbacks = computed(() => {
  if (currentView.value === 'guide') return guideFeedbacks.value
  if (currentView.value === 'engineer') return engineerFeedbacks.value
  if (currentView.value === 'activity_teacher') return activityFeedbacks.value
  return feedbacks.value.filter(f => !['resolved', 'closed'].includes(f.status))
})

const roleStats = computed(() => stats.value.roleStats)

const getIconPath = (icon: string) => {
  const icons: Record<string, string> = {
    message: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>',
    clock: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',
    check: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>',
    refresh: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>',
    warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
    calendar: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>',
    box: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>'
  }
  return icons[icon] || icons.message
}

const typeColors: Record<string, string> = {
  suggestion: 'badge-info',
  complaint: 'badge-danger',
  question: 'badge-warning',
  praise: 'badge-success',
  fault: 'badge-danger'
}

const typeLabels: Record<string, string> = {
  suggestion: '建议',
  complaint: '投诉',
  question: '咨询',
  praise: '表扬',
  fault: '故障'
}

const statusColors: Record<string, string> = {
  pending: 'badge-gray',
  guide_processing: 'badge-info',
  guide_completed: 'badge-success',
  engineer_processing: 'badge-info',
  engineer_completed: 'badge-success',
  activity_processing: 'badge-info',
  activity_completed: 'badge-success',
  resolved: 'badge-success',
  closed: 'badge-gray'
}

const roleColors: Record<Role, string> = {
  guide: 'bg-blue-100 text-blue-700',
  engineer: 'bg-orange-100 text-orange-700',
  activity_teacher: 'bg-green-100 text-green-700'
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高'
}

const handleClick = (feedback: Feedback) => {
  selectFeedback(feedback)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">工作面</h1>
      <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
        <button
          v-for="tab in roleTabs"
          :key="tab.key"
          @click="switchView(tab.key as Role | 'all')"
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
          :class="currentView === tab.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-6">
      <div
        v-for="card in statCards"
        :key="card.title"
        class="card p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">{{ card.title }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ card.value }}</p>
          </div>
          <div :class="[card.bgColor, 'w-12 h-12 rounded-lg flex items-center justify-center']">
            <svg :class="['w-6 h-6', card.textColor]" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIconPath(card.icon)"></svg>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div
        v-for="rs in roleStats"
        :key="rs.role"
        class="card p-5"
        :class="{ 'ring-2 ring-blue-500': currentView === rs.role }"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="roleColors[rs.role]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="rs.role === 'guide'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              <path v-if="rs.role === 'engineer'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path v-if="rs.role === 'engineer'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path v-if="rs.role === 'activity_teacher'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{{ rs.roleName }}</h3>
            <p class="text-xs text-gray-500">待办 {{ rs.pendingCount + rs.processingCount }} 项</p>
          </div>
        </div>
        <div class="flex items-center gap-4 text-center">
          <div class="flex-1">
            <p class="text-xl font-bold text-yellow-600">{{ rs.pendingCount }}</p>
            <p class="text-xs text-gray-500">待处理</p>
          </div>
          <div class="flex-1">
            <p class="text-xl font-bold text-blue-600">{{ rs.processingCount }}</p>
            <p class="text-xs text-gray-500">处理中</p>
          </div>
          <div class="flex-1">
            <p class="text-xl font-bold text-green-600">{{ rs.completedCount }}</p>
            <p class="text-xs text-gray-500">已完成</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIconPath('warning')"></svg>
            展项异常
          </h3>
          <NuxtLink to="/inspection" class="text-sm text-primary-600 hover:text-primary-700">查看全部</NuxtLink>
        </div>
        <div class="space-y-2">
          <div
            v-for="item in warningInspections"
            :key="item.id"
            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-900">{{ item.name }}</span>
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-yellow-500': item.status === 'warning',
                  'bg-red-500': item.status === 'error'
                }"
              ></span>
            </div>
            <p class="text-xs text-gray-500">{{ item.location }}</p>
            <p v-if="item.lastRemark" class="text-xs text-red-600 mt-1 line-clamp-1">{{ item.lastRemark }}</p>
          </div>
          <div v-if="warningInspections.length === 0" class="text-center py-4 text-gray-500 text-sm">
            暂无异常
          </div>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIconPath('calendar')"></svg>
            预约冲突
          </h3>
          <NuxtLink to="/schedule" class="text-sm text-primary-600 hover:text-primary-700">查看全部</NuxtLink>
        </div>
        <div class="space-y-2">
          <div
            v-for="item in conflictSchedules"
            :key="item.id"
            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-900">{{ item.title }}</span>
              <span class="text-xs text-orange-600 font-medium">冲突</span>
            </div>
            <p class="text-xs text-gray-500">{{ item.date }} {{ item.startTime }}</p>
            <p v-if="item.conflictInfo" class="text-xs text-orange-600 mt-1 line-clamp-1">{{ item.conflictInfo }}</p>
          </div>
          <div v-if="conflictSchedules.length === 0" class="text-center py-4 text-gray-500 text-sm">
            暂无冲突
          </div>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIconPath('box')"></svg>
            耗材预警
          </h3>
          <NuxtLink to="/materials" class="text-sm text-primary-600 hover:text-primary-700">查看全部</NuxtLink>
        </div>
        <div class="space-y-2">
          <div
            v-for="item in lowStockMaterials"
            :key="item.id"
            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-900">{{ item.name }}</span>
              <span
                class="text-xs font-medium"
                :class="{
                  'text-yellow-600': item.status === 'low',
                  'text-red-600': item.status === 'out'
                }"
              >
                {{ item.status === 'out' ? '缺货' : '库存低' }}
              </span>
            </div>
            <p class="text-xs text-gray-500">{{ item.quantity }}{{ item.unit }} / 最低{{ item.minStock }}{{ item.unit }}</p>
            <p v-if="item.lastRemark" class="text-xs text-yellow-600 mt-1 line-clamp-1">{{ item.lastRemark }}</p>
          </div>
          <div v-if="lowStockMaterials.length === 0" class="text-center py-4 text-gray-500 text-sm">
            暂无预警
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="p-5 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">
            {{ currentView === 'all' ? '流转中事项' : getRoleLabel(currentView as Role) + '待办' }}
          </h3>
          <NuxtLink to="/feedback" class="text-sm text-primary-600 hover:text-primary-700">查看全部</NuxtLink>
        </div>
      </div>

      <div v-if="currentView === 'all'" class="divide-y divide-gray-100">
        <div class="grid grid-cols-3 gap-0">
          <div class="border-r border-gray-100">
            <div class="p-3 bg-blue-50 border-b border-gray-100">
              <h4 class="text-sm font-medium text-blue-700 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                展教员
                <span class="ml-auto text-xs bg-blue-100 px-2 py-0.5 rounded-full">{{ guideFeedbacks.length }}</span>
              </h4>
            </div>
            <div class="p-3 space-y-2 min-h-[300px]">
              <div
                v-for="fb in guideFeedbacks"
                :key="fb.id"
                @click="handleClick(fb)"
                class="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all"
              >
                <div class="flex items-start gap-2 mb-1">
                  <h5 class="text-sm font-medium text-gray-900 flex-1 line-clamp-1">{{ fb.title }}</h5>
                  <span class="px-1.5 py-0.5 text-xs rounded font-medium" :class="priorityColors[fb.priority]">
                    {{ priorityLabels[fb.priority] }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 line-clamp-2 mb-2">{{ fb.content }}</p>
                <div class="flex items-center justify-between">
                  <span class="badge text-xs" :class="typeColors[fb.type]">{{ typeLabels[fb.type] }}</span>
                  <span class="text-xs text-gray-400">{{ fb.createdAt.slice(5, 16) }}</span>
                </div>
              </div>
              <div v-if="guideFeedbacks.length === 0" class="text-center py-8 text-gray-400 text-xs">
                暂无待办
              </div>
            </div>
          </div>

          <div class="border-r border-gray-100">
            <div class="p-3 bg-orange-50 border-b border-gray-100">
              <h4 class="text-sm font-medium text-orange-700 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                设备工程师
                <span class="ml-auto text-xs bg-orange-100 px-2 py-0.5 rounded-full">{{ engineerFeedbacks.length }}</span>
              </h4>
            </div>
            <div class="p-3 space-y-2 min-h-[300px]">
              <div
                v-for="fb in engineerFeedbacks"
                :key="fb.id"
                @click="handleClick(fb)"
                class="p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-400 hover:shadow-sm cursor-pointer transition-all"
              >
                <div class="flex items-start gap-2 mb-1">
                  <h5 class="text-sm font-medium text-gray-900 flex-1 line-clamp-1">{{ fb.title }}</h5>
                  <span class="px-1.5 py-0.5 text-xs rounded font-medium" :class="priorityColors[fb.priority]">
                    {{ priorityLabels[fb.priority] }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 line-clamp-2 mb-2">{{ fb.content }}</p>
                <div class="flex items-center justify-between">
                  <span class="badge text-xs" :class="typeColors[fb.type]">{{ typeLabels[fb.type] }}</span>
                  <span class="text-xs text-gray-400">{{ fb.createdAt.slice(5, 16) }}</span>
                </div>
              </div>
              <div v-if="engineerFeedbacks.length === 0" class="text-center py-8 text-gray-400 text-xs">
                暂无待办
              </div>
            </div>
          </div>

          <div>
            <div class="p-3 bg-green-50 border-b border-gray-100">
              <h4 class="text-sm font-medium text-green-700 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                活动老师
                <span class="ml-auto text-xs bg-green-100 px-2 py-0.5 rounded-full">{{ activityFeedbacks.length }}</span>
              </h4>
            </div>
            <div class="p-3 space-y-2 min-h-[300px]">
              <div
                v-for="fb in activityFeedbacks"
                :key="fb.id"
                @click="handleClick(fb)"
                class="p-3 bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:shadow-sm cursor-pointer transition-all"
              >
                <div class="flex items-start gap-2 mb-1">
                  <h5 class="text-sm font-medium text-gray-900 flex-1 line-clamp-1">{{ fb.title }}</h5>
                  <span class="px-1.5 py-0.5 text-xs rounded font-medium" :class="priorityColors[fb.priority]">
                    {{ priorityLabels[fb.priority] }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 line-clamp-2 mb-2">{{ fb.content }}</p>
                <div class="flex items-center justify-between">
                  <span class="badge text-xs" :class="typeColors[fb.type]">{{ typeLabels[fb.type] }}</span>
                  <span class="text-xs text-gray-400">{{ fb.createdAt.slice(5, 16) }}</span>
                </div>
              </div>
              <div v-if="activityFeedbacks.length === 0" class="text-center py-8 text-gray-400 text-xs">
                暂无待办
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="fb in displayFeedbacks"
          :key="fb.id"
          @click="handleClick(fb)"
          class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="text-sm font-medium text-gray-900 truncate">{{ fb.title }}</h4>
                <span class="badge" :class="typeColors[fb.type]">{{ typeLabels[fb.type] }}</span>
                <span class="px-1.5 py-0.5 text-xs rounded font-medium" :class="priorityColors[fb.priority]">
                  {{ priorityLabels[fb.priority] }}
                </span>
              </div>
              <p class="text-sm text-gray-600 line-clamp-1 mb-2">{{ fb.content }}</p>
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span>{{ fb.visitorName }}</span>
                <span v-if="fb.exhibitionName">{{ fb.exhibitionName }}</span>
                <span>{{ fb.createdAt }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 text-xs rounded" :class="roleColors[fb.currentRole]">
                {{ getRoleLabel(fb.currentRole) }}
              </span>
              <span class="badge" :class="statusColors[fb.status]">{{ getStatusLabel(fb.status) }}</span>
            </div>
          </div>
        </div>
        <div v-if="displayFeedbacks.length === 0" class="p-12 text-center">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="text-gray-500 text-sm">暂无待办事项</p>
        </div>
      </div>
    </div>

    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900">进行中整改任务</h3>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div
          v-for="task in activeTasks.slice(0, 6)"
          :key="task.id"
          class="p-4 bg-gray-50 rounded-lg"
        >
          <div class="flex items-start justify-between mb-2">
            <div>
              <h5 class="text-sm font-medium text-gray-900">{{ task.title }}</h5>
              <p class="text-xs text-gray-500 mt-0.5 line-clamp-1">{{ task.description }}</p>
            </div>
            <span class="px-2 py-0.5 text-xs rounded" :class="roleColors[task.role]">
              {{ getRoleLabel(task.role) }}
            </span>
          </div>
          <div class="mb-2">
            <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{{ task.assignee }}</span>
              <span>{{ task.progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5">
              <div
                class="bg-primary-500 h-1.5 rounded-full transition-all"
                :style="{ width: task.progress + '%' }"
              ></div>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>截止: {{ task.deadline }}</span>
            <span class="badge badge-info">进行中</span>
          </div>
        </div>
      </div>
      <div v-if="activeTasks.length === 0" class="text-center py-8 text-gray-500 text-sm">
        暂无进行中任务
      </div>
    </div>
  </div>
</template>
