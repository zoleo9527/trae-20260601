<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFeedback } from '~/composables/useFeedback'
import type { TaskStatus, Role } from '~/types'

const { feedbacks, selectFeedback, updateTaskStatus, getRoleLabel, getStatusLabel } = useFeedback()

const activeTab = ref<TaskStatus | 'all'>('all')
const searchQuery = ref('')
const selectedRole = ref<Role | 'all'>('all')

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待开始' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'verified', label: '已验收' }
]

const roleOptions = [
  { value: 'all', label: '全部角色' },
  { value: 'guide', label: '展教员' },
  { value: 'engineer', label: '设备工程师' },
  { value: 'activity_teacher', label: '活动老师' }
]

const allTasks = computed(() => {
  const tasks: any[] = []
  feedbacks.value.forEach(fb => {
    fb.tasks.forEach(task => {
      tasks.push({
        ...task,
        feedbackTitle: fb.title,
        feedbackStatus: fb.status,
        feedbackId: fb.id
      })
    })
  })
  return tasks
})

const filteredTasks = computed(() => {
  let result = allTasks.value
  
  if (activeTab.value !== 'all') {
    result = result.filter(t => t.status === activeTab.value)
  }
  
  if (selectedRole.value !== 'all') {
    result = result.filter(t => t.role === selectedRole.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query) ||
      t.assignee.toLowerCase().includes(query) ||
      t.feedbackTitle.toLowerCase().includes(query)
    )
  }
  
  return result
})

const taskStatusLabels: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  verified: '已验收'
}

const taskStatusColors: Record<string, string> = {
  pending: 'badge-gray',
  in_progress: 'badge-info',
  completed: 'badge-success',
  verified: 'badge-success'
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高'
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
}

const roleColors: Record<Role, string> = {
  guide: 'bg-blue-100 text-blue-700',
  engineer: 'bg-orange-100 text-orange-700',
  activity_teacher: 'bg-green-100 text-green-700'
}

const viewFeedback = (feedbackId: string) => {
  const fb = feedbacks.value.find(f => f.id === feedbackId)
  if (fb) {
    selectFeedback(fb)
  }
}

const handleTaskStatusChange = (feedbackId: string, taskId: string, status: TaskStatus) => {
  const progress = status === 'completed' || status === 'verified' ? 100 : status === 'in_progress' ? 50 : 0
  updateTaskStatus(feedbackId, taskId, status, progress, `状态更新为${taskStatusLabels[status]}`)
}

const totalTasks = computed(() => allTasks.value.length)
const pendingTasks = computed(() => allTasks.value.filter(t => t.status === 'pending').length)
const inProgressTasks = computed(() => allTasks.value.filter(t => t.status === 'in_progress').length)
const completedTasks = computed(() => allTasks.value.filter(t => t.status === 'completed' || t.status === 'verified').length)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">整改任务跟进</h1>
        <p class="text-sm text-gray-500 mt-1">从观众反馈中生成的整改任务，支持查看关联反馈和状态更新</p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-6">
      <div class="card p-5">
        <p class="text-sm text-gray-500 mb-1">总任务数</p>
        <p class="text-2xl font-bold text-gray-900">{{ totalTasks }}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-gray-500 mb-1">待开始</p>
        <p class="text-2xl font-bold text-yellow-600">{{ pendingTasks }}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-gray-500 mb-1">进行中</p>
        <p class="text-2xl font-bold text-blue-600">{{ inProgressTasks }}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-gray-500 mb-1">已完成</p>
        <p class="text-2xl font-bold text-green-600">{{ completedTasks }}</p>
      </div>
    </div>

    <div class="card">
      <div class="border-b border-gray-100">
        <nav class="flex gap-8 px-5">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key as typeof activeTab"
            class="py-4 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >
            {{ tab.label }}
            <span
              v-if="tab.key !== 'all'"
              class="ml-1.5 px-2 py-0.5 text-xs rounded-full"
              :class="activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ allTasks.filter(t => t.status === tab.key).length }}
            </span>
          </button>
        </nav>
      </div>
      
      <div class="p-4 flex items-center justify-between gap-4 border-b border-gray-100 flex-wrap">
        <div class="flex items-center gap-3 flex-1 flex-wrap">
          <div class="relative flex-1 max-w-md">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索任务、反馈、处理人..."
              class="w-full h-9 pl-10 pr-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          
          <select
            v-model="selectedRole"
            class="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>
      
      <div class="divide-y divide-gray-100">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <h4 class="text-sm font-medium text-gray-900">{{ task.title }}</h4>
                <span class="px-1.5 py-0.5 text-xs rounded font-medium" :class="priorityColors[task.priority]">
                  {{ priorityLabels[task.priority] }}
                </span>
                <span class="px-2 py-0.5 text-xs rounded" :class="roleColors[task.role]">
                  {{ getRoleLabel(task.role) }} · {{ task.assignee }}
                </span>
              </div>
              <p class="text-sm text-gray-600 line-clamp-1 mb-2">{{ task.description }}</p>
              
              <div 
                @click="viewFeedback(task.feedbackId)"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-50 text-primary-600 rounded cursor-pointer hover:bg-primary-100 transition-colors mb-2"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                关联反馈：{{ task.feedbackTitle }}
              </div>
              
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span>创建时间：{{ task.createdAt }}</span>
                <span>截止日期：{{ task.deadline }}</span>
              </div>

              <div v-if="task.history && task.history.length > 0" class="mt-2">
                <p class="text-xs text-gray-500 mb-1">最新动态：</p>
                <div class="flex items-center gap-2 text-xs bg-gray-50 px-2 py-1 rounded">
                  <span class="text-gray-600">{{ task.history[task.history.length - 1].assignee }}</span>
                  <span class="text-gray-400">→</span>
                  <span class="text-gray-700">{{ task.history[task.history.length - 1].remark }}</span>
                  <span class="text-gray-400 ml-auto">{{ task.history[task.history.length - 1].createdAt }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex flex-col items-end gap-2 shrink-0">
              <span class="badge" :class="taskStatusColors[task.status]">{{ taskStatusLabels[task.status] }}</span>
              
              <div class="w-24">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>进度</span>
                  <span>{{ task.progress }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    class="bg-primary-500 h-1.5 rounded-full transition-all"
                    :style="{ width: task.progress + '%' }"
                  ></div>
                </div>
              </div>

              <div v-if="task.status !== 'completed' && task.status !== 'verified'" class="flex gap-2">
                <button
                  v-if="task.status === 'pending'"
                  @click="handleTaskStatusChange(task.feedbackId, task.id, 'in_progress')"
                  class="btn btn-primary btn-xs"
                >
                  开始
                </button>
                <button
                  v-if="task.status === 'in_progress'"
                  @click="handleTaskStatusChange(task.feedbackId, task.id, 'completed')"
                  class="btn btn-success btn-xs"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="filteredTasks.length === 0" class="p-12 text-center">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
          <p class="text-gray-500 text-sm">暂无整改任务</p>
        </div>
      </div>
    </div>
  </div>
</template>
