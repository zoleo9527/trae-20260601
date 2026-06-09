<script setup lang="ts">
import { ref, computed } from 'vue'
import { DollarSign, FileText, Camera, MessageSquare, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { FeeAdjustment } from '@/types'
import { FEE_STATUS_LABELS } from '@/types'
import { useOrdersStore } from '@/stores/orders'

const props = defineProps<{ feeAdjustment: FeeAdjustment; orderId: string }>()
const emit = defineEmits<{ viewEvidence: [] }>()

const ordersStore = useOrdersStore()
const expanded = ref(true)
const evidenceExpanded = ref(false)

const order = computed(() => ordersStore.orders.find(o => o.id === props.orderId))

const statusColor: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
}
</script>

<template>
  <div class="border border-[#E2E8F0] rounded-lg overflow-hidden">
    <button
      class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
      @click.stop="expanded = !expanded"
    >
      <DollarSign :size="14" class="text-[#E8871E]" />
      <span class="font-medium text-[#1B4965]">费用调整</span>
      <span
        class="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
        :class="statusColor[feeAdjustment.status]"
      >
        {{ FEE_STATUS_LABELS[feeAdjustment.status] }}
      </span>
      <component :is="expanded ? ChevronUp : ChevronDown" :size="14" class="text-gray-400" />
    </button>
    <div v-if="expanded" class="px-3 py-2 bg-gray-50 text-sm space-y-2" @click.stop>
      <div class="flex justify-between">
        <span class="text-gray-500">调整金额</span>
        <span class="font-semibold text-[#E8871E]">
          ¥{{ feeAdjustment.adjustAmount.toFixed(2) }}
        </span>
      </div>
      <div>
        <span class="text-gray-500">调整原因</span>
        <p class="text-gray-700 mt-0.5">{{ feeAdjustment.adjustReason }}</p>
      </div>
      <div>
        <span class="text-gray-500">依据摘要</span>
        <p class="text-gray-700 mt-0.5">{{ feeAdjustment.evidenceSummary }}</p>
      </div>
      <button
        class="w-full flex items-center gap-1.5 text-[#1B4965] hover:underline text-xs font-medium mt-1"
        @click.stop="evidenceExpanded = !evidenceExpanded"
      >
        <FileText :size="12" />
        {{ evidenceExpanded ? '收起完整依据' : '展开完整依据（无需跳转）' }}
      </button>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="evidenceExpanded && order" class="mt-2 grid grid-cols-3 gap-2 bg-white rounded-lg border border-[#E2E8F0] p-2">
          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5 text-xs font-medium text-[#1B4965] border-b border-[#E2E8F0] pb-1">
              <FileText :size="12" />
              原始售后信息
            </div>
            <div class="text-xs space-y-1">
              <div><span class="text-gray-400">单号：</span><span class="text-gray-700">{{ order.orderNo }}</span></div>
              <div><span class="text-gray-400">客户：</span><span class="text-gray-700">{{ order.customerName }}</span></div>
              <div><span class="text-gray-400">产品：</span><span class="text-gray-700">{{ order.productName }}</span></div>
              <div><span class="text-gray-400">原因：</span><span class="text-gray-700">{{ order.returnReason }}</span></div>
              <div><span class="text-gray-400">责任：</span><span class="text-gray-700">{{ order.responsibleParty }}</span></div>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5 text-xs font-medium text-[#1B4965] border-b border-[#E2E8F0] pb-1">
              <Camera :size="12" />
              退回凭证
            </div>
            <div class="text-xs text-gray-600 mb-1">{{ feeAdjustment.evidenceSummary }}</div>
            <div class="grid grid-cols-2 gap-1">
              <div
                v-for="(thumb, i) in feeAdjustment.screenshotThumbnails"
                :key="i"
                class="aspect-square bg-gray-100 rounded border border-[#E2E8F0] flex flex-col items-center justify-center gap-0.5"
              >
                <ImageIcon :size="16" class="text-gray-400" />
                <span class="text-[10px] text-gray-400 truncate max-w-[80%]">{{ thumb }}</span>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5 text-xs font-medium text-[#1B4965] border-b border-[#E2E8F0] pb-1">
              <MessageSquare :size="12" />
              沟通截图摘要
            </div>
            <div class="space-y-1">
              <div
                v-for="(msg, i) in order.chatMessages"
                :key="i"
                class="bg-[#F7F9FC] rounded px-2 py-1"
              >
                <span class="text-[10px] font-medium text-[#1B4965]">{{ msg.role }}: </span>
                <span class="text-[10px] text-gray-600">{{ msg.content }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
