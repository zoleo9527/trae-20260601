<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { X, User, DollarSign, FileText, Camera, MessageSquare, Image as ImageIcon, Clock } from 'lucide-vue-next'
import { useOrdersStore } from '@/stores/orders'
import { useRoleStore } from '@/stores/role'
import { STATUS_LABELS, ROLE_LABELS, FEE_STATUS_LABELS } from '@/types'
import type { OrderStatus } from '@/types'
import TimelineView from './TimelineView.vue'
import RemarkInput from './RemarkInput.vue'

const ordersStore = useOrdersStore()
const roleStore = useRoleStore()

const order = computed(() => ordersStore.selectedOrder)

const remarkInputRef = ref<HTMLElement | null>(null)

const feeForm = ref({
  adjustAmount: 0,
  adjustReason: '',
  evidenceSummary: '',
  screenshotThumbnails: [] as string[],
})

const showFeeForm = ref(false)
const evidenceExpanded = ref(false)

const statusStyle: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  warehousing: 'bg-blue-100 text-blue-700',
  fee_adjusting: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
}

const is = (status: OrderStatus) => order.value?.status === status

const showApprove = computed(() =>
  roleStore.currentRole === 'after_sales' && is('pending_review')
)
const showReject = computed(() =>
  roleStore.currentRole === 'after_sales' && is('pending_review')
)
const showFeeAdjust = computed(() =>
  roleStore.currentRole === 'after_sales' && is('approved') && !order.value?.feeAdjustment
)
const showConfirmInbound = computed(() =>
  roleStore.currentRole === 'warehouse' && is('warehousing')
)
const showConfirmOutbound = computed(() =>
  roleStore.currentRole === 'warehouse' && is('approved') && order.value?.returnType === 'exchange'
)
const showApproveFee = computed(() =>
  (roleStore.currentRole === 'after_sales' || roleStore.currentRole === 'sales_clerk') && is('fee_adjusting') && order.value?.feeAdjustment?.status === 'pending'
)

function handleApprove() {
  if (order.value) ordersStore.updateOrderStatus(order.value.id, 'approved')
}

function handleReject() {
  if (order.value) ordersStore.updateOrderStatus(order.value.id, 'rejected')
}

function handleFeeAdjust() {
  showFeeForm.value = true
}

function submitFeeForm() {
  if (!order.value || !feeForm.value.adjustReason) return
  ordersStore.createFeeAdjustment(order.value.id, {
    adjustAmount: feeForm.value.adjustAmount,
    adjustReason: feeForm.value.adjustReason,
    evidenceSummary: feeForm.value.evidenceSummary || '暂无依据摘要',
    screenshotThumbnails: feeForm.value.screenshotThumbnails,
    status: 'pending',
    approvedBy: '',
  })
  showFeeForm.value = false
  feeForm.value = { adjustAmount: 0, adjustReason: '', evidenceSummary: '', screenshotThumbnails: [] }
}

function handleApproveFee() {
  if (order.value) ordersStore.approveFeeAdjustment(order.value.id)
}

function handleRejectFee() {
  if (order.value) ordersStore.rejectFeeAdjustment(order.value.id)
}

function handleInbound() {
  if (order.value) ordersStore.updateOrderStatus(order.value.id, 'completed')
}

function handleOutbound() {
  if (order.value) ordersStore.updateOrderStatus(order.value.id, 'completed')
}

function focusRemark() {
  nextTick(() => {
    remarkInputRef.value?.querySelector('textarea')?.focus()
  })
}
</script>

