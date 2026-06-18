<script setup lang="ts">
import { computed } from 'vue'
import type { Compensation } from '@/types'
import { useReviewsStore } from '@/stores/reviews'
import { reviews, cleaners, customers, orders, roleLabels, followUps } from '@/data/mockData'

const store = useReviewsStore()

const compensationList = computed(() => {
  return store.compensations.value.map(compensation => {
    const review = reviews.find(r => r.id === compensation.reviewId)
    const cleaner = cleaners.find(c => c.id === review?.cleanerId)
    const customer = customers.find(c => c.id === review?.customerId)
    const order = orders.find(o => o.id === review?.orderId)
    
    const relatedFollowUps = followUps.filter(f => f.reviewId === compensation.reviewId)
    const mainFollowUp = relatedFollowUps.find(f => f.id === compensation.followUpId)
    
    return {
      ...compensation,
      review,
      cleaner,
      customer,
      order,
      mainFollowUp,
      relatedFollowUps
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

const followUpStatusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'bg-yellow-100 text-yellow-800' },
  processing: { text: '处理中', color: 'bg-blue-100 text-blue-800' },
  completed: { text: '已完成', color: 'bg-green-100 text-green-800' }
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

const roleOrder = ['customer_service', 'cleaner', 'quality_manager']
const getRoleOrder = (role: string) => roleOrder.indexOf(role)
</script>

<template>
  <div class="space-y-6">
    <div 
      v-for="item in compensationList" 
      :key="item.id" 
      class="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-600">补偿ID: {{ item.id }}</span>
            <span :class="['px-3 py-1 rounded-full text-xs font-medium', statusLabels[item.status].color]">
              {{ statusLabels[item.status].text }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-white rounded-full text-sm font-medium">{{ compensationTypes[item.type] }}</span>
            <span class="text-xl font-bold text-red-500">¥{{ item.amount }}</span>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-4 gap-4 mb-6 text-sm">
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-500 mb-1">客户信息</div>
            <div class="font-medium">{{ item.customer?.name }} {{ item.customer?.phone }}</div>
            <div class="text-gray-500 text-xs">{{ item.customer?.address }}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-500 mb-1">服务阿姨</div>
            <div class="font-medium">{{ item.cleaner?.name }} {{ item.cleaner?.phone }}</div>
            <div class="text-gray-500 text-xs">评分: {{ item.cleaner?.rating }} | 订单数: {{ item.cleaner?.completedOrders }}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-500 mb-1">服务信息</div>
            <div class="font-medium">{{ item.order?.serviceType }}</div>
            <div class="text-gray-500 text-xs">{{ item.order?.date }} {{ item.order?.startTime }}-{{ item.order?.endTime }}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-500 mb-1">差评评分</div>
            <div class="flex items-center gap-1">
              <span v-for="i in 5" :key="i" class="text-yellow-500">{{ i <= (item.review?.rating || 0) ? '★' : '☆' }}</span>
            </div>
            <div class="text-gray-500 text-xs line-clamp-2 mt-1">{{ item.review?.content }}</div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-600 mb-3">处理流程</h3>
          <div class="flex items-center gap-2">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">1</div>
              <span class="ml-2 text-sm">客户投诉</span>
            </div>
            <div class="h-0.5 flex-1 bg-gray-300 relative">
              <div 
                class="absolute inset-y-0 left-0 bg-blue-500 transition-all"
                :style="{ width: '100%' }"
              ></div>
            </div>
            <div class="flex items-center">
              <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">2</div>
              <span class="ml-2 text-sm">客服回访</span>
            </div>
            <div class="h-0.5 flex-1 bg-gray-300 relative">
              <div 
                class="absolute inset-y-0 left-0 bg-green-500 transition-all"
                :style="{ width: item.relatedFollowUps.some(f => f.submittedByRole === 'customer_service') ? '100%' : '0%' }"
              ></div>
            </div>
            <div class="flex items-center">
              <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">3</div>
              <span class="ml-2 text-sm">家政员确认</span>
            </div>
            <div class="h-0.5 flex-1 bg-gray-300 relative">
              <div 
                class="absolute inset-y-0 left-0 bg-orange-500 transition-all"
                :style="{ width: item.relatedFollowUps.some(f => f.submittedByRole === 'cleaner') ? '100%' : '0%' }"
              ></div>
            </div>
            <div class="flex items-center">
              <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">4</div>
              <span class="ml-2 text-sm">质检审批</span>
            </div>
            <div class="h-0.5 flex-1 bg-gray-300 relative">
              <div 
                class="absolute inset-y-0 left-0 bg-purple-500 transition-all"
                :style="{ width: item.status === 'approved' || item.status === 'processed' ? '100%' : '0%' }"
              ></div>
            </div>
            <div class="flex items-center">
              <div class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">5</div>
              <span class="ml-2 text-sm">补偿执行</span>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-600 mb-3">责任链记录</h3>
          <div class="space-y-3">
            <div 
              v-for="(followUp, index) in item.relatedFollowUps.sort((a, b) => getRoleOrder(a.submittedByRole) - getRoleOrder(b.submittedByRole))" 
              :key="followUp.id"
              class="border-l-4 pl-4 py-3 rounded-r-lg"
              :class="[
                followUp.submittedByRole === 'customer_service' ? 'border-blue-500 bg-blue-50' :
                followUp.submittedByRole === 'cleaner' ? 'border-green-500 bg-green-50' :
                'border-purple-500 bg-purple-50'
              ]"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700">{{ followUp.submittedBy }}</span>
                    <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', roleLabels[followUp.submittedByRole]?.color]">
                      {{ roleLabels[followUp.submittedByRole]?.text }}
                    </span>
                    <span v-if="followUp.id === item.followUpId" class="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      关键判断
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">{{ followUp.submittedAt }}</div>
                  <div class="text-sm text-gray-600 mt-2">{{ followUp.content }}</div>
                  <div class="flex items-center gap-2 mt-2 text-xs">
                    <span class="text-gray-500">处理方式:</span>
                    <span :class="[
                      'px-2 py-0.5 rounded',
                      followUp.submittedByRole === 'customer_service' ? 'bg-blue-100 text-blue-700' :
                      followUp.submittedByRole === 'cleaner' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    ]">{{ followUp.actionTaken }}</span>
                  </div>
                </div>
                <div class="text-xs text-gray-400">步骤{{ index + 1 }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="item.mainFollowUp" class="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-yellow-600 font-medium">关键判断</span>
            <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', roleLabels[item.mainFollowUp.submittedByRole]?.color]">
              {{ roleLabels[item.mainFollowUp.submittedByRole]?.text }} - {{ item.mainFollowUp.submittedBy }}
            </span>
          </div>
          <div class="text-sm text-gray-700">{{ item.mainFollowUp.content }}</div>
          <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>处理方式: {{ item.mainFollowUp.actionTaken }}</span>
            <span>|</span>
            <span>记录时间: {{ item.mainFollowUp.submittedAt }}</span>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="text-sm font-medium text-gray-600 mb-1">补偿说明</div>
              <p class="text-sm text-gray-700">{{ item.description }}</p>
            </div>
            <div class="text-right ml-4">
              <div class="text-sm text-gray-500">申请时间: {{ item.createdAt }}</div>
              <div v-if="item.approvedBy" class="text-sm text-gray-500">审批人: {{ item.approvedBy }}</div>
              <div v-if="item.approvedAt" class="text-sm text-gray-500">审批时间: {{ item.approvedAt }}</div>
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <button 
              v-if="item.status === 'pending'"
              @click="handleApprove(item.id)"
              class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
            >
              批准补偿
            </button>
            <button 
              v-if="item.status === 'pending'"
              @click="handleReject(item.id)"
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              拒绝申请
            </button>
            <button 
              v-if="item.status === 'approved'"
              @click="handleProcess(item.id)"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              执行补偿
            </button>
            <button 
              v-if="item.status === 'processed'"
              disabled
              class="px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed text-sm"
            >
              已完成
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="compensationList.length === 0" class="text-center py-12 text-gray-500">
      <div class="text-4xl mb-4">📋</div>
      <div>暂无补偿记录</div>
    </div>
  </div>
</template>
