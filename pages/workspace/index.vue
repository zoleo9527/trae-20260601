<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'
import { computed, ref } from 'vue'

const store = useInspectionStore()

const roleOptions = [
  { value: 'regional_supervisor', label: '区域督导', icon: '📋', color: 'bg-blue-500' },
  { value: 'store_manager', label: '店长', icon: '🏪', color: 'bg-green-500' },
  { value: 'purchaser', label: '采购', icon: '📦', color: 'bg-orange-500' },
]

const supervisorStats = computed(() => [
  { label: '待处理任务', value: store.pendingTasks.length, color: 'bg-danger-100 text-danger-600' },
  { label: '待验收任务', value: store.completedTasks.length, color: 'bg-warning-100 text-warning-600' },
  { label: '待巡店', value: store.pendingInspections.length, color: 'bg-primary-100 text-primary-600' },
  { label: '预警数量', value: store.activeWarnings.length, color: 'bg-danger-100 text-danger-600' },
])

const storeManagerStats = computed(() => [
  { label: '待处理任务', value: store.storeTasks.filter(t => t.status === 'pending').length, color: 'bg-danger-100 text-danger-600' },
  { label: '进行中任务', value: store.storeTasks.filter(t => t.status === 'processing').length, color: 'bg-warning-100 text-warning-600' },
  { label: '本月巡店', value: store.inspections.filter(i => i.storeId === 's1').length, color: 'bg-primary-100 text-primary-600' },
  { label: '门店预警', value: store.activeWarnings.filter(w => w.storeId === 's1').length, color: 'bg-danger-100 text-danger-600' },
])

const purchaserStats = computed(() => [
  { label: '待审批申请', value: store.purchaseRequests.filter(p => p.status === 'pending').length, color: 'bg-danger-100 text-danger-600' },
  { label: '已批准申请', value: store.purchaseRequests.filter(p => p.status === 'approved').length, color: 'bg-success-100 text-success-600' },
  { label: '食材短缺预警', value: store.activeWarnings.filter(w => w.type === 'stock_shortage').length, color: 'bg-warning-100 text-warning-600' },
  { label: '本月采购额', value: '¥58,600', color: 'bg-primary-100 text-primary-600' },
])

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '进行中',
    completed: '已完成',
    verified: '已验收'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-danger-100 text-danger-600',
    processing: 'bg-warning-100 text-warning-600',
    completed: 'bg-primary-100 text-primary-600',
    verified: 'bg-success-100 text-success-600'
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    high: '紧急',
    medium: '中等',
    low: '一般'
  }
  return labels[priority] || priority
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'bg-danger-100 text-danger-600',
    medium: 'bg-warning-100 text-warning-600',
    low: 'bg-gray-100 text-gray-600'
  }
  return colors[priority] || 'bg-gray-100 text-gray-600'
}

const isOverdue = (deadline: string) => {
  return new Date(deadline) < new Date()
}

const getWarningTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    stock_shortage: '🥬',
    bad_review: '📝',
    standard_deviation: '📊'
  }
  return icons[type] || '⚠️'
}

const getWarningSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    high: 'border-danger-200 bg-danger-50',
    medium: 'border-warning-200 bg-warning-50',
    low: 'border-gray-200 bg-gray-50'
  }
  return colors[severity] || 'border-gray-200'
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleApprovePurchase = (id: string) => {
  store.approvePurchaseRequest(id)
}

const handleRejectPurchase = (id: string) => {
  store.rejectPurchaseRequest(id)
}

const handleResolveWarning = (id: string) => {
  store.resolveWarning(id, '采购部')
}

const handleStartWarning = (id: string) => {
  store.handleWarning(id, '开始处理')
}

const showBadReviewModal = ref<string | null>(null)
const reviewResponse = ref('')

