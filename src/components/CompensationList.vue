<script setup lang="ts">
import { computed } from 'vue'
import type { Compensation } from '@/types'
import { useReviewsStore } from '@/stores/reviews'
import { reviews, cleaners, customers } from '@/data/mockData'

const store = useReviewsStore()

const compensationList = computed(() => {
  return store.compensations.value.map(compensation => {
    const review = reviews.find(r => r.id === compensation.reviewId)
    const cleaner = cleaners.find(c => c.id === review?.cleanerId)
    const customer = customers.find(c => c.id === review?.customerId)
    return {
      ...compensation,
      review,
      cleaner,
      customer
    }
  })
})

const compensationTypes: Record<string, string> = {
  refund: '退款',
  discount: '折扣券',
  service: '免费服务',
  gift: '礼品'
}

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: '待审批', color: 'bg-yellow-100 text-yellow-800' },
  approved: { text: '已批准', color: 'bg-green-100 text-green-800' },
  rejected: { text: '已拒绝', color: 'bg-red-100 text-red-800' },
  processed: { text: '已处理', color: 'bg-blue-100 text-blue-800' }
}

const handleApprove = (compensationId: string) => {
  store.approveCompensation(compensationId, '质检主管刘')
}

const handleReject = (compensationId: string) => {
  store.rejectCompensation(compensationId)
}

const handleProcess = (compensationId: string) => {
  store.processCompensation(compensationId)
}
</script>

<template>
  <div class="space-y-4">
    <div 
      v-for="item in compensationList" 
      :key="item.id" 
      class="bg-white rounded-lg shadow-md p-4"
    >
      <div class="flex justify-between items-start mb-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-600">补偿ID: {{ item.id }}</span>
          <span :class="['px-2 py-1 rounded-full text-xs font-medium', statusLabels[item.status].color]">
            {{ statusLabels[item.status].text }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 bg-gray-100 rounded text-xs">{{ compensationTypes[item.type] }}</span>
          <span class="text-lg font-semibold text-red-500">¥{{ item.amount }}</span>
        </div>
      </div>
      
      <div class="grid grid-cols-3 gap-4 mb-3 text-sm">
        <div>
          <span class="text-gray-500">客户:</span>
          <span class="ml-2">{{ item.customer?.name }}</span>
        </div>
        <div>
          <span class="text-gray-500">阿姨:</span>
          <span class="ml-2">{{ item.cleaner?.name }}</span>
        </div>
        <div>
          <span class="text-gray-500">差评内容:</span>
          <span class="ml-2 line-clamp-1">{{ item.review?.content }}</span>
        </div>
      </div>
      
      <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div class="flex items-center gap-4">
          <span>申请时间: {{ item.createdAt }}</span>
          <span v-if="item.approvedBy">审批人: {{ item.approvedBy }}</span>
          <span v-if="item.approvedAt">审批时间: {{ item.approvedAt }}</span>
        </div>
      </div>
      
      <div class="text-sm text-gray-700 mb-3">{{ item.description }}</div>
      
      <div class="flex gap-2">
        <button 
          v-if="item.status === 'pending'"
          @click="handleApprove(item.id)"
          class="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
        >
          批准
        </button>
        <button 
          v-if="item.status === 'pending'"
          @click="handleReject(item.id)"
          class="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
        >
          拒绝
        </button>
        <button 
          v-if="item.status === 'approved'"
          @click="handleProcess(item.id)"
          class="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
        >
          执行补偿
        </button>
      </div>
    </div>
    
    <div v-if="compensationList.length === 0" class="text-center py-12 text-gray-500">
      暂无补偿记录
    </div>
  </div>
</template>
