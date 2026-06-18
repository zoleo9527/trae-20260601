<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
    <div class="bg-white h-full w-full max-w-2xl shadow-xl flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 class="text-xl font-bold text-gray-900">异常记录管理</h2>
          <p class="text-sm text-gray-500 mt-1">查看和处理系统异常</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center space-x-4 mb-6">
            <button
              v-for="filter in filters"
              :key="filter.value"
              @click="activeFilter = filter.value"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              {{ filter.label }}
              <span v-if="getFilterCount(filter.value) > 0" class="ml-1 bg-white text-primary-600 text-xs px-2 py-0.5 rounded-full">
                {{ getFilterCount(filter.value) }}
              </span>
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-for="exception in filteredExceptions"
              :key="exception.id"
              class="card hover:shadow-md transition-shadow"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-4">
                  <div :class="getPriorityIconClass(exception.priority)" class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExclamationCircleIcon class="w-5 h-5 text-white" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900">{{ exception.exceptionType }}</span>
                      <span :class="getStatusBadgeClass(exception.status)">{{ getStatusLabel(exception.status) }}</span>
                      <span :class="getPriorityBadgeClass(exception.priority)">{{ getPriorityLabel(exception.priority) }}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ exception.description }}</p>
                    <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>关联编号: <span class="font-medium text-primary-600">{{ exception.relatedNo }}</span></span>
                      <span>创建时间: {{ formatDateTime(exception.createdAt) }}</span>
                      <span>创建人: {{ exception.createdBy }}</span>
                    </div>
                  </div>
                </div>
                <button
                  @click="handleResolve(exception)"
                  :disabled="exception.status === 'resolved'"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    exception.status === 'resolved'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  ]"
                >
                  {{ exception.status === 'resolved' ? '已解决' : '标记解决' }}
                </button>
              </div>
            </div>

            <div v-if="filteredExceptions.length === 0" class="text-center py-12">
              <InboxIcon class="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p class="text-gray-500">暂无{{ filters.find(f => f.value === activeFilter)?.label }}异常</p>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            共 {{ props.exceptions.length }} 条异常记录
          </div>
          <button class="btn-secondary text-sm" @click="handleExport">
            <ArrowDownTrayIcon class="w-4 h-4 inline mr-1" />
            导出 (模拟)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  XMarkIcon,
  ExclamationCircleIcon,
  InboxIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import type { ExceptionRecord } from '~/types'

const props = defineProps<{
  exceptions: ExceptionRecord[]
}>()

const emit = defineEmits<{
  close: []
  refresh: []
}>()

const activeFilter = ref('all')

const filters = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'open' },
  { label: '处理中', value: 'handling' },
  { label: '已解决', value: 'resolved' }
]

const filteredExceptions = computed(() => {
  if (activeFilter.value === 'all') {
    return props.exceptions
  }
  return props.exceptions.filter(e => e.status === activeFilter.value)
})

function getFilterCount(status: string) {
  if (status === 'all') return props.exceptions.length
  return props.exceptions.filter(e => e.status === status).length
}

function getPriorityIconClass(priority: string) {
  const classMap: Record<string, string> = {
    urgent: 'bg-red-600',
    high: 'bg-orange-600',
    medium: 'bg-yellow-600',
    low: 'bg-blue-600'
  }
  return classMap[priority] || 'bg-gray-600'
}

function getStatusBadgeClass(status: string) {
  const classMap: Record<string, string> = {
    open: 'badge-error',
    handling: 'badge-warning',
    resolved: 'badge-success'
  }
  return classMap[status] || 'badge-info'
}

function getPriorityBadgeClass(priority: string) {
  const classMap: Record<string, string> = {
    urgent: 'badge-error',
    high: 'badge-warning',
    medium: 'badge-info',
    low: 'badge-success'
  }
  return classMap[priority] || 'badge-info'
}

function getStatusLabel(status: string) {
  const labelMap: Record<string, string> = {
    open: '待处理',
    handling: '处理中',
    resolved: '已解决'
  }
  return labelMap[status] || status
}

function getPriorityLabel(priority: string) {
  const labelMap: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labelMap[priority] || priority
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.slice(0, 16).replace('T', ' ')
}

function handleResolve(exception: ExceptionRecord) {
  if (exception.status === 'resolved') return
  exception.status = 'resolved'
  alert('异常已标记为已解决')
  emit('refresh')
}

function handleExport() {
  alert('导出功能为模拟实现,实际将导出Excel文件')
}
</script>