const handleRespondToReview = (id: string) => {
  if (reviewResponse.value.trim()) {
    store.respondToReview(id, reviewResponse.value)
    showBadReviewModal.value = null
    reviewResponse.value = ''
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span class="text-white text-xl">💼</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">工作台</h1>
              <p class="text-sm text-gray-500">{{ roleOptions.find(r => r.value === store.currentRole)?.label }}专属工作台</p>
            </div>
          </div>
          <a href="/" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            返回首页
          </a>
        </div>
      </div>
    </header>

    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-1">
          <a href="/" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">首页</a>
          <a href="/inspections" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">巡店检查</a>
          <a href="/rectification" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">整改复盘</a>
          <a href="/workspace" class="px-4 py-3 text-primary-600 font-medium border-b-2 border-primary-500">工作台</a>
        </div>
      </div>
    </nav>

    <nav class="bg-gray-100 border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center space-x-1">
          <button
            v-for="role in roleOptions"
            :key="role.value"
            @click="store.setRole(role.value as any)"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors',
              store.currentRole === role.value
                ? 'bg-white text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span class="mr-1">{{ role.icon }}</span>
            {{ role.label }}
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div v-if="store.currentRole === 'regional_supervisor'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            v-for="stat in supervisorStats"
            :key="stat.label"
            class="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">{{ stat.label }}</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ stat.value }}</p>
              </div>
              <div :class="['w-12 h-12 rounded-full flex items-center justify-center', stat.color]">
                <span class="text-xl">{{ stat.label.includes('预警') ? '🚨' : stat.label.includes('待处理') ? '⚠️' : '📊' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">待处理整改任务</h2>
              <a href="/rectification?status=pending" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
            </div>
            <div class="space-y-3">
              <div
                v-for="task in store.pendingTasks.slice(0, 5)"
                :key="task.id"
                class="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="navigateTo(`/rectification/${task.id}`)"
              >
                <div class="flex items-start justify-between mb-2">
                  <span class="font-medium text-gray-900">{{ task.title }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-medium',
                      getPriorityColor(task.priority)
                    ]"
                  >
                    {{ getPriorityLabel(task.priority) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <span>{{ task.storeName }}</span>
                  <span :class="isOverdue(task.deadline) ? 'text-danger-600' : ''">截止: {{ task.deadline }}</span>
                </div>
              </div>
              <div v-if="store.pendingTasks.length === 0" class="text-center py-8 text-gray-400">
                <span class="text-2xl">✅</span>
                <p class="mt-2">暂无待处理任务</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">待验收任务</h2>
              <a href="/rectification?status=completed" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
            </div>
            <div class="space-y-3">
              <div
                v-for="task in store.completedTasks.slice(0, 5)"
                :key="task.id"
                class="p-4 rounded-lg border border-primary-100 hover:bg-primary-50 transition-colors cursor-pointer"
                @click="navigateTo(`/rectification/${task.id}`)"
              >
                <div class="flex items-start justify-between mb-2">
                  <span class="font-medium text-gray-900">{{ task.title }}</span>
                  <span class="px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-600">待验收</span>
                </div>
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <span>{{ task.storeName }}</span>
                  <span>{{ task.assignee }}</span>
                </div>
              </div>
              <div v-if="store.completedTasks.length === 0" class="text-center py-8 text-gray-400">
                <span class="text-2xl">✅</span>
                <p class="mt-2">暂无待验收任务</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">实时预警</h2>
            <a href="/inspections/warnings" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="warning in store.activeWarnings"
              :key="warning.id"
              :class="[
                'p-4 rounded-lg border transition-colors',
                getWarningSeverityColor(warning.severity)
              ]"
            >
              <div class="flex items-start space-x-3">
                <span class="text-2xl">{{ getWarningTypeIcon(warning.type) }}</span>
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">{{ warning.title }}</h3>
                  <p class="text-sm text-gray-600 mt-1">{{ warning.storeName }}</p>
                  <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ warning.description }}</p>
                </div>
              </div>
              <div v-if="warning.handlingHistory.length > 0" class="mt-3 pt-3 border-t border-gray-200">
                <p class="text-xs text-gray-500">处理历史:</p>
                <div class="mt-1 space-y-1">
                  <p
                    v-for="history in warning.handlingHistory.slice(-2)"
                    :key="history.id"
                    class="text-xs text-gray-600"
                  >
                    {{ formatTime(history.time) }} - {{ history.operator }}: {{ history.action }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">外卖差评</h2>
            <a href="/inspections/reviews" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="review in store.badReviews.slice(0, 4)"
              :key="review.id"
              class="p-4 rounded-lg border border-gray-100"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900">{{ review.storeName }}</span>
                  <span class="text-sm text-gray-400">{{ review.platform }}</span>
                </div>
                <div class="flex items-center space-x-0.5">
                  <span v-for="i in 5" :key="i" class="text-sm">
                    {{ i <= review.rating ? '⭐' : '☆' }}
                  </span>
                </div>
              </div>
              <p class="text-sm text-gray-600">{{ review.content }}</p>
              <div v-if="review.response" class="mt-2 p-2 bg-success-50 rounded text-sm text-success-700">
                💬 {{ review.response }}
              </div>
              <button
                v-else
                @click="showBadReviewModal = review.id"
                class="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                回复差评
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="store.currentRole === 'store_manager'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            v-for="stat in storeManagerStats"
            :key="stat.label"
            class="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">{{ stat.label }}</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ stat.value }}</p>
              </div>
              <div :class="['w-12 h-12 rounded-full flex items-center justify-center', stat.color]">
                <span class="text-xl">{{ stat.label.includes('预警') ? '🚨' : stat.label.includes('待处理') ? '⚠️' : '📊' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">我的整改任务</h2>
              <a href="/rectification?assignee=store_manager" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
            </div>
            <div class="space-y-3">
              <div
                v-for="task in store.storeTasks.slice(0, 5)"
                :key="task.id"
                class="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="navigateTo(`/rectification/${task.id}`)"
              >
                <div class="flex items-start justify-between mb-2">
                  <span class="font-medium text-gray-900">{{ task.title }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-medium',
                      getStatusColor(task.status)
                    ]"
                  >
                    {{ getStatusLabel(task.status) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <span :class="[
                    'px-2 py-0.5 rounded text-xs',
                    getPriorityColor(task.priority)
                  ]">
                    {{ getPriorityLabel(task.priority) }}
                  </span>
                  <span :class="isOverdue(task.deadline) ? 'text-danger-600' : ''">截止: {{ task.deadline }}</span>
                </div>
              </div>
              <div v-if="store.storeTasks.length === 0" class="text-center py-8 text-gray-400">
                <span class="text-2xl">✅</span>
                <p class="mt-2">暂无整改任务</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">门店预警</h2>
              <a href="/inspections/warnings" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
            </div>
            <div class="space-y-3">
              <div
                v-for="warning in store.activeWarnings.filter(w => w.storeId === 's1').slice(0, 5)"
                :key="warning.id"
                :class="[
                  'p-4 rounded-lg border transition-colors',
                  getWarningSeverityColor(warning.severity)
                ]"
              >
                <div class="flex items-start space-x-3">
                  <span class="text-2xl">{{ getWarningTypeIcon(warning.type) }}</span>
                  <div class="flex-1">
                    <h3 class="font-medium text-gray-900">{{ warning.title }}</h3>
                    <p class="text-sm text-gray-600 mt-1">{{ warning.description }}</p>
                  </div>
                </div>
                <div v-if="warning.handlingHistory.length > 0" class="mt-3 pt-3 border-t border-gray-200">
                  <p class="text-xs text-gray-500">处理历史:</p>
                  <div class="mt-1 space-y-1">
                    <p
                      v-for="history in warning.handlingHistory.slice(-2)"
                      :key="history.id"
                      class="text-xs text-gray-600"
                    >
                      {{ formatTime(history.time) }} - {{ history.operator }}: {{ history.action }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-if="store.activeWarnings.filter(w => w.storeId === 's1').length === 0" class="text-center py-8 text-gray-400">
                <span class="text-2xl">✅</span>
                <p class="mt-2">暂无门店预警</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">门店日报</h2>
            <a href="/inspections/reports" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="report in store.dailyReports.slice(0, 3)"
              :key="report.id"
              class="p-4 rounded-lg border border-gray-100"
            >
              <div class="flex items-center justify-between mb-3">
                <span class="font-medium text-gray-900">{{ report.storeName }}</span>
                <span class="text-sm text-gray-400">{{ report.reportDate }}</span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p class="text-lg font-semibold text-gray-900">¥{{ report.sales.toLocaleString() }}</p>
                  <p class="text-xs text-gray-400">销售额</p>
                </div>
                <div>
                  <p class="text-lg font-semibold text-gray-900">{{ report.customers }}</p>
                  <p class="text-xs text-gray-400">顾客数</p>
                </div>
                <div>
                  <p class="text-lg font-semibold text-gray-900">¥{{ report.avgCheck.toFixed(1) }}</p>
                  <p class="text-xs text-gray-400">客单价</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="store.currentRole === 'purchaser'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            v-for="stat in purchaserStats"
            :key="stat.label"
            class="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">{{ stat.label }}</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ stat.value }}</p>
              </div>
              <div :class="['w-12 h-12 rounded-full flex items-center justify-center', stat.color]">
                <span class="text-xl">{{ stat.label.includes('预警') ? '🚨' : stat.label.includes('待审批') ? '⚠️' : '📊' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">待审批采购申请</h2>
              <a href="/inspections/purchases" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
            </div>
            <div class="space-y-3">
              <div
                v-for="request in store.purchaseRequests.filter(p => p.status === 'pending').slice(0, 5)"
                :key="request.id"
                class="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-900">{{ request.storeName }}</span>
                  <span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">待审批</span>
                </div>
                <div class="space-y-1 mb-2">
                  <div
                    v-for="item in request.items.slice(0, 3)"
                    :key="item.id"
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-gray-700">{{ item.name }}</span>
                    <span class="text-gray-500">{{ item.quantity }}{{ item.unit }}</span>
                  </div>
                  <p v-if="request.items.length > 3" class="text-xs text-gray-400">还有 {{ request.items.length - 3 }} 项...</p>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">申请人: {{ request.requester }}</span>
                  <div class="flex space-x-2">
                    <button
                      @click="handleApprovePurchase(request.id)"
                      class="px-3 py-1 text-sm font-medium bg-success-100 text-success-600 rounded-lg hover:bg-success-200 transition-colors"
                    >
                      批准
                    </button>
                    <button
                      @click="handleRejectPurchase(request.id)"
                      class="px-3 py-1 text-sm font-medium bg-danger-100 text-danger-600 rounded-lg hover:bg-danger-200 transition-colors"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="store.purchaseRequests.filter(p => p.status === 'pending').length === 0" class="text-center py-8 text-gray-400">
                <span class="text-2xl">✅</span>
                <p class="mt-2">暂无待审批申请</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">食材短缺预警</h2>
              <a href="/inspections/warnings?type=stock_shortage" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
            </div>
            <div class="space-y-3">
              <div
                v-for="warning in store.activeWarnings.filter(w => w.type === 'stock_shortage').slice(0, 5)"
                :key="warning.id"
                :class="[
                  'p-4 rounded-lg border transition-colors',
                  getWarningSeverityColor(warning.severity)
                ]"
              >
                <div class="flex items-start space-x-3">
                  <span class="text-2xl">🥬</span>
                  <div class="flex-1">
                    <h3 class="font-medium text-gray-900">{{ warning.storeName }}</h3>
                    <p class="text-sm text-gray-600 mt-1">{{ warning.description }}</p>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      @click="handleStartWarning(warning.id)"
                      class="px-3 py-1 text-sm font-medium bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                    >
                      处理中
                    </button>
                    <button
                      @click="handleResolveWarning(warning.id)"
                      class="px-3 py-1 text-sm font-medium bg-success-100 text-success-600 rounded-lg hover:bg-success-200 transition-colors"
                    >
                      已补货
                    </button>
                  </div>
                </div>
                <div v-if="warning.handlingHistory.length > 0" class="mt-3 pt-3 border-t border-gray-200">
                  <p class="text-xs text-gray-500">处理历史:</p>
                  <div class="mt-1 space-y-1">
                    <p
                      v-for="history in warning.handlingHistory.slice(-2)"
                      :key="history.id"
                      class="text-xs text-gray-600"
                    >
                      {{ formatTime(history.time) }} - {{ history.operator }}: {{ history.action }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-if="store.activeWarnings.filter(w => w.type === 'stock_shortage').length === 0" class="text-center py-8 text-gray-400">
                <span class="text-2xl">✅</span>
                <p class="mt-2">暂无食材短缺预警</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">近期采购申请</h2>
            <a href="/inspections/purchases" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="request in store.purchaseRequests.slice(0, 3)"
              :key="request.id"
              class="p-4 rounded-lg border border-gray-100"
            >
              <div class="flex items-center justify-between mb-3">
                <span class="font-medium text-gray-900">{{ request.storeName }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-xs font-medium',
                    request.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                    request.status === 'approved' ? 'bg-success-100 text-success-600' :
                    request.status === 'rejected' ? 'bg-danger-100 text-danger-600' :
                    'bg-primary-100 text-primary-600'
                  ]"
                >
                  {{ request.status === 'pending' ? '待审批' : request.status === 'approved' ? '已批准' : request.status === 'rejected' ? '已拒绝' : '已完成' }}
                </span>
              </div>
              <div class="space-y-1">
                <div
                  v-for="item in request.items.slice(0, 2)"
                  :key="item.id"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-gray-700">{{ item.name }}</span>
                  <span class="text-gray-500">{{ item.quantity }}{{ item.unit }}</span>
                </div>
              </div>
              <div v-if="request.approvalHistory.length > 0" class="mt-2 pt-2 border-t border-gray-100">
                <p class="text-xs text-gray-500">审批历史:</p>
                <div class="mt-1">
                  <p
                    v-for="history in request.approvalHistory.slice(-2)"
                    :key="history.id"
                    class="text-xs text-gray-600"
                  >
                    {{ formatTime(history.time) }} - {{ history.operator }}: {{ history.action }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Teleport to="body">
      <div
        v-if="showBadReviewModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showBadReviewModal = null"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">回复差评</h3>
          </div>
          <div class="px-6 py-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">回复内容</label>
              <textarea
                v-model="reviewResponse"
                rows="4"
                placeholder="请输入回复内容..."
                class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              @click="showBadReviewModal = null"
              class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="handleRespondToReview(showBadReviewModal)"
              :disabled="!reviewResponse.trim()"
              class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送回复
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
