<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'
import { ref, computed } from 'vue'

const store = useInspectionStore()

const searchQuery = ref('')
const statusFilter = ref('all')

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'completed', label: '已完成' },
]

const filteredRequests = computed(() => {
  return store.purchaseRequests.filter(request => {
    const matchesSearch = !searchQuery.value || 
      request.storeName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      request.requester.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === 'all' || request.status === statusFilter.value
    
    return matchesSearch && matchesStatus
  })
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    completed: '已完成'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    approved: 'bg-success-100 text-success-600',
    rejected: 'bg-danger-100 text-danger-600',
    completed: 'bg-primary-100 text-primary-600'
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

const handleApprove = (id: string) => {
  store.approvePurchaseRequest(id)
}

const handleReject = (id: string) => {
  store.rejectPurchaseRequest(id)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              @click="navigateTo('/')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">采购申请</h1>
              <p class="text-sm text-gray-500">门店采购申请管理</p>
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
                placeholder="搜索门店名称、申请人..."
                class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <select
              v-model="statusFilter"
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="request in filteredRequests"
          :key="request.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-4">
                <h3 class="font-semibold text-gray-900">{{ request.storeName }}</h3>
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getStatusColor(request.status)
                  ]"
                >
                  {{ getStatusLabel(request.status) }}
                </span>
              </div>
              <div class="text-sm text-gray-500">
                申请时间: {{ formatTime(request.createdAt) }}
              </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
              <p class="text-sm text-gray-500 mb-2">采购物品:</p>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div
                  v-for="item in request.items"
                  :key="item.id"
                  class="flex items-center justify-between p-2 bg-white rounded"
                >
                  <span class="text-sm text-gray-700">{{ item.name }}</span>
                  <span class="text-sm text-gray-500">{{ item.quantity }}{{ item.unit }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-6 text-sm text-gray-500">
                <span>申请人: {{ request.requester }}</span>
                <span>预计金额: ¥{{ request.items.reduce((sum, item) => sum + item.estimatedCost, 0).toLocaleString() }}</span>
              </div>
              <div v-if="request.status === 'pending'" class="flex space-x-2">
                <button
                  @click="handleApprove(request.id)"
                  class="px-4 py-2 bg-success-100 text-success-600 font-medium rounded-lg hover:bg-success-200 transition-colors"
                >
                  批准
                </button>
                <button
                  @click="handleReject(request.id)"
                  class="px-4 py-2 bg-danger-100 text-danger-600 font-medium rounded-lg hover:bg-danger-200 transition-colors"
                >
                  拒绝
                </button>
              </div>
            </div>
            
            <div v-if="request.approvalHistory.length > 0" class="mt-4 pt-4 border-t border-gray-200">
              <p class="text-xs text-gray-500 mb-2">审批历史:</p>
              <div class="flex flex-wrap gap-3">
                <span
                  v-for="history in request.approvalHistory"
                  :key="history.id"
                  class="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                >
                  {{ formatTime(history.time) }} - {{ history.operator }}: {{ history.action }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredRequests.length === 0" class="text-center py-12">
        <span class="text-4xl">📦</span>
        <p class="mt-4 text-gray-500">没有找到采购申请记录</p>
      </div>
    </main>
  </div>
</template>
