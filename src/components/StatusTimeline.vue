<template>
  <div class="space-y-0">
    <div
      v-for="(event, index) in timeline"
      :key="event.id"
      class="relative flex"
      :class="{ 'pb-4': index < timeline.length - 1 }"
    >
      <div class="flex flex-col items-center">
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center z-10',
            getEventIconBg(event.type)
          ]"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="event.type === 'status_change'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              v-else-if="event.type === 'handover'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
            <path
              v-else-if="event.type === 'pricing'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div
          v-if="index < timeline.length - 1"
          class="w-0.5 h-full bg-gray-200 my-2"
        ></div>
      </div>

      <div class="ml-4 flex-1 pb-4">
        <div class="flex items-start justify-between mb-2">
          <div>
            <StatusBadge :status="event.status" />
            <p class="text-xs text-gray-500 mt-1">{{ formatTime(event.time) }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900">{{ event.operator.name }}</p>
            <p class="text-xs text-gray-500">{{ getRoleLabel(event.operator.role) }}</p>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ event.remark }}</p>

          <div v-if="event.type === 'handover' && event.toUser" class="mt-2 pt-2 border-t border-gray-200">
            <p class="text-xs text-gray-600">
              <span class="font-medium">{{ event.operator.name }}</span>
              移交给
              <span class="font-medium">{{ event.toUser.name }}</span>
            </p>
          </div>

          <div v-if="event.data" class="mt-2 pt-2 border-t border-gray-200">
            <div v-if="event.data.purchasePrice" class="text-xs text-gray-600 space-y-1">
              <p>收车价：<span class="font-medium text-blue-600">¥{{ formatPrice(event.data.purchasePrice) }}</span></p>
              <p v-if="event.data.suggestedPrice">建议售价：<span class="font-medium text-green-600">¥{{ formatPrice(event.data.suggestedPrice) }}</span></p>
              <p v-if="event.data.finalPrice">最终定价：<span class="font-medium text-green-600">¥{{ formatPrice(event.data.finalPrice) }}</span></p>
            </div>
          </div>

          <div v-if="event.attachments && event.attachments.length > 0" class="mt-2 pt-2 border-t border-gray-200">
            <div class="flex items-center gap-2">
              <div
                v-for="attachment in event.attachments"
                :key="attachment.id"
                class="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                📎 {{ attachment.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimelineEvent } from '@/types'
import StatusBadge from './StatusBadge.vue'

defineProps<{
  timeline: TimelineEvent[]
}>()

const getEventIconBg = (type: string) => {
  const bgMap: Record<string, string> = {
    status_change: 'bg-blue-500',
    handover: 'bg-purple-500',
    pricing: 'bg-green-500'
  }
  return bgMap[type] || 'bg-gray-500'
}

const getRoleLabel = (role: string) => {
  const roleMap: Record<string, string> = {
    collector: '收车经理',
    evaluator: '评估师',
    finance: '金融专员',
    sales: '销售顾问'
  }
  return roleMap[role] || role
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

const formatPrice = (price: number) => {
  return price.toLocaleString('zh-CN')
}
</script>
