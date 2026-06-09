<script setup lang="ts">
import { computed, ref } from 'vue'
import { AlertTriangle, ChevronDown, ChevronUp, MessageSquare, Clock, ArrowRight } from 'lucide-vue-next'
import type { Order, UserRole } from '@/types'
import { STATUS_LABELS, ROLE_LABELS, FEE_STATUS_LABELS } from '@/types'
import { useRoleStore } from '@/stores/role'
import FeeAdjustmentInline from './FeeAdjustmentInline.vue'

const props = defineProps<{ order: Order }>()
const emit = defineEmits<{ click: []; viewEvidence: [] }>()

const roleStore = useRoleStore()
const remarksExpanded = ref(false)

const statusStyle: Record<string, string> = {
  pending_review: 'bg-gray-100 text-gray-600',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  warehousing: 'bg-blue-100 text-blue-700',
  fee_adjusting: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
}

const returnTypeLabel: Record<string, string> = {
  return: '退货',
  exchange: '换货',
}

const rolePendingAction: Record<UserRole, Record<string, string>> = {
  sales_clerk: {
    pending_review: '待提交申请',
    rejected: '重新提交申请',
    fee_adjusting: '待确认费用调整',
    completed: '已完结',
  },
  warehouse: {
    approved: '待确认出库',
    warehousing: '待确认入库',
    fee_adjusting: '等待费用调整',
    completed: '已完结',
  },
  after_sales: {
    pending_review: '待审核',
    approved: '待发起费用调整',
    fee_adjusting: '修正费用调整',
    completed: '已完结',
  },
}

const pendingAction = computed(() => {
  if (props.order.assignedRole !== roleStore.currentRole) return null
  const map = rolePendingAction[roleStore.currentRole]
  return map[props.order.status] ?? null
})

const latestRemark = computed(() => {
  if (props.order.remarks.length === 0) return null
  return props.order.remarks[props.order.remarks.length - 1]
})
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 space-y-3"
    :class="{
      'border-l-4 border-l-red-500 bg-red-50/30': order.isStuck,
      'border-l-4 border-l-transparent': !order.isStuck,
    }"
    @click="emit('click')"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="space-y-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-bold text-[#1B4965]">{{ order.orderNo }}</span>
          <span
            v-if="order.isStuck"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse"
          >
            <AlertTriangle :size="10" />
            卡单
          </span>
          <span
            v-if="pendingAction && order.assignedRole === roleStore.currentRole"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#1B4965] text-white text-xs rounded-full"
          >
            <ArrowRight :size="10" />
            {{ pendingAction }}
          </span>
        </div>
        <div class="text-sm text-gray-600">
          {{ order.customerName }} · {{ order.productName }} × {{ order.quantity }}
        </div>
      </div>
      <span
        class="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
        :class="statusStyle[order.status]"
      >
        {{ STATUS_LABELS[order.status] }}
      </span>
    </div>

    <div v-if="order.isStuck && order.stuckReason" class="flex items-start gap-1.5 bg-red-50 rounded-lg px-2.5 py-1.5">
      <Clock :size="12" class="text-red-500 shrink-0 mt-0.5" />
      <span class="text-xs text-red-600 font-medium">{{ order.stuckReason }}</span>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
        退回原因：{{ order.returnReason }}
      </span>
      <span class="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-100">
        责任方：{{ order.responsibleParty }}
      </span>
      <span class="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-100">
        {{ returnTypeLabel[order.returnType] }}
      </span>
      <span
        v-if="order.feeAdjustment"
        class="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-100"
      >
        费用调整：¥{{ order.feeAdjustment.adjustAmount.toFixed(2) }}（{{ FEE_STATUS_LABELS[order.feeAdjustment.status] }}）
      </span>
    </div>

    <FeeAdjustmentInline
      v-if="order.feeAdjustment"
      :fee-adjustment="order.feeAdjustment"
      :order-id="order.id"
      @view-evidence="emit('viewEvidence')"
      @click.stop
    />

    <div v-if="latestRemark" class="border-t border-[#E2E8F0] pt-2">
      <button
        class="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        @click.stop="remarksExpanded = !remarksExpanded"
      >
        <MessageSquare :size="12" />
        <span class="font-medium">最新备注</span>
        <span class="text-gray-400">{{ latestRemark.author }}</span>
        <span class="text-gray-300">·</span>
        <span class="text-gray-400 truncate">{{ latestRemark.content }}</span>
        <component :is="remarksExpanded ? ChevronUp : ChevronDown" :size="12" class="ml-auto shrink-0" />
      </button>
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="remarksExpanded" class="mt-2 space-y-1.5">
          <div
            v-for="r in order.remarks"
            :key="r.id"
            class="flex items-start gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5"
          >
            <span
              class="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
              :class="{
                'bg-blue-400': r.role === 'sales_clerk',
                'bg-green-400': r.role === 'warehouse',
                'bg-orange-400': r.role === 'after_sales',
              }"
            />
            <div class="min-w-0">
              <span class="text-xs font-medium text-[#1B4965]">{{ r.author }}</span>
              <span class="text-xs text-gray-400 ml-1">{{ ROLE_LABELS[r.role] }}</span>
              <span class="text-xs text-gray-300 ml-1">{{ r.createdAt }}</span>
              <p class="text-xs text-gray-600 mt-0.5">{{ r.content }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
