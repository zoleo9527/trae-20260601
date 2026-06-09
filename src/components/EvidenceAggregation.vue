<template>
  <div v-if="!order.feeAdjustment" class="p-6 text-center text-gray-400">
    暂无费用调整记录
  </div>
  <div v-else class="grid grid-cols-3 gap-4">
    <div class="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-[#E2E8F0] bg-[#F7F9FC]">
        <FileText :size="16" class="text-[#1B4965]" />
        <span class="text-sm font-medium text-[#1B4965]">原始售后信息</span>
      </div>
      <div class="p-4 space-y-3">
        <div v-for="f in fields" :key="f.label" class="flex flex-col gap-0.5">
          <span class="text-xs text-gray-400">{{ f.label }}</span>
          <span class="text-sm text-gray-700">{{ f.value }}</span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-[#E2E8F0] bg-[#F7F9FC]">
        <Camera :size="16" class="text-[#1B4965]" />
        <span class="text-sm font-medium text-[#1B4965]">退回凭证</span>
      </div>
      <div class="p-4 space-y-3">
        <p class="text-sm text-gray-600">{{ order.feeAdjustment.evidenceSummary }}</p>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="(thumb, i) in order.feeAdjustment.screenshotThumbnails"
            :key="i"
            class="aspect-square bg-gray-100 rounded border border-[#E2E8F0] flex flex-col items-center justify-center gap-1"
          >
            <ImageIcon :size="24" class="text-gray-400" />
            <span class="text-xs text-gray-400 truncate max-w-[80%]">{{ thumb }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-[#E2E8F0] bg-[#F7F9FC]">
        <MessageSquare :size="16" class="text-[#1B4965]" />
        <span class="text-sm font-medium text-[#1B4965]">沟通截图摘要</span>
      </div>
      <div class="p-4 space-y-3">
        <div
          v-for="(msg, i) in order.chatMessages"
          :key="i"
          class="bg-[#F7F9FC] rounded-lg p-3"
        >
          <span class="text-xs font-medium text-[#1B4965]">{{ msg.role }}: </span>
          <span class="text-sm text-gray-600">{{ msg.content }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileText, Camera, MessageSquare, Image as ImageIcon } from 'lucide-vue-next'
import type { Order } from '@/types'

const props = defineProps<{ order: Order }>()

const fields = computed(() => [
  { label: '订单编号', value: props.order.orderNo },
  { label: '客户名称', value: props.order.customerName },
  { label: '产品名称', value: props.order.productName },
  { label: '退货原因', value: props.order.returnReason },
  { label: '责任方', value: props.order.responsibleParty },
  { label: '退换类型', value: props.order.returnType === 'return' ? '退货' : '换货' },
])
</script>
