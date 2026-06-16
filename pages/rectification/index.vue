<script setup lang="ts">
import { useInspectionStore } from '~/stores/inspection'
import { ref, computed } from 'vue'

const store = useInspectionStore()

const searchQuery = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')
const assigneeFilter = ref('all')

const filteredTasks = computed(() => {
  return store.rectificationTasks.filter(task => {
    const matchesSearch = !searchQuery.value || 
      task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      task.storeName.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === 'all' || task.status === statusFilter.value
    const matchesPriority = priorityFilter.value === 'all' || task.priority === priorityFilter.value
    const matchesAssignee = assigneeFilter.value === 'all' || task.assigneeRole === assigneeFilter.value
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })
})

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

const getAssigneeLabel = (role: string) => {
  const labels: Record<string, string> = {
    store_manager: '店长',
    regional_supervisor: '区域督导',
    purchaser: '采购'
  }
  return labels[role] || role
}

const isOverdue = (deadline: string) => {
  return new Date(deadline) < new Date()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-warning-500 rounded-lg flex items-center justify-center">
              <span class="text-white text-xl">🔧</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">整改复盘</h1>
              <p class="text-sm text-gray-500">整改任务管理与复盘分析</p>
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
          <a href="/rectification" class="px-4 py-3 text-primary-600 font-medium border-b-2 border-primary-500">整改复盘</a>
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
                placeholder="搜索任务标题、门店名称..."
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
              <option value="pending">待处理</option>
              <option value="processing">进行中</option>
              <option value="completed">已完成</option>
              <option value="verified">已验收</option>
            </select>
            <select
              v-model="priorityFilter"
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">全部优先级</option>
              <option value="high">紧急</option>
              <option value="medium">中等</option>
              <option value="low">一般</option>
            </select>
            <select
              v-model="assigneeFilter"
              class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">全部负责人</option>
              <option value="store_manager">店长</option>
              <option value="regional_supervisor">区域督导</option>
              <option value="purchaser">采购</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div
            :class="[
              'px-5 py-3 border-b',
              task.status === 'pending' ? 'bg-danger-50 border-danger-100' :
              task.status === 'processing' ? 'bg-warning-50 border-warning-100' :
              task.status === 'completed' ? 'bg-primary-50 border-primary-100' :
              'bg-success-50 border-success-100'
            ]"
          >
            <div class="flex items-center justify-between">
              <span
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium',
                  getStatusColor(task.status)
                ]"
              >
                {{ getStatusLabel(task.status) }}
              </span>
              <span
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium',
                  getPriorityColor(task.priority)
                ]"
              >
                {{ getPriorityLabel(task.priority) }}
              </span>
            </div>
          </div>
          <div class="p-5">
            <h3 class="font-semibold text-gray-900 mb-2">{{ task.title }}</h3>
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ task.description }}</p>
            
            <div class="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>🏪 {{ task.storeName }}</span>
              <span>👤 {{ task.assignee }}</span>
            </div>
            
            <div class="flex items-center justify-between text-sm">
              <span :class="['flex items-center', isOverdue(task.deadline) && task.status !== 'verified' ? 'text-danger-600' : 'text-gray-500']">
                ⏰ 截止: {{ task.deadline }}
                <span v-if="isOverdue(task.deadline) && task.status !== 'verified'" class="ml-1">⚠️</span>
              </span>
              <span class="text-gray-400">{{ task.history.length }} 条记录</span>
            </div>
            
            <button
              @click="navigateTo(`/rectification/${task.id}`)"
              class="w-full mt-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredTasks.length === 0" class="text-center py-12">
        <span class="text-4xl">📋</span>
        <p class="mt-4 text-gray-500">没有找到匹配的整改任务</p>
      </div>
    </main>
  </div>
</template>