<template>
  <div v-if="ordersStore.detailOpen" class="fixed inset-0 z-40 flex justify-end">
    <div class="absolute inset-0 bg-black/30" @click="ordersStore.closeDetail" />
    <div
      class="relative w-[560px] bg-white h-full shadow-2xl flex flex-col animate-slide-in"
    >
      <div class="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-bold text-[#1B4965]">
            {{ order?.orderNo }}
          </h2>
          <span
            v-if="order"
            class="px-2 py-0.5 rounded-full text-xs font-medium"
            :class="statusStyle[order.status]"
          >
            {{ STATUS_LABELS[order.status] }}
          </span>
          <span
            v-if="order?.isStuck"
            class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse"
          >
            卡单
          </span>
        </div>
        <button
          class="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          @click="ordersStore.closeDetail"
        >
          <X :size="20" class="text-gray-500" />
        </button>
      </div>

      <div v-if="order" class="flex-1 overflow-y-auto p-4 space-y-5">
        <div v-if="order.isStuck && order.stuckReason" class="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2.5 border border-red-200">
          <Clock :size="16" class="text-red-500 shrink-0 mt-0.5" />
          <div>
            <div class="text-xs font-semibold text-red-700">卡单原因</div>
            <div class="text-xs text-red-600 mt-0.5">{{ order.stuckReason }}</div>
            <div v-if="order.stuckStep" class="text-xs text-[#E8871E] mt-1 font-medium">
              阻塞步骤：{{ order.stuckStep }}（{{ ROLE_LABELS[order.assignedRole] }}待处理）
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-semibold text-[#1B4965]">
            <User :size="16" />
            客户与退换信息
          </div>
          <div class="bg-[#F7F9FC] rounded-lg p-3 text-sm space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-500">客户名称</span>
              <span>{{ order.customerName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">产品名称</span>
              <span>{{ order.productName }} × {{ order.quantity }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">退回原因</span>
              <span class="font-medium text-gray-800">{{ order.returnReason }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">责任方</span>
              <span class="font-medium text-[#E8871E]">{{ order.responsibleParty }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">退换类型</span>
              <span>{{ order.returnType === 'return' ? '退货' : '换货' }}</span>
            </div>
          </div>
        </div>

        <div v-if="order.feeAdjustment" class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-semibold text-[#1B4965]">
            <DollarSign :size="16" />
            费用调整
            <span
              class="px-2 py-0.5 rounded-full text-xs font-medium"
              :class="order.feeAdjustment.status === 'approved' ? 'bg-green-100 text-green-700' : order.feeAdjustment.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'"
            >
              {{ FEE_STATUS_LABELS[order.feeAdjustment.status] }}
            </span>
          </div>
          <div class="bg-[#F7F9FC] rounded-lg p-3 text-sm space-y-1.5">
            <div class="flex justify-between">
              <span class="text-gray-500">调整金额</span>
              <span class="font-semibold text-[#E8871E]">¥{{ order.feeAdjustment.adjustAmount.toFixed(2) }}</span>
            </div>
            <div>
              <span class="text-gray-500">调整原因</span>
              <p class="text-gray-700 mt-0.5">{{ order.feeAdjustment.adjustReason }}</p>
            </div>
            <div>
              <span class="text-gray-500">依据摘要</span>
              <p class="text-gray-700 mt-0.5">{{ order.feeAdjustment.evidenceSummary }}</p>
            </div>
            <button
              class="w-full flex items-center gap-1.5 text-[#1B4965] hover:underline text-xs font-medium mt-1"
              @click="evidenceExpanded = !evidenceExpanded"
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
              <div v-if="evidenceExpanded" class="mt-2 grid grid-cols-3 gap-2 bg-white rounded-lg border border-[#E2E8F0] p-2">
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
                  <div class="text-xs text-gray-600 mb-1">{{ order.feeAdjustment.evidenceSummary }}</div>
                  <div class="grid grid-cols-2 gap-1">
                    <div
                      v-for="(thumb, i) in order.feeAdjustment.screenshotThumbnails"
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

        <div v-if="showFeeForm" class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-semibold text-[#1B4965]">
            <DollarSign :size="16" />
            新建费用调整
          </div>
          <div class="bg-[#F7F9FC] rounded-lg p-3 text-sm space-y-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">调整金额（负数为扣减）</label>
              <input
                v-model.number="feeForm.adjustAmount"
                type="number"
                class="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4965]/20 focus:border-[#1B4965]"
                placeholder="例如 -450"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">调整原因</label>
              <textarea
                v-model="feeForm.adjustReason"
                rows="2"
                class="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4965]/20 focus:border-[#1B4965]"
                placeholder="说明费用调整原因..."
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">依据摘要</label>
              <textarea
                v-model="feeForm.evidenceSummary"
                rows="2"
                class="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4965]/20 focus:border-[#1B4965]"
                placeholder="现场拍照、聊天截图、供应商确认等依据摘要..."
              />
            </div>
            <div class="flex gap-2 justify-end">
              <button
                class="px-3 py-1.5 text-sm rounded-lg border border-[#E2E8F0] text-gray-600 hover:bg-gray-50 transition-colors"
                @click="showFeeForm = false"
              >
                取消
              </button>
              <button
                :disabled="!feeForm.adjustReason"
                class="px-3 py-1.5 bg-[#E8871E] text-white text-sm rounded-lg hover:bg-[#c97418] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                @click="submitFeeForm"
              >
                提交费用调整
              </button>
            </div>
          </div>
        </div>

        <div v-if="order.remarks.length" class="space-y-2">
          <div class="text-sm font-semibold text-[#1B4965]">补充备注（{{ order.remarks.length }}）</div>
          <div class="space-y-1.5">
            <div
              v-for="r in order.remarks"
              :key="r.id"
              class="flex items-start gap-2 bg-[#F7F9FC] rounded-lg px-3 py-2"
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
                <p class="text-sm text-gray-600 mt-0.5">{{ r.content }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-semibold text-[#1B4965]">操作记录</div>
          <TimelineView :order-id="order.id" />
        </div>
      </div>

      <div class="border-t border-[#E2E8F0] p-4 space-y-3">
        <div v-if="order" class="flex flex-wrap gap-2">
          <button
            v-if="roleStore.currentRole === 'sales_clerk'"
            class="px-3 py-1.5 bg-[#1B4965] text-white text-sm rounded-lg hover:bg-[#163b52] transition-colors"
            @click="focusRemark"
          >
            补充备注
          </button>
          <button
            v-if="showApprove"
            class="px-3 py-1.5 bg-[#2D936C] text-white text-sm rounded-lg hover:bg-[#247a59] transition-colors"
            @click="handleApprove"
          >
            审核通过
          </button>
          <button
            v-if="showReject"
            class="px-3 py-1.5 bg-[#E8871E] text-white text-sm rounded-lg hover:bg-[#c97418] transition-colors"
            @click="handleReject"
          >
            驳回
          </button>
          <button
            v-if="showFeeAdjust"
            class="px-3 py-1.5 bg-[#E8871E] text-white text-sm rounded-lg hover:bg-[#c97418] transition-colors"
            @click="handleFeeAdjust"
          >
            发起费用调整
          </button>
          <button
            v-if="showApproveFee"
            class="px-3 py-1.5 bg-[#2D936C] text-white text-sm rounded-lg hover:bg-[#247a59] transition-colors"
            @click="handleApproveFee"
          >
            批准费用调整
          </button>
          <button
            v-if="showApproveFee"
            class="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
            @click="handleRejectFee"
          >
            驳回费用调整
          </button>
          <button
            v-if="showConfirmInbound"
            class="px-3 py-1.5 bg-[#2D936C] text-white text-sm rounded-lg hover:bg-[#247a59] transition-colors"
            @click="handleInbound"
          >
            确认入库
          </button>
          <button
            v-if="showConfirmOutbound"
            class="px-3 py-1.5 bg-[#2D936C] text-white text-sm rounded-lg hover:bg-[#247a59] transition-colors"
            @click="handleOutbound"
          >
            确认出库
          </button>
        </div>
        <div ref="remarkInputRef">
          <RemarkInput v-if="order" :order-id="order.id" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
