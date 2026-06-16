<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'
import { ref, computed } from 'vue'

const store = useInspectionStore()

const searchQuery = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')
const severityFilter = ref('all')

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'stock_shortage', label: '缺菜预警', icon: '🥬' },
  { value: 'bad_review', label: '外卖差评', icon: '📝' },
  { value: 'standard_deviation', label: '执行标准不一', icon: '📊' },
]

const severityOptions = [
  { value: 'all', label: '全部级别' },
  { value: 'high', label: '紧急' },
  { value: 'medium', label: '中等' },
  { value: 'low', label: '一般' },
]

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '处理中' },
  { value: 'resolved', label: '已处理' },
]

const filteredWarnings = computed(() => {
  return store.warnings.filter(warning => {
    const matchesSearch = !searchQuery.value || 
      warning.storeName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      warning.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesType = typeFilter.value === 'all' || warning.type === typeFilter.value
    const matchesStatus = statusFilter.value === 'all' || warning.status === statusFilter.value
    const matchesSeverity = severityFilter.value === 'all' || warning.severity === severityFilter.value
    
    return matchesSearch && matchesType && matchesStatus && matchesSeverity
  })
})

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    stock_shortage: '缺菜预警',
    bad_review: '外卖差评',
    standard_deviation: '执行标准不一'
  }
  return labels[type] || type
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    stock_shortage: '🥬',
    bad_review: '📝',
    standard_deviation: '📊'
  }
  return icons[type] || '⚠️'
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    high: '紧急',
    medium: '中等',
    low: '一般'
  }
  return labels[severity] || severity
}

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    high: 'bg-danger-100 text-danger-600',
    medium: 'bg-warning-100 text-warning-600',
    low: 'bg-gray-100 text-gray-600'
  }
  return colors[severity] || 'bg-gray-100 text-gray-600'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: '处理中',
    resolved: '已处理'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-warning-100 text-warning-600',
    resolved: 'bg-success-100 text-success-600'
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              @click="navigateTo('/inspections')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">预警管理</h1>
              <p class="text-sm text-gray-500">缺菜、差评、执行标准不一预警处理</p>
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
          <a href="/workspace" class="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">工作台</a>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex-1">
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索门店名称、预警标题..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <select
              v-model="typeFilter"
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <select
              v-model="severityFilter"
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option v-for="opt in severityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <select
              v-model="statusFilter"
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="warning in filteredWarnings"
          :key="warning.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          :class="{ 'opacity-60': warning.status === 'resolved' }"
        >
          <div
            :class="[
              'px-5 py-3 border-b',
              warning.status === 'active' ? warning.severity === 'high' ? 'bg-danger-50 border-danger-100' : warning.severity === 'medium' ? 'bg-warning-50 border-warning-100' : 'bg-gray-50 border-gray-100' :
              'bg-success-50 border-success-100'
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-xl">{{ getTypeIcon(warning.type) }}</span>
                <span class="font-medium text-gray-900">{{ getTypeLabel(warning.type) }}</span>
              </div>
              <span
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium',
                  getStatusColor(warning.status)
                ]"
              >
                {{ getStatusLabel(warning.status) }}
              </span>
            </div>
          </div>
          <div class="p-5">
            <h3 class="font-semibold text-gray-900 mb-2">{{ warning.title }}</h3>
            <p class="text-sm text-gray-600 mb-3">{{ warning.storeName }}</p>
            <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ warning.description }}</p>
            
            <div class="flex items-center justify-between mb-4">
              <span
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium',
                  getSeverityColor(warning.severity)
                ]"
              >
                {{ getSeverityLabel(warning.severity) }}
              </span>
              <span class="text-xs text-gray-400">{{ formatTime(warning.createdAt) }}</span>
            </div>
            
            <div v-if="warning.handlingHistory.length > 0" class="mb-4 p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-500 mb-2">处理记录 ({{ warning.handlingHistory.length }}条)</p>
              <div class="space-y-1">
                <p
                  v-for="history in warning.handlingHistory.slice(-3)"
                  :key="history.id"
                  class="text-xs text-gray-600"
                >
                  {{ formatTime(history.time) }} - {{ history.operator }}: {{ history.action }}
                  <span v-if="history.comment" class="ml-1">("{{ history.comment }}")</span>
                </p>
              </div>
            </div>
            
            <button
              @click="navigateTo(`/inspections/warnings/${warning.id}`)"
              class="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredWarnings.length === 0" class="text-center py-12">
        <span class="text-4xl">📭</span>
        <p class="mt-4 text-gray-500">没有找到匹配的预警记录</p>
      </div>
    </main>
  </div>
</template>
