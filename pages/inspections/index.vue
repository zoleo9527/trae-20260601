<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'
import { ref, computed } from 'vue'

const store = useInspectionStore()

const searchQuery = ref('')
const statusFilter = ref('all')
const regionFilter = ref('all')

const regions = computed(() => {
  const uniqueRegions = new Set(store.stores.map(s => s.region))
  return Array.from(uniqueRegions)
})

const filteredInspections = computed(() => {
  return store.inspections.filter(inspection => {
    const matchesSearch = !searchQuery.value || 
      inspection.storeName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      inspection.inspector.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === 'all' || inspection.status === statusFilter.value
    const store = store.stores.find(s => s.id === inspection.storeId)
    const matchesRegion = regionFilter.value === 'all' || store?.region === regionFilter.value
    
    return matchesSearch && matchesStatus && matchesRegion
  })
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '进行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-primary-100 text-primary-600',
    completed: 'bg-success-100 text-success-600',
    overdue: 'bg-danger-100 text-danger-600'
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

const getFailCount = (items: any[]) => {
  return items.filter(i => i.result === 'fail').length
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span class="text-white text-xl">📋</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">巡店检查</h1>
              <p class="text-sm text-gray-500">门店检查记录与管理</p>
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
          <a href="/inspections" class="px-4 py-3 text-primary-600 font-medium border-b-2 border-primary-500">巡店检查</a>
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
                placeholder="搜索门店名称、督导姓名..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <select
              v-model="statusFilter"
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">全部状态</option>
              <option value="pending">进行中</option>
              <option value="completed">已完成</option>
              <option value="overdue">已逾期</option>
            </select>
            <select
              v-model="regionFilter"
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">全部区域</option>
              <option v-for="region in regions" :key="region" :value="region">{{ region }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="inspection in filteredInspections"
          :key="inspection.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div class="p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-900">{{ inspection.storeName }}</h3>
                <p class="text-sm text-gray-500">检查日期: {{ inspection.inspectDate }}</p>
              </div>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                  getStatusColor(inspection.status)
                ]"
              >
                {{ getStatusLabel(inspection.status) }}
              </span>
            </div>
            
            <div class="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <span>👤 {{ inspection.inspector }}</span>
              <span>📋 {{ inspection.items.length }}项检查</span>
              <span v-if="getFailCount(inspection.items) > 0" class="text-danger-600">❌ {{ getFailCount(inspection.items) }}项不合格</span>
            </div>
            
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ inspection.summary }}</p>
            
            <div class="flex flex-wrap gap-2 mb-4">
              <div
                v-for="category in [...new Set(inspection.items.map(i => i.category))]"
                :key="category"
                class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {{ category }}
              </div>
            </div>
            
            <button
              @click="navigateTo(`/inspections/${inspection.id}`)"
              class="w-full py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredInspections.length === 0" class="text-center py-12">
        <span class="text-4xl">🔍</span>
        <p class="mt-4 text-gray-500">没有找到匹配的巡店检查记录</p>
      </div>
    </main>
  </div>
</template>
