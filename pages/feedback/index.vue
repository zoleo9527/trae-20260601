<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFeedback } from '~/composables/useFeedback'
import type { Feedback, FeedbackStatus, Role } from '~/types'

const {
  feedbacks,
  selectFeedback,
  openTransferModal,
  getStatusLabel,
  getRoleLabel,
  availableActions
} = useFeedback()

const activeTab = ref<FeedbackStatus | 'all'>('all')
const searchQuery = ref('')
const selectedType = ref<string>('all')
const selectedRole = ref<Role | 'all'>('all')

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'guide_processing', label: '展教员处理' },
  { key: 'engineer_processing', label: '工程师处理' },
  { key: 'activity_processing', label: '活动老师处理' },
  { key: 'resolved', label: '已解决' },
  { key: 'closed', label: '已关闭' }
]

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'suggestion', label: '建议' },
  { value: 'complaint', label: '投诉' },
  { value: 'question', label: '咨询' },
  { value: 'praise', label: '表扬' },
  { value: 'fault', label: '故障' }
]

const roleOptions = [
  { value: 'all', label: '全部角色' },
  { value: 'guide', label: '展教员' },
  { value: 'engineer', label: '设备工程师' },
  { value: 'activity_teacher', label: '活动老师' }
]

const filteredFeedbacks = computed(() => {
  let result = feedbacks.value
  
  if (activeTab.value !== 'all') {
    result = result.filter(f => f.status === activeTab.value)
  }
  
  if (selectedType.value !== 'all') {
    result = result.filter(f => f.type === selectedType.value)
  }
  
  if (selectedRole.value !== 'all') {
    result = result.filter(f => f.currentRole === selectedRole.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(f => 
      f.title.toLowerCase().includes(query) || 
      f.content.toLowerCase().includes(query) ||
      f.visitorName.toLowerCase().includes(query) ||
      f.currentAssignee.toLowerCase().includes(query)
    )
  }
  
  return result
})

const typeLabels: Record<string, string> = {
  suggestion: '建议',
  complaint: '投诉',
  question: '咨询',
  praise: '表扬',
  fault: '故障'
}

const typeColors: Record<string, string> = {
  suggestion: 'badge-info',
  complaint: 'badge-danger',
  question: 'badge-warning',
  praise: 'badge-success',
  fault: 'badge-danger'
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

const handleClick = (feedback: Feedback) => {
  selectFeedback(feedback)
}

const handleQuickTransfer = (e: Event, feedback: Feedback) => {
  e.stopPropagation()
  openTransferModal(feedback.id)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">观众反馈处理</h1>
      <button class="btn btn-primary">
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          新建反馈
        </span>
      </button>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="rs in [
          { role: 'guide', name: '展教员', count: feedbacks.filter(f => f.currentRole === 'guide' && !['resolved','closed'].includes(f.status)).length },
          { role: 'engineer', name: '设备工程师', count: feedbacks.filter(f => f.currentRole === 'engineer' && !['resolved','closed'].includes(f.status)).length },
          { role: 'activity_teacher', name: '活动老师', count: feedbacks.filter(f => f.currentRole === 'activity_teacher' && !['resolved','closed'].includes(f.status)).length },
          { role: 'all', name: '已解决', count: feedbacks.filter(f => f.status === 'resolved' || f.status === 'closed').length }
        ]"
        :key="rs.role"
        class="card p-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            :class="{
              'bg-blue-100': rs.role === 'guide',
              'bg-orange-100': rs.role === 'engineer',
              'bg-green-100': rs.role === 'activity_teacher',
              'bg-gray-100': rs.role === 'all'
            }"
          >
            <svg
              class="w-5 h-5"
              :class="{
                'text-blue-600': rs.role === 'guide',
                'text-orange-600': rs.role === 'engineer',
                'text-green-600': rs.role === 'activity_teacher',
                'text-gray-600': rs.role === 'all'
              }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path v-if="rs.role === 'guide'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              <path v-if="rs.role === 'engineer'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path v-if="rs.role === 'engineer'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path v-if="rs.role === 'activity_teacher'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              <path v-if="rs.role === 'all'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ rs.count }}</p>
            <p class="text-xs text-gray-500">{{ rs.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="border-b border-gray-100">
        <nav class="flex gap-6 px-5 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key as typeof activeTab"
            class="py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
            :class="activeTab === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >
            {{ tab.label }}
            <span
              v-if="tab.key !== 'all'"
              class="ml-1.5 px-2 py-0.5 text-xs rounded-full"
              :class="activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ feedbacks.filter(f => f.status === tab.key).length }}
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
              placeholder="搜索反馈内容、访客、处理人..."
              class="w-full h-9 pl-10 pr-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          
          <select
            v-model="selectedType"
            class="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>

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
          v-for="feedback in filteredFeedbacks"
          :key="feedback.id"
          class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          @click="handleClick(feedback)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <h4 class="text-sm font-medium text-gray-900 truncate">{{ feedback.title }}</h4>
                <span class="badge" :class="typeColors[feedback.type]">{{ typeLabels[feedback.type] }}</span>
                <span class="px-1.5 py-0.5 text-xs rounded font-medium" :class="priorityColors[feedback.priority]">
                  {{ priorityLabels[feedback.priority] }}
                </span>
                <span class="px-2 py-0.5 text-xs rounded" :class="roleColors[feedback.currentRole]">
                  {{ getRoleLabel(feedback.currentRole) }} · {{ feedback.currentAssignee }}
                </span>
              </div>
              <p class="text-sm text-gray-600 line-clamp-1 mb-2">{{ feedback.content }}</p>
              <div class="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  {{ feedback.visitorName }}
                </span>
                <span v-if="feedback.exhibitionName" class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  {{ feedback.exhibitionName }}
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ feedback.createdAt }}
                </span>
                <span v-if="feedback.tasks.length > 0" class="flex items-center gap-1 text-primary-600">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                  {{ feedback.tasks.length }}个整改任务
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="badge" :class="statusColors[feedback.status]">{{ getStatusLabel(feedback.status) }}</span>
              <button
                v-if="!['resolved', 'closed'].includes(feedback.status)"
                @click="handleQuickTransfer($event, feedback)"
                class="btn btn-primary btn-xs"
              >
                流转
              </button>
            </div>
          </div>
          
          <div v-if="feedback.tags && feedback.tags.length > 0" class="flex flex-wrap gap-1.5 mt-3">
            <span
              v-for="tag in feedback.tags"
              :key="tag"
              class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        
        <div v-if="filteredFeedbacks.length === 0" class="p-12 text-center">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="text-gray-500 text-sm">暂无反馈数据</p>
        </div>
      </div>
    </div>
  </div>
</template>
