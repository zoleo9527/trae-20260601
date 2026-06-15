<script setup lang="ts">
import { computed } from 'vue'
import type { Review } from '@/types'
import { cleaners, customers, orders } from '@/data/mockData'

const props = defineProps<{
  review: Review
}>()

const emit = defineEmits<{
  (e: 'handle', review: Review): void
}>()

const cleaner = computed(() => cleaners.find(c => c.id === props.review.cleanerId))
const customer = computed(() => customers.find(c => c.id === props.review.customerId))
const order = computed(() => orders.find(o => o.id === props.review.orderId))

const categoryLabels: Record<string, string> = {
  service: '服务内容',
  attitude: '服务态度',
  timeliness: '准时性',
  quality: '服务质量',
  other: '其他'
}

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'bg-yellow-100 text-yellow-800' },
  reviewed: { text: '已回访', color: 'bg-blue-100 text-blue-800' },
  resolved: { text: '已解决', color: 'bg-green-100 text-green-800' }
}

const starIcon = (filled: boolean) => filled ? '★' : '☆'
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
    <div class="flex justify-between items-start mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-600">订单号: {{ review.orderId }}</span>
        <span :class="['px-2 py-1 rounded-full text-xs font-medium', statusLabels[review.status].color]">
          {{ statusLabels[review.status].text }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <span v-for="i in 5" :key="i" class="text-yellow-500">{{ starIcon(i <= review.rating) }}</span>
      </div>
    </div>
    
    <div class="flex items-center gap-2 mb-2">
      <span class="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{{ categoryLabels[review.category] }}</span>
      <span class="text-sm text-gray-500">{{ review.createdAt }}</span>
    </div>
    
    <p class="text-gray-800 mb-3">{{ review.content }}</p>
    
    <div class="flex items-center justify-between text-sm text-gray-500">
      <div class="flex items-center gap-4">
        <span>客户: {{ customer?.name }} {{ customer?.phone }}</span>
        <span>阿姨: {{ cleaner?.name }} {{ cleaner?.phone }}</span>
      </div>
      <div class="text-right">
        <div>{{ order?.serviceType }}</div>
        <div>{{ order?.date }} {{ order?.startTime }}-{{ order?.endTime }}</div>
      </div>
    </div>
    
    <div class="mt-3 pt-3 border-t border-gray-100">
      <button 
        v-if="review.status === 'pending'"
        @click="emit('handle', review)"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
      >
        处理回访
      </button>
      <button 
        v-else
        @click="emit('handle', review)"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
      >
        查看详情
      </button>
    </div>
  </div>
</template>
