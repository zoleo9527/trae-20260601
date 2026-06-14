<template>
  <div class="space-y-3">
    <div v-if="records.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div>
            <p class="text-xs text-blue-600">跟进次数</p>
            <p class="text-2xl font-bold text-blue-700">{{ records.length }}</p>
          </div>
          <div>
            <p class="text-xs text-blue-600">最新跟进</p>
            <p class="text-sm font-medium text-blue-700">{{ formatDate(records[records.length - 1].time) }}</p>
          </div>
          <div>
            <p class="text-xs text-blue-600">当前状态</p>
            <span :class="getResultClass(records[records.length - 1].result)" class="px-2 py-1 rounded text-xs font-medium">
              {{ getResultLabel(records[records.length - 1].result) }}
            </span>
          </div>
        </div>
        <div v-if="hasOverdueFollowups" class="flex items-center gap-2 text-red-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="text-sm font-medium">有逾期跟进</span>
        </div>
      </div>
    </div>

    <div
      v-for="(record, index) in records"
      :key="record.id"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-2">
          <span :class="getMethodClass(record.method)" class="px-2 py-1 rounded text-xs font-medium">
            {{ getMethodLabel(record.method) }}
          </span>
          <span :class="getResultClass(record.result)" class="px-2 py-1 rounded text-xs font-medium">
            {{ getResultLabel(record.result) }}
          </span>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900">{{ record.operator.name }}</p>
          <p class="text-xs text-gray-500">{{ formatTime(record.time) }}</p>
        </div>
      </div>

      <div class="mb-3">
        <p class="text-xs text-gray-600 mb-1">客户信息：</p>
        <p class="text-sm text-gray-900">{{ record.customerInfo }}</p>
      </div>

      <div class="bg-gray-50 rounded-lg p-3">
        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ record.content }}</p>
      </div>

      <div v-if="record.nextFollowupTime" class="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
        <div class="flex items-center text-xs text-gray-600">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          下次跟进：
          <span :class="isOverdue(record.nextFollowupTime) ? 'text-red-600 font-medium' : ''">
            {{ formatDate(record.nextFollowupTime) }}
          </span>
        </div>
        <span v-if="isOverdue(record.nextFollowupTime)" class="text-xs text-red-600 font-medium">
          已逾期
        </span>
      </div>

      <div v-if="record.attachments && record.attachments.length > 0" class="mt-3 pt-3 border-t border-gray-200">
        <div class="flex items-center gap-2">
          <div
            v-for="attachment in record.attachments"
            :key="attachment.id"
            class="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            📎 {{ attachment.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FollowupRecord } from '@/types'

const props = defineProps<{
  records: FollowupRecord[]
}>()

const hasOverdueFollowups = computed(() => {
  return props.records.some(record => 
    record.nextFollowupTime && isOverdue(record.nextFollowupTime)
  )
})

const getMethodLabel = (method: string) => {
  const map: Record<string, string> = {
    phone: '电话',
    wechat: '微信',
    visit: '面谈'
  }
  return map[method] || method
}

const getMethodClass = (method: string) => {
  const map: Record<string, string> = {
    phone: 'bg-blue-100 text-blue-800',
    wechat: 'bg-green-100 text-green-800',
    visit: 'bg-purple-100 text-purple-800'
  }
  return map[method] || 'bg-gray-100 text-gray-800'
}

const getResultLabel = (result: string) => {
  const map: Record<string, string> = {
    pending: '待联系',
    interested: '有意向',
    negotiating: '谈判中',
    success: '成交',
    failed: '失败'
  }
  return map[result] || result
}

const getResultClass = (result: string) => {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    interested: 'bg-blue-100 text-blue-800',
    negotiating: 'bg-orange-100 text-orange-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }
  return map[result] || 'bg-gray-100 text-gray-800'
}

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOverdue = (dateStr: string) => {
  return new Date(dateStr) < new Date()
}
</script>
