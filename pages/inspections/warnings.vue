<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'
import { ref, computed } from 'vue'

const store = useInspectionStore()

const searchQuery = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')
const severityFilter = ref('all')
const expandedStores = ref<string[]>([])

const typeOptions = [
  { value: 'all', label: '全部类型', icon: '📋' },
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

const warningsByStore = computed(() => {
  const grouped: Record<string, typeof filteredWarnings.value> = {}
  filteredWarnings.value.forEach(warning => {
    if (!grouped[warning.storeId]) {
      grouped[warning.storeId] = []
    }
    grouped[warning.storeId].push(warning)
  })
  
  const sortedStores = Object.entries(grouped).sort((a, b) => {
    const aActive = a[1].filter(w => w.status === 'active').length
    const bActive = b[1].filter(w => w.status === 'active').length
    return bActive - aActive
  })
  
  return sortedStores.map(([storeId, warnings]) => ({
    storeId,
    storeName: warnings[0].storeName,
    warnings: warnings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    activeCount: warnings.filter(w => w.status === 'active').length,
    highSeverityCount: warnings.filter(w => w.severity === 'high' && w.status === 'active').length,
  }))
})

const stats = computed(() => ({
  total: filteredWarnings.value.length,
  active: filteredWarnings.value.filter(w => w.status === 'active').length,
  resolved: filteredWarnings.value.filter(w => w.status === 'resolved').length,
  highSeverity: filteredWarnings.value.filter(w => w.severity === 'high' && w.status === 'active').length,
  mediumSeverity: filteredWarnings.value.filter(w => w.severity === 'medium' && w.status === 'active').length,
  lowSeverity: filteredWarnings.value.filter(w => w.severity === 'low' && w.status === 'active').length,
}))

const toggleStore = (storeId: string) => {
  const index = expandedStores.value.indexOf(storeId)
  if (index === -1) {
    expandedStores.value.push(storeId)
  } else {
    expandedStores.value.splice(index, 1)
  }
}

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

const quickFilterStatus = (status: string) => {
  statusFilter.value = status
}

const quickFilterSeverity = (severity: string) => {
  severityFilter.value = severity
}

const resetFilters = () => {
  typeFilter.value = 'all'
  statusFilter.value = 'all'
  severityFilter.value = 'all'
  searchQuery.value = ''
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
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">预警总数</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.total }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span class="text-xl">📊</span>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">紧急预警</p>
              <p class="text-2xl font-bold text-danger-600 mt-1">{{ stats.highSeverity }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
              <span class="text-xl">🚨</span>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">处理中</p>
              <p class="text-2xl font-bold text-warning-600 mt-1">{{ stats.active }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
              <span class="text-xl">🔄</span>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">已处理</p>
              <p class="text-2xl font-bold text-success-600 mt-1">{{ stats.resolved }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
              <span class="text-xl">✅</span>
            </div>
          </div>
        </div>
      </div>

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
          <div class="flex items-center space-x-2">
            <button
              @click="quickFilterStatus('active')"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                statusFilter === 'active' ? 'bg-warning-100 text-warning-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              ⚠️ 处理中
            </button>
            <button
              @click="quickFilterStatus('resolved')"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                statusFilter === 'resolved' ? 'bg-success-100 text-success-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              ✅ 已处理
            </button>
            <button
              @click="quickFilterSeverity('high')"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                severityFilter === 'high' ? 'bg-danger-100 text-danger-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              🔴 紧急
            </button>
            <button
              @click="resetFilters"
              class="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              重置
            </button>
          </div>
        </div>
        
        <div class="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">类型:</span>
            <div class="flex space-x-1">
              <button
                v-for="opt in typeOptions"
                :key="opt.value"
                @click="typeFilter = opt.value"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  typeFilter === opt.value ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                <span class="mr-1">{{ opt.icon }}</span>
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">级别:</span>
            <select
              v-model="severityFilter"
              class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option v-for="opt in severityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="group in warningsByStore"
          :key="group.storeId"
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div
            @click="toggleStore(group.storeId)"
            class="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="text-lg">🏪</span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{{ group.storeName }}</h3>
                <p class="text-sm text-gray-500">
                  共 {{ group.warnings.length }} 条预警
                  <span v-if="group.activeCount > 0" class="text-warning-600">| {{ group.activeCount }} 条处理中</span>
                  <span v-if="group.highSeverityCount > 0" class="text-danger-600">| {{ group.highSeverityCount }} 条紧急</span>
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span
                v-if="group.highSeverityCount > 0"
                class="px-2 py-1 bg-danger-100 text-danger-600 text-xs font-medium rounded"
              >
                {{ group.highSeverityCount }} 紧急
              </span>
              <span
                :class="[
                  'text-xl transition-transform duration-200',
                  expandedStores.includes(group.storeId) ? 'rotate-180' : ''
                ]"
              >
                ▼
              </span>
            </div>
          </div>
          
          <div
            v-show="expandedStores.includes(group.storeId)"
            class="border-t border-gray-100"
          >
            <div class="divide-y divide-gray-100">
              <div
                v-for="warning in group.warnings"
                :key="warning.id"
                class="px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="text-lg">{{ getTypeIcon(warning.type) }}</span>
                      <span class="font-medium text-gray-900">{{ warning.title }}</span>
                      <span
                        :class="[
                          'px-2 py-0.5 rounded text-xs font-medium',
                          getSeverityColor(warning.severity)
                        ]"
                      >
                        {{ getSeverityLabel(warning.severity) }}
                      </span>
                      <span
                        :class="[
                          'px-2 py-0.5 rounded text-xs font-medium',
                          getStatusColor(warning.status)
                        ]"
                      >
                        {{ getStatusLabel(warning.status) }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 mt-1">{{ warning.description }}</p>
                    <div class="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      <span>{{ formatTime(warning.createdAt) }}</span>
                      <span v-if="warning.handlingHistory.length > 0">
                        已处理 {{ warning.handlingHistory.length }} 次
                      </span>
                    </div>
                  </div>
                  <button
                    @click.stop="navigateTo(`/inspections/warnings/${warning.id}`)"
                    class="ml-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            </div>
